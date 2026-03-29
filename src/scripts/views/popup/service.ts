import { getApiUrl, getLanguage, isCuratorMode, getPointListStyle } from './state';
import { applyHeaderColor } from './theme';

interface ServicePoint {
    status: string;
    title: string;
    case: {
        classification?: string;
        localized_title?: string | null;
    };
    document_id?: number
}

interface ServiceDocument {
    id: number
    name: string
    url: string
}

interface ServiceResponse {
    name: string;
    rating?: string;
    points: ServicePoint[];
    documents: ServiceDocument[]
}

interface SearchResponse {
    services: Array<{
        id: string;
        urls: string[];
    }>;
}

interface FilteredPoints {
    blocker: ServicePoint[];
    bad: ServicePoint[];
    good: ServicePoint[];
    neutral: ServicePoint[];
}

export async function displayServiceDetails(
    id: string,
    options: { unverified?: boolean } = {}
): Promise<void> {
    try {
        const language = getLanguage();
        const response = await fetch(
            `https://${getApiUrl()}/service/v3?id=${encodeURIComponent(id)}&lang=${encodeURIComponent(language)}`
        );

        if (!response.ok) {
            hideLoadingState();
            const errorDescription = await formatHttpError(response);
            showErrorOverlay(
                'Unable to load service details.',
                errorDescription
            );
            return;
        }

        const data = (await response.json()) as ServiceResponse;
        const rating = data.rating;

        updateServiceName(data.name);
        updateTitle(data.name);
        updateGrade(rating);
        updatePointsCount(data.points.length);
        revealLoadedState(options.unverified === true);

        const pointListStyle = getPointListStyle() //check the user preferences to show the list accordingly

        if (pointListStyle === "docCategories") {
            populateListDocCategories(data.points, data.documents);
        } else if (pointListStyle === "unified") {
            populateListUnified(data.points)
        } else {
            console.error("Unsupported pointListStyle", pointListStyle); 
        }


    } catch (error) {
        hideLoadingState();
        showErrorOverlay(
            'Unable to load service details.',
            formatUnknownError(error)
        );
    }
}

export async function searchService(term: string): Promise<string | undefined> {
    try {
        const response = await fetch(
            `https://${getApiUrl()}/search/v5/?query=${encodeURIComponent(term)}`
        );

        if (response.status !== 200) {
            hideLoadingState();
            const errorDescription = await formatHttpError(response);
            showErrorOverlay(
                'Unable to search for matching services.',
                errorDescription
            );
            return undefined;
        }

        const data = (await response.json()) as SearchResponse;

        if (data.services.length === 0) {
            return undefined;
        }

        const [firstService] = data.services;
        if (firstService) {
            for (const url of firstService.urls) {
                if (url === term) {
                    return firstService.id;
                }
            }
        }

        return undefined;
    } catch (error) {
        hideLoadingState();
        showErrorOverlay(
            'Unable to search for matching services.',
            formatUnknownError(error)
        );
        return undefined;
    }
}

function updateServiceName(name: string): void {
    const serviceNames = document.getElementsByClassName('serviceName');
    for (const element of Array.from(serviceNames)) {
        (element as HTMLElement).innerText = name;
    }
}

function updateTitle(name: string): void {
    const titleElement = document.getElementById('serviceTitle');
    if (titleElement) {
        titleElement.innerText = name;
    }
}

function updateGrade(rating?: string): void {
    const gradeLabel = document.getElementById('gradelabel');
    const gradeElement = document.getElementById('grade');

    if (!gradeElement) {
        return;
    }

    if (rating) {
        if (gradeLabel) {
            gradeLabel.classList.add(rating.toLowerCase());
        }
        void applyHeaderColor(rating.toLowerCase());
        gradeElement.innerText = rating;
    } else {
        gradeElement.innerText = 'N/A';
    }
}

function updatePointsCount(count: number): void {
    const pointsCount = document.getElementById('pointsCount');
    if (pointsCount) {
        pointsCount.innerText = count.toString();
    }
}

function revealLoadedState(unverified: boolean): void {
    const loadingElement = document.getElementById('loading');
    const loadedElement = document.getElementById('loaded');

    if (loadingElement) {
        loadingElement.style.opacity = '0';
        setTimeout(() => {
            loadingElement.style.display = 'none';
        }, 200);
    }

    if (loadedElement) {
        loadedElement.style.filter = 'none';
    }

    if (unverified) {
        showElement('notreviewedShown');
    }
}

