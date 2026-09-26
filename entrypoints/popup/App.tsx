import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import errorIcon from '@/assets/icons/error.svg';
import loadingIcon from '@/assets/icons/loading.svg';
import { LINKS } from '@/utils/constants';
import { dismissDonationReminder } from '@/utils/donation';
import { ExternalLinkIcon, HeartIcon, PencilIcon } from '@/utils/icons';
import { darkmodeItem, donationReminderItem } from '@/utils/storage';
import { useStorageItem, useTheme } from '@/utils/useStorageItem';
import { ServiceView } from './ServiceView';
import { usePopupData } from './usePopupData';

export default function App() {
    const { state, prefs, retry } = usePopupData();
    const [darkmode, setDarkmode] = useStorageItem(darkmodeItem);
    useTheme(darkmode);

    const toggleTheme = () =>
        setDarkmode(document.documentElement.dataset.theme !== 'dark');

    return (
        <div className="popup">
            <DonationBanner />

            {state.kind === 'loading' && (
                <div className="state" role="status">
                    <img className="spinner" src={loadingIcon} alt="" />
                    <p>Loading…</p>
                </div>
            )}

            {state.kind === 'error' && (
                <div className="state" role="alert">
                    <img className="state-icon" src={errorIcon} alt="" />
                    <h2>{state.title}</h2>
                    <p className="muted">{state.description}</p>
                    <button type="button" className="action action-primary action-inline" onClick={retry}>
                        Try again
                    </button>
                </div>
            )}

            {state.kind === 'no-service' && (
                <NoService domain={state.domain} databaseMissing={state.databaseMissing} />
            )}

            {state.kind === 'service' && prefs && (
                <ServiceView
                    serviceId={state.serviceId}
                    details={state.details}
                    fromSearch={state.fromSearch}
                    prefs={prefs}
                />
            )}

            <footer className="footer">
                <button type="button" onClick={toggleTheme}>
                    {darkmode ?? window.matchMedia('(prefers-color-scheme: dark)').matches
                        ? 'Light mode'
                        : 'Dark mode'}
                </button>
                <span aria-hidden="true">·</span>
                <button type="button" onClick={() => void browser.runtime.openOptionsPage()}>
                    Settings
                </button>
                <span aria-hidden="true">·</span>
                <a href={LINKS.source} target="_blank" rel="noreferrer">
                    Source
                </a>
                <span aria-hidden="true">·</span>
                <span>v{browser.runtime.getManifest().version}</span>
            </footer>

            {prefs && prefs.language !== 'en' && (
                <p className="translation-warning">
                    Point titles are machine translated. Choose English in Settings to turn this
                    off.
                </p>
            )}
        </div>
    );
}

function DonationBanner() {
    const [reminder, , loaded] = useStorageItem(donationReminderItem);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (loaded && reminder?.active) {
            setShow(true);
            void dismissDonationReminder();
        }
    }, [loaded, reminder?.active]);

    if (!show) {
        return null;
    }

    return (
        <aside className="donation" aria-labelledby="donation-title">
            <span className="donation-tile" aria-hidden="true">
                <HeartIcon width={18} height={18} />
            </span>
            <div className="donation-body">
                <h2 id="donation-title" className="donation-title">
                    ToS;DR needs you
                </h2>
                <p>
                    ToS;DR is run by volunteers and funded by donations, which pay for our servers.
                    If it helps you, please consider chipping in.
                </p>
                <div className="donation-actions">
                    <a
                        className="action action-donate"
                        href={LINKS.donate}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Donate
                    </a>
                    <button
                        type="button"
                        className="action action-secondary"
                        onClick={() => setShow(false)}
                    >
                        Not now
                    </button>
                </div>
            </div>
        </aside>
    );
}

function NoService({ domain, databaseMissing }: { domain?: string; databaseMissing?: boolean }) {
    return (
        <>
            <header className="header header-centered">
                <img className="logo" src="/icon/128.png" alt="" />
                <h1 className="title">{domain ?? 'Welcome!'}</h1>
                <p className="subtitle">
                    {domain
                        ? "ToS;DR hasn't rated this site yet."
                        : 'Open a website to see how its terms of service are rated.'}
                </p>
                <div className="actions">
                    <a
                        className={`action ${domain ? 'action-secondary' : 'action-primary'}`}
                        href={LINKS.tosdr}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Visit ToS;DR
                        <ExternalLinkIcon />
                    </a>
                    {domain && (
                        <a className="action action-primary" href={LINKS.phoenix} target="_blank" rel="noreferrer">
                            <PencilIcon />
                            Help rate it
                        </a>
                    )}
                </div>
            </header>
            {databaseMissing && (
                <p className="notice notice-warning">
                    The ratings database couldn't be downloaded, so the toolbar icon can't show
                    grades. Check your connection or the API endpoint in Settings.
                </p>
            )}
        </>
    );
}
