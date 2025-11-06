import { getApiUrl, getLanguage, isCuratorMode } from './state';
import { applyHeaderColor } from './theme';

interface ServicePoint {
    status: string;
    title: string;
    case?: {
        classification?: string;
        localized_title?: string | null;
    };
}

interface ServiceResponse {
    name: string;
    rating?: string;
    points: ServicePoint[];
}

interface SearchResponse {
    services: Array<{
        id: string;
        urls: string[];
    }>;
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

        populateList(data.points);
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

function populateList(points: ServicePoint[]): void {
    const pointsList = document.getElementById('pointList');
    if (!pointsList) {
        return;
    }

    pointsList.style.display = 'block';
    pointsList.innerHTML = '';

    const filteredPoints = filterPoints(points);

    appendPointGroup(filteredPoints.blocker, pointsList, false);
    appendPointGroup(filteredPoints.bad, pointsList, false);
    appendPointGroup(filteredPoints.good, pointsList, false);
    appendPointGroup(filteredPoints.neutral, pointsList, true);
}

function filterPoints(points: ServicePoint[]): {
    blocker: ServicePoint[];
    bad: ServicePoint[];
    good: ServicePoint[];
    neutral: ServicePoint[];
} {
    const curatedPoints = points.filter((point) => {
        if (!isCuratorMode()) {
            return point.status === 'approved';
        }
        return point.status === 'approved' || point.status === 'pending';
    });

    return {
        blocker: curatedPoints.filter(
            (point) => point.case?.classification === 'blocker'
        ),
        bad: curatedPoints.filter(
            (point) => point.case?.classification === 'bad'
        ),
        good: curatedPoints.filter(
            (point) => point.case?.classification === 'good'
        ),
        neutral: curatedPoints.filter(
            (point) => point.case?.classification === 'neutral'
        ),
    };
}

function appendPointGroup(
    points: ServicePoint[],
    container: HTMLElement,
    isLastGroup: boolean
): void {
    let added = 0;

    points.forEach((point, index) => {
        const wrapper = document.createElement('div');
        const classification = point.case?.classification ?? 'neutral';
        const pointTitle = point.case?.localized_title ?? point.title;
        wrapper.innerHTML = `
            <div class="point ${classification}">
                <img src="icons/${classification}.svg">
                <p>${pointTitle}</p>
                ${renderCuratorTag(point.status)}
            </div>
        `.trim();
        if (wrapper.firstChild) {
            container.appendChild(wrapper.firstChild as HTMLElement);
        }
        added += 1;

        if (index !== points.length - 1) {
            const divider = document.createElement('hr');
            container.appendChild(divider);
        }
    });

    if (added > 0 && !isLastGroup) {
        const divider = document.createElement('hr');
        divider.classList.add('group');
        container.appendChild(divider);
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