function populateListUnified(allPoints: ServicePoint[]) {
    const documentList = document.getElementById('documentList');
    const doc = document.createElement('div');
    const temp = `
        <div class="">
            <div id="pointList" class="pointList">
            </div>
        </div>`
    ;
    doc.innerHTML = temp.trim();
    documentList!.appendChild(doc.firstChild!);

    const pointsList = document.getElementById('pointList');
    if (!pointsList) {
        return;
    }

    pointsList.style.display = 'block';
    pointsList.innerHTML = '';

    const filteredPoints = filterPoints(allPoints);

    createPointList(filteredPoints.blocker, pointsList, false);
    createPointList(filteredPoints.bad, pointsList, false);
    createPointList(filteredPoints.good, pointsList, false);
    createPointList(filteredPoints.neutral, pointsList, true);
}


function populateListDocCategories(allPoints: ServicePoint[], documents: ServiceDocument[]) {
    const documentList = document.getElementById('documentList');
    //sort documents alphabetically
    try {
        documents.sort((a, b) => 
            a.name.localeCompare(b.name)
        )
    } catch (error) {
        console.warn(error)
    }

    // prepare the Document Index
    const indexElement = document.getElementById("documentIndex") as HTMLElement
    indexElement.style = "display:block"

        // Split points by Document and display them seperatly
    for (let i of documents) {
        const element = i;

        const docPoints = allPoints.filter((point:ServicePoint) => point.document_id === element.id) //only points of the current document
        const sortedPoints = filterPoints(docPoints)


        addDocumentToIndex(element, indexElement, sortedPoints)

        // check if the document has points and either display it with the points else add them to the bottom
        if (sortedPoints.blocker.length + sortedPoints.bad.length + sortedPoints.neutral.length + sortedPoints.good.length > 0) { //documents with points
            const doc = document.createElement('div');
            const temp = `
            <div class="">
                <div class="documentHeader">
                    <h3 id="documents_${element.id}" class="documentTitle" >${element.name}</h3>
                    <a href="${element.url}" target="_blank">Read Original</a>
                </div>
                    <div id="pointList_${element.id}" class="pointList">
                        <a style="display: none">...</a>
                    </div>
            </div>`;
            doc.innerHTML = temp.trim();
            documentList!.appendChild(doc.firstChild!);
    
            const pointsList = document.getElementById(`pointList_${element.id}`)!
    
            createSortedPoints(sortedPoints,pointsList)
        } else { //documents without points
            const docsWithoutPointsWraper = document.getElementById('docsWithoutPointsWraper')
            const docsWithoutPoints = document.getElementById('docsWithoutPoints')
            
            if (docsWithoutPoints?.style.display === "none") {
                docsWithoutPoints.style.display = "block"
            }
            const doc = document.createElement('div');
            const temp = `
                <div class="documentHeader">
                    <h3 class="documentTitle" id="documents_${element.id}">${element.name}</h3>
                    <a href="${element.url}" target="_blank">Read Original></a>
                </div>`;
            doc.innerHTML = temp.trim();
            docsWithoutPointsWraper!.appendChild(doc.firstChild!);
        }
    }
    //display points not linked to a document
    const noDocPoints = allPoints.filter((point: ServicePoint) => point.document_id === undefined)
    if (noDocPoints.length > 0) {
        const doc = document.createElement('div');
        const temp = `
        <div class="">
            <div class="documentHeader">
                <h3 class="documentTitle">Points not linked to a Document</h3>
            </div>
                <div id="pointList_unlinkedPoints" class="pointList">
                    <a style="display: none">...</a>
                </div>
        </div>`;
        doc.innerHTML = temp.trim();
        documentList!.appendChild(doc.firstChild!);
        const sortedPoints = filterPoints(noDocPoints)
        const pointsList = document.getElementById(`pointList_unlinkedPoints`)!
        createSortedPoints(sortedPoints,pointsList)

    }
}
function filterPoints(points:ServicePoint[]) {
        if (isCuratorMode()) {
            points = points.filter(
                (point) =>
                    point.status === 'approved' || point.status === 'pending'
            );
        } else {
            points = points.filter((point) => point.status === 'approved');
        }
        let filteredPoints:FilteredPoints = {
            blocker: [],
            bad: [],
            good: [],
            neutral: []
        }
        filteredPoints.blocker = points.filter(
            (point) => point.case.classification === 'blocker'
        );
        filteredPoints.bad = points.filter(
            (point) => point.case.classification === 'bad'
        );
        filteredPoints.good = points.filter(
            (point) => point.case.classification === 'good'
        );
        filteredPoints.neutral = points.filter(
            (point) => point.case.classification === 'neutral'
        );
        return filteredPoints
}

