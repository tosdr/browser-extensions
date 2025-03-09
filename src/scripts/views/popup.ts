var curatorMode = false;
var renderDonationReminder = false;

var apiUrl = 'api.tosdr.org';

async function donationReminderLogic() {
    chrome.storage.local.get('displayDonationReminder', function (result) {
        console.log('displayDonationReminder:', result.displayDonationReminder);
        if (result.displayDonationReminder.active === true) {
            try {
                const currentDate = new Date();
                const currentMonth = currentDate.getMonth();
                const currentYear = currentDate.getFullYear();
                // Reset the badge text for all tabs
                chrome.tabs.query({}, (tabs) => {
                    for (let tab of tabs) {
                        chrome.action.setBadgeText({ text: '', tabId: tab.id });
                    }
                });
                chrome.storage.local.set({
                    lastDismissedReminder: {
                        month: currentMonth,
                        year: currentYear,
                    },
                    displayDonationReminder: {
                        active: false,
                        allowedPlattform:
                            result.displayDonationReminder.allowedPlattform,
                    },
                });
                document.getElementById('donationReminder')!.style.display =
                    'block';
            } catch (error) {
                console.log(error);
            }
        }
    });
}

async function handleUrlInURLIfExists(urlOriginal: string) {
    var url = urlOriginal.split('?url=')[1];
    if (!url) {
        // no service-id in url, show error
        donationReminderLogic();
        document.getElementById('id')!.innerHTML =
            'Error: no service-id in url';
        document.getElementById('loading')!.style.display = 'none';
        document.getElementById('loaded')!.style.display = 'none';
        document.getElementById('nourl')!.style.display = 'block';
        document.getElementById('pointList')!.style.display = 'none';
        return;
    }

    var result = await searchToSDR(url);

    if (result) {
        document.getElementById('phoenixButton')!.onclick = function () {
            window.open(`https://edit.tosdr.org/services/${result}`);
        };

        themeHeaderIfEnabled(result);

        const logo = document.getElementById('logo') as HTMLImageElement;
        logo.src = `https://s3.tosdr.org/logos/${result}.png`;
        document.getElementById('id')!.innerText = result;

        getServiceDetails(result, true);
    } else {
        donationReminderLogic();
        document.getElementById('id')!.innerText =
            'Error: no service-id in url';
        document.getElementById('loading')!.style.display = 'none';
        document.getElementById('loaded')!.style.display = 'none';
        document.getElementById('nourl')!.style.display = 'block';
        document.getElementById('pointList')!.style.display = 'none';
    }
}

function getServiceIDFromURL(url: string) {
    // get parameters from url
    var serviceID = url.split('?service-id=')[1];
    // whoops, no service-id in url, check if there's a url= parameter, maybe we just do not have it yet
    if (!serviceID) {
        handleUrlInURLIfExists(url);
        return;
    }

    // when you click on things in the popup, it appends a # to the url, so we need to remove that
    serviceID = serviceID.replace('#', '');

    if (serviceID === '-1') {
        // -1 is the default value for when the service is not found
        donationReminderLogic();
        document.getElementById('id')!.innerHTML =
            'Error: no service-id in url';
        document.getElementById('loading')!.style.display = 'none';
        document.getElementById('loaded')!.style.display = 'none';
        document.getElementById('nourl')!.style.display = 'block';
        document.getElementById('notreviewed')!.style.display = 'block';
        document.getElementById('pointList')!.style.display = 'none';
        document.getElementById('edittext')!.onclick = function () {
            window.open('https://edit.tosdr.org');
        };
        return;
    }

    document.getElementById('phoenixButton')!.onclick = function () {
        window.open(`https://edit.tosdr.org/services/${serviceID}`);
    };
    document.getElementById('webbutton')!.onclick = function () {
        window.open(`https://tosdr.org/en/service/${serviceID}`);
    };

    themeHeaderIfEnabled(serviceID);

    const logo = document.getElementById('logo') as HTMLImageElement;
    logo.src = `https://s3.tosdr.org/logos/${serviceID}.png`;
    document.getElementById('id')!.innerHTML = serviceID;

    getServiceDetails(serviceID);
}

function themeHeaderIfEnabled(serviceID: string) {
    chrome.storage.local.get(['themeHeader'], function (result) {
        if (result.themeHeader) {
            const blurredTemplate = `.header::before {
                content: '';
                position: absolute;
                background-image: url('https://s3.tosdr.org/logos/${serviceID}.png');
                top: 0;
                left: 0;
                width: 100%;
                height: 90%;
                background-repeat: no-repeat;
                background-position: center;
                background-size: cover;
                filter: blur(30px);
                z-index: -2;
            }`;

            var styleElement = document.createElement('style');

            document.head.appendChild(styleElement);

            styleElement.sheet!.insertRule(blurredTemplate);
        }
    });
}

function themeHeaderColorIfEnabled(rating: string) {
    chrome.storage.local.get(['themeHeaderRating'], function (result) {
        if (result.themeHeaderRating) {
            const header = document.getElementById('headerPopup');
            header!.classList.add(rating);
        }
    });
}

