import { useMemo, useState } from 'react';
import badIcon from '@/assets/icons/bad.svg';
import blockerIcon from '@/assets/icons/blocker.svg';
import goodIcon from '@/assets/icons/good.svg';
import neutralIcon from '@/assets/icons/neutral.svg';
import pendingIcon from '@/assets/icons/pending.svg';
import type { Classification, ServiceDetails, ServicePoint } from '@/utils/api';
import { LINKS } from '@/utils/constants';
import { ExternalLinkIcon, PencilIcon } from '@/utils/icons';
import { toGrade } from '@/utils/serviceDetection';
import { safeHttpUrl } from '@/utils/url';
import type { PopupPreferences } from './usePopupData';

const CLASSIFICATIONS: Classification[] = ['blocker', 'bad', 'good', 'neutral'];

const CLASSIFICATION_META: Record<Classification, { icon: string; label: string }> = {
    blocker: { icon: blockerIcon, label: 'Blocker' },
    bad: { icon: badIcon, label: 'Bad' },
    good: { icon: goodIcon, label: 'Good' },
    neutral: { icon: neutralIcon, label: 'Neutral' },
};

export function ServiceView({
    serviceId,
    details,
    fromSearch,
    prefs,
}: {
    serviceId: string;
    details: ServiceDetails;
    fromSearch: boolean;
    prefs: PopupPreferences;
}) {
    const grade = toGrade(details.rating);
    const logo = safeHttpUrl(details.image) ?? LINKS.logo(serviceId);
    const [logoFailed, setLogoFailed] = useState(false);
    const [filter, setFilter] = useState<Classification | null>(null);

    const grouped = useMemo(() => {
        const groups: Record<Classification, ServicePoint[]> = {
            blocker: [],
            bad: [],
            good: [],
            neutral: [],
        };
        for (const point of details.points) {
            const visible =
                point.status === 'approved' || (prefs.curatorMode && point.status === 'pending');
            if (!visible) {
                continue;
            }
            const classification = point.case?.classification;
            groups[classification && classification in groups ? classification : 'neutral'].push(point);
        }
        return groups;
    }, [details.points, prefs.curatorMode]);

    const total = CLASSIFICATIONS.reduce((sum, c) => sum + grouped[c].length, 0);
    const shownGroups = CLASSIFICATIONS.filter(
        (c) => grouped[c].length > 0 && (filter === null || filter === c)
    );

    const headerClass = [
        'header',
        prefs.themeHeaderRating && grade ? `grade-${grade.toLowerCase()}` : '',
    ].join(' ');

    return (
        <>
            <header className={headerClass}>
                {prefs.themeHeader && !logoFailed && (
                    <div
                        className="header-backdrop"
                        style={{ backgroundImage: `url(${JSON.stringify(logo)})` }}
                    />
                )}
                <div className="header-row">
                    {logoFailed ? (
                        <div className="logo logo-fallback" aria-hidden="true">
                            {details.name.slice(0, 1)}
                        </div>
                    ) : (
                        <img className="logo" src={logo} alt="" onError={() => setLogoFailed(true)} />
                    )}
                    <div className="header-text">
                        <h1 className="title">{details.name}</h1>
                        {(details.updated_at || prefs.curatorMode) && (
                            <p className="subtitle">
                                {[
                                    details.updated_at &&
                                        `Updated ${new Date(details.updated_at).toLocaleDateString()}`,
                                    prefs.curatorMode && `${details.points.length} points`,
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        )}
                    </div>
                    <div
                        className={`grade-badge ${grade ? `grade-${grade.toLowerCase()}` : 'grade-none'}`}
                        title={grade ? `Grade ${grade}` : 'Not graded yet'}
                    >
                        <span className="grade-badge-label">Grade</span>
                        <span className="grade-badge-letter">{grade ?? '–'}</span>
                    </div>
                </div>
                <div className="actions">
                    <a
                        className="action action-primary"
                        href={LINKS.service(serviceId)}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Full review on ToS;DR
                        <ExternalLinkIcon />
                    </a>
                    {prefs.curatorMode && (
                        <a
                            className="action action-secondary"
                            href={LINKS.phoenixService(serviceId)}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <PencilIcon />
                            Edit on Phoenix
                        </a>
                    )}
                </div>
            </header>

            {(fromSearch || details.is_comprehensively_reviewed === false) && (
                <p className="notice notice-warning">
                    We haven't fully reviewed these terms yet, so the grade may change. Help out on{' '}
                    <a href={LINKS.phoenixService(serviceId)} target="_blank" rel="noreferrer">
                        Phoenix
                    </a>
                    .
                </p>
            )}

            {total === 0 ? (
                <p className="notice">No points have been approved for this service yet.</p>
            ) : (
                <>
                    <div className="filters" role="group" aria-label="Filter points">
                        {CLASSIFICATIONS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                className={`filter ${c}`}
                                aria-pressed={filter === c}
                                disabled={grouped[c].length === 0}
                                onClick={() => setFilter(filter === c ? null : c)}
                                title={`Show only ${CLASSIFICATION_META[c].label.toLowerCase()} points`}
                            >
                                <img src={CLASSIFICATION_META[c].icon} alt="" />
                                <span className="filter-count">{grouped[c].length}</span>
                                <span className="filter-label">{CLASSIFICATION_META[c].label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="card points">
                        {shownGroups.map((c) => (
                            <section key={c} className="point-group" aria-label={CLASSIFICATION_META[c].label}>
                                {grouped[c].map((point) => (
                                    <PointRow
                                        key={point.id}
                                        point={point}
                                        classification={c}
                                        showPending={prefs.curatorMode}
                                    />
                                ))}
                            </section>
                        ))}
                    </div>
                </>
            )}

            {details.documents && details.documents.length > 0 && (
                <details className="card documents">
                    <summary>Documents ({details.documents.length})</summary>
                    <ul>
                        {details.documents.map((doc) => {
                            const href = safeHttpUrl(doc.url);
                            return (
                                <li key={doc.id}>
                                    {href ? (
                                        <a href={href} target="_blank" rel="noreferrer">
                                            {doc.name}
                                        </a>
                                    ) : (
                                        doc.name
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </details>
            )}
        </>
    );
}

function PointRow({
    point,
    classification,
    showPending,
}: {
    point: ServicePoint;
    classification: Classification;
    showPending: boolean;
}) {
    const title = point.case?.localized_title || point.title;
    const description = point.case?.description?.trim();
    const source = safeHttpUrl(point.source);
    const { icon, label } = CLASSIFICATION_META[classification];

    const heading = (
        <>
            <img className="point-icon" src={icon} alt={label} />
            <span className="point-title">{title}</span>
            {showPending && point.status !== 'approved' && (
                <img className="point-icon small" src={pendingIcon} alt="Pending" title="Pending review" />
            )}
        </>
    );

    if (!description && !source) {
        return <div className="point">{heading}</div>;
    }

    return (
        <details className="point-details">
            <summary className="point">{heading}</summary>
            <div className="point-body">
                {description && <p>{description}</p>}
                {source && (
                    <a href={source} target="_blank" rel="noreferrer">
                        Read in source document
                    </a>
                )}
            </div>
        </details>
    );
}
