import { getApiUrl, isCuratorMode } from './state';
import { applyHeaderColor } from './theme';

interface ServicePoint {
    status: string;
    title: string;
    case?: {
        classification?: string;
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
    const response = await fetch(
        `https://${getApiUrl()}/service/v3?id=${encodeURIComponent(id)}`
    );

    if (response.status >= 300) {
        hideLoadingState();
        showElement('error');
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
}

export async function searchService(term: string): Promise<string | undefined> {
    const response = await fetch(
        `https://${getApiUrl()}/search/v5/?query=${encodeURIComponent(term)}`
    );

    if (response.status !== 200) {
        hideLoadingState();
        showElement('error');
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
}

function updateServiceName(name: string): void {
    const serviceNames = document.getElementsByClassName('serviceName');
    for (const element of Array.from(serviceNames)) {
        (element as HTMLElement).innerText = name;
    }
}

function updateTitle(name: string): void {
    const titleElement = document.getElementById('title');
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
        wrapper.innerHTML = `
            <div class="point ${classification}">
                <img src="icons/${classification}.svg">
                <p>${point.title}</p>
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