async function getServiceDetails(id: string, unverified = false) {
    const service_url = `https://${apiUrl}/service/v3?id=${id}`;
    const response = await fetch(service_url);

    // check if we got a 200 response
    if (response.status >= 300) {
        document.getElementById('loading')!.style.display = 'none';
        document.getElementById('loaded')!.style.display = 'none';
        document.getElementById('error')!.style.display = 'flex';
        return;
    }

    const data = await response.json();

    const name = data.name;
    const rating = data.rating;
    const points = data.points;

    const serviceNames = document.getElementsByClassName('serviceName');

    for (let i = 0; i < serviceNames.length; i++) {
        (serviceNames[i] as HTMLElement).innerText = name;
    }

    document.getElementById('title')!.innerText = name;
    if (rating) {
        document
            .getElementById('gradelabel')!
            .classList.add(rating.toLowerCase());
        themeHeaderColorIfEnabled(rating.toLowerCase());
        document.getElementById('grade')!.innerText = rating;
    } else {
        document.getElementById('grade')!.innerText = 'N/A';
    }
    document.getElementById('pointsCount')!.innerText =
        points.length.toString();

    document.getElementById('loading')!.style.opacity = '0';
    document.getElementById('loaded')!.style.filter = 'none';
    setTimeout(function () {
        document.getElementById('loading')!.style.display = 'none';
    }, 200);

    if (unverified) {
        document.getElementById('notreviewedShown')!.style.display = 'block';
    }

    populateList(points);
}

function populateList(points: any) {
    const pointsList = document.getElementById('pointList');

    if (!curatorMode) {
        points = points.filter((point: any) => point.status === 'approved');
    } else {
        points = points.filter(
            (point: any) =>
                point.status === 'approved' || point.status === 'pending'
        );
    }

    const blockerPoints = points.filter(
        (point: any) => point.case.classification === 'blocker'
    );
    const badPoints = points.filter(
        (point: any) => point.case.classification === 'bad'
    );
    const goodPoints = points.filter(
        (point: any) => point.case.classification === 'good'
    );
    const neutralPoints = points.filter(
        (point: any) => point.case.classification === 'neutral'
    );

    createPointList(blockerPoints, pointsList, false);
    createPointList(badPoints, pointsList, false);
    createPointList(goodPoints, pointsList, false);
    createPointList(neutralPoints, pointsList, true);
}

function curatorTag(pointStatus: string) {
    if (!curatorMode || pointStatus === 'approved') {
        return '';
    }
    return "<img src='icons/pending.svg'></img>";
}

function createPointList(pointsFiltered: any, pointsList: any, last: boolean) {
    var added = 0;
    for (let i = 0; i < pointsFiltered.length; i++) {
        const point = document.createElement('div');
        var temp = `
        <div class="point ${pointsFiltered[i].case.classification}">
            <img src="icons/${pointsFiltered[i].case.classification}.svg">
            <p>${pointsFiltered[i].title}</p>
            ${curatorTag(pointsFiltered[i].status)}
        </div>`;
        point.innerHTML = temp.trim();
        pointsList.appendChild(point.firstChild);
        added++;
        if (i !== pointsFiltered.length - 1) {
            const divider = document.createElement('hr');
            pointsList.appendChild(divider);
        }
    }
    if (added !== 0 && !last) {
        const divider = document.createElement('hr');
        divider.classList.add('group');
        pointsList.appendChild(divider);
    }
}

async function searchToSDR(term: string) {
    const service_url = `https://${apiUrl}/search/v5/?query=${term}`;
    const response = await fetch(service_url);

    if (response.status !== 200) {
        document.getElementById('loading')!.style.display = 'none';
        document.getElementById('loaded')!.style.display = 'none';
        document.getElementById('error')!.style.display = 'flex';
        return;
    }

    const data = await response.json();

    if (data.services.length !== 0) {
        const urls = data.services[0].urls as string[];
        for (let i = 0; i < urls.length; i++) {
            if (urls[i] === term) {
                return data.services[0].id;
            }
        }
    }
}

getServiceIDFromURL(window.location.href);

// Get settings
chrome.storage.local.get(['darkmode', 'curatorMode', 'api'], function (result) {
    if (result.darkmode) {
        const body = document.querySelector('body')!;

        body.classList.toggle('dark-mode');
    }

    if (result.curatorMode) {
        document.getElementById('curator')!.style.display = 'block';
        curatorMode = true;
    } else {
        document.getElementById('curator')!.style.display = 'none';
    }

    if (result.api) {
        if (result.api.length !== 0) apiUrl = result.api;
    }
});

// Event listeners

document.getElementById('toggleButton')!.onclick = function () {
    const body = document.querySelector('body')!;

    body.classList.toggle('dark-mode');

    const darkmode = body.classList.contains('dark-mode');

    chrome.storage.local.set({ darkmode: darkmode });
};

document.getElementById('settingsButton')!.onclick = function () {
    chrome.runtime.openOptionsPage();
};

document.getElementById('sourceButton')!.onclick = function () {
    window.open('https://github.com/tosdr/browser-extensions');
};
document.getElementById('donationButton')!.onclick = function () {
    window.open('https://tosdr.org/en/sites/donate');
};

document.getElementById('source')!.onclick = function () {
    window.open('https://github.com/tosdr');
};

document.getElementById('opentosdr')!.onclick = function () {
    window.open('https://tosdr.org/');
};

// This is a hacky workaround for Firefox on desktop as it likes to resize the popup
// to the maximum width of the content, which is not what we want. Thanks, Mozilla.
function ifFirefoxDesktopResize() {
    // check useragent if firefox on desktop
    if (
        navigator.userAgent.includes('Firefox') &&
        !navigator.userAgent.includes('Mobile')
    ) {
        // resize window to stay at 350px
        document.body.style.width = '350px';
    }
}

ifFirefoxDesktopResize();
