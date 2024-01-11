const updateInput = document.getElementById('update') as HTMLInputElement;
const themeInput = document.getElementById('theme') as HTMLInputElement;
const themeRatingInput = document.getElementById('themeRating') as HTMLInputElement;
const curatorModeInput = document.getElementById('curatorMode') as HTMLInputElement;
const telemetryInput = document.getElementById('telemetry') as HTMLInputElement;
const apiInput = document.getElementById('api') as HTMLInputElement;


chrome.storage.local.get(
    [
        'db',
        'lastModified',
        'interval',
        'themeHeader',
        'themeHeaderRating',
        'curatorMode',
        'sentry',
        'api'
    ],
    function (result) {
        if (result.db) {
            const db = result.db;
            const lastModified = new Date(result.lastModified);

            document.getElementById('date')!.innerText =
                lastModified.toLocaleDateString('en-US');
            document.getElementById('indexed')!.innerText = db.length;
        } else {
            const elements = document.getElementsByClassName('dbavailable');
            for (let i = 0; i < elements.length; i++) {
                elements[i].remove();
            }
        }

        if (result.interval) {
            document.getElementById('days')!.innerText = result.interval;
            updateInput.value = result.interval;
        }

        if (result.themeHeader) {
            themeInput.checked = result.themeHeader;
        }

        if (result.themeHeaderRating) {
            themeRatingInput.checked = result.themeHeaderRating;
        }

        if (result.curatorMode) {
            curatorModeInput.checked = result.curatorMode;
        }

        if (result.api) {
            if (result.api.length !== 0) apiInput.value = result.api;
        }

        if (result.sentry) {
            telemetryInput.checked = result.sentry;
        }
    }
);

updateInput.onchange = function () {
    document.getElementById('days')!.innerText = updateInput.value;

    chrome.storage.local.set({ interval: updateInput.value }, function () {
        console.log('database update interval changed');
    });
};

themeInput.addEventListener('change', function () {
    chrome.storage.local.set(
        { themeHeader: themeInput.checked },
        function () {
            console.log('theme header value changed');
        }
    );
});

themeRatingInput.addEventListener('change', function () {
    chrome.storage.local.set(
        { themeHeaderRating: themeRatingInput.checked },
        function () {
            console.log('theme header (rating) value changed');
        }
    );
});

curatorModeInput.addEventListener('change', function () {
    chrome.storage.local.set(
        { curatorMode: curatorModeInput.checked },
        function () {
            console.log('curatormode has been toggled.');
        }
    );
});

apiInput.addEventListener('change', function () {
    chrome.storage.local.set(
        { api: apiInput.value },
        function () {
            console.log('api url has been changed.');
        }
    );
});

telemetryInput.addEventListener('change', function () {
    chrome.storage.local.set(
        { sentry: telemetryInput.checked },
        function () {
            console.log('telemetry has been toggled.');
        }
    );
});