function createSortedPoints(sortedPoints:FilteredPoints,pointsList:HTMLElement) {
            if (sortedPoints.blocker) {
                createPointList(sortedPoints.blocker, pointsList, false);
            }    
            if (sortedPoints.bad) {
                createPointList(sortedPoints.bad, pointsList, false);
            }
            if (sortedPoints.good) {
                createPointList(sortedPoints.good, pointsList, false);
            }
            if (sortedPoints.neutral) {
                createPointList(sortedPoints.neutral, pointsList, true);
            }
}

function createPointList(pointsFiltered: ServicePoint[], pointsList: HTMLElement, last: boolean) {
    let added = 0;
    for (let i = 0; i < pointsFiltered.length; i++) {
        const point = document.createElement('div');
        const pointTitle = pointsFiltered[i]!.case?.localized_title ?? pointsFiltered[i]!.title;

        let temp = `
        <div class="point ${pointsFiltered[i]!.case.classification}">
            <img src="icons/${pointsFiltered[i]!.case.classification}.svg">
            <p>${pointTitle}</p>
            ${renderCuratorTag(pointsFiltered[i]!.status)}
        </div>`;
        point.innerHTML = temp.trim();
        pointsList.appendChild(point.firstChild!);
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
function addDocumentToIndex(serviceDocument:ServiceDocument, indexElement:HTMLElement, points:FilteredPoints) { //creates an index of the documents
    const list = document.createElement('li')
    const item = document.createElement('a')

    const pointSummary = documentIndexPointSummary(points)

    item.innerText = serviceDocument.name
    item.href = `#documents_${serviceDocument.id}`


    list.appendChild(item)
    list.appendChild(pointSummary)

    indexElement.appendChild(list)

    function documentIndexPointSummary(points:FilteredPoints) { //adds the number of points of each classification as a summary below the document index entry
        const pointsSummanry = document.createElement("div")
        pointsSummanry.classList = "indexSummaryWraper"

        createSummary("good")
        createSummary("neutral")
        createSummary("bad")
        createSummary("blocker")

        return pointsSummanry

        function createSummary(classification:"good" | "bad" | "neutral" | "blocker") {
            const wrapper = document.createElement("div")
            const count = points[classification].length

            //add the classification icon
            const img = document.createElement("img");
            img.src = `icons/${classification}.svg`

            wrapper.appendChild(img)


            //add number of points of classification
            const div = document.createElement("div");
            div.innerText = `${count}`;
            div.classList.add("indexSummary", classification);

            wrapper.appendChild(div)

            pointsSummanry.appendChild(wrapper)
        }
    }
}





function renderCuratorTag(status: string): string {
    if (!isCuratorMode() || status === 'approved') {
        return '';
    }
    return "<img src='icons/pending.svg'></img>";
}

function hideLoadingState(): void {
    const loadingElement = document.getElementById('loading');
    const loadedElement = document.getElementById('loaded');

    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    if (loadedElement) {
        loadedElement.style.display = 'none';
    }
}

function showElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'block';
    }
}

async function formatHttpError(response: Response): Promise<string> {
    const statusSummary = `${response.status} ${response.statusText}`.trim();

    try {
        const contentType = response.headers.get('content-type') ?? '';
        const bodyText = await response.text();

        if (!bodyText) {
            return statusSummary || 'Request failed.';
        }

        if (contentType.includes('application/json')) {
            try {
                const parsed = JSON.parse(bodyText) as {
                    error?: string;
                    message?: string;
                } | null;

                const jsonMessage =
                    typeof parsed?.message === 'string'
                        ? parsed.message
                        : typeof parsed?.error === 'string'
                          ? parsed.error
                          : undefined;

                if (jsonMessage) {
                    return statusSummary
                        ? `${statusSummary} – ${jsonMessage}`
                        : jsonMessage;
                }
            } catch {
                // Fall back to using the raw body text below.
            }
        }

        const trimmedBody = bodyText.trim();
        if (!trimmedBody) {
            return statusSummary || 'Request failed.';
        }

        return statusSummary
            ? `${statusSummary} – ${trimmedBody}`
            : trimmedBody;
    } catch {
        return statusSummary || 'Request failed.';
    }
}

function showErrorOverlay(title: string, description: string): void {
    const errorContainer = document.getElementById('error');
    const titleElement = document.getElementById('errorTitle');
    const descriptionElement = document.getElementById('errorDescription');

    if (titleElement) {
        titleElement.innerText = title;
    }

    if (descriptionElement) {
        descriptionElement.innerText = description;
    }

    if (errorContainer) {
        errorContainer.style.display = 'flex';
    }
}

function formatUnknownError(error: unknown): string {
    if (error instanceof Error) {
        return error.message || error.name;
    }

    if (typeof error === 'string') {
        return error;
    }

    try {
        return JSON.stringify(error);
    } catch {
        return 'An unexpected error occurred.';
    }
}
