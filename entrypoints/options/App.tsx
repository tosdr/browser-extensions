import { type ReactNode, useId, useState } from 'react';
import { browser } from 'wxt/browser';
import { DEFAULT_API_URL, DEFAULT_UPDATE_INTERVAL_DAYS, SUPPORTED_LANGUAGES } from '@/utils/constants';
import { downloadDatabase } from '@/utils/database';
import {
    ChevronUpDownIcon,
    ClockIcon,
    DatabaseIcon,
    GlobeIcon,
    ImageIcon,
    MoonIcon,
    PencilIcon,
    ServerIcon,
    ShieldIcon,
} from '@/utils/icons';
import { LANGUAGE_NAMES, resolveLanguage } from '@/utils/language';
import {
    apiItem,
    curatorModeItem,
    darkmodeItem,
    dbItem,
    dbStatusItem,
    intervalItem,
    languageItem,
    lastModifiedItem,
    themeHeaderItem,
    themeHeaderRatingItem,
} from '@/utils/storage';
import { normalizeHost } from '@/utils/url';
import { useStorageItem, useTheme } from '@/utils/useStorageItem';

const MIN_INTERVAL = 1;
const MAX_INTERVAL = 14;

export default function App() {
    const [darkmode, setDarkmode] = useStorageItem(darkmodeItem);
    const [themeHeader, setThemeHeader] = useStorageItem(themeHeaderItem);
    const [themeHeaderRating, setThemeHeaderRating] = useStorageItem(themeHeaderRatingItem);
    const [curatorMode, setCuratorMode] = useStorageItem(curatorModeItem);
    const [language, setLanguage] = useStorageItem(languageItem);
    const [interval, setIntervalValue] = useStorageItem(intervalItem);
    const [api, setApi] = useStorageItem(apiItem);
    const [db] = useStorageItem(dbItem);
    const [lastModified] = useStorageItem(lastModifiedItem);
    const [dbStatus] = useStorageItem(dbStatusItem);
    const [updating, setUpdating] = useState(false);
    const [intervalDraft, setIntervalDraft] = useState<number | null>(null);
    useTheme(darkmode);

    const intervalDays = intervalDraft ?? (Number(interval) || DEFAULT_UPDATE_INTERVAL_DAYS);
    const sliderFill = ((intervalDays - MIN_INTERVAL) / (MAX_INTERVAL - MIN_INTERVAL)) * 100;

    const updateNow = async () => {
        setUpdating(true);
        await downloadDatabase();
        setUpdating(false);
    };

    const commitInterval = () => {
        if (intervalDraft !== null) {
            setIntervalValue(intervalDraft);
            setIntervalDraft(null);
        }
    };

    return (
        <main>
            <h1 className="large-title">Settings</h1>

            <Section header="Appearance">
                <SelectRow
                    icon={<MoonIcon />}
                    color="indigo"
                    title="Theme"
                    value={darkmode === null ? 'system' : darkmode ? 'dark' : 'light'}
                    options={[
                        ['system', 'Automatic'],
                        ['light', 'Light'],
                        ['dark', 'Dark'],
                    ]}
                    onChange={(v) => setDarkmode(v === 'system' ? null : v === 'dark')}
                />
                <ToggleRow
                    icon={<ImageIcon />}
                    color="orange"
                    title="Logo Header"
                    checked={themeHeader}
                    onChange={setThemeHeader}
                />
                <ToggleRow
                    icon={<ShieldIcon />}
                    color="green"
                    title="Tint Header by Grade"
                    checked={themeHeaderRating}
                    onChange={setThemeHeaderRating}
                />
            </Section>

            <Section footer="Language used for point titles. Translations are machine generated.">
                <SelectRow
                    icon={<GlobeIcon />}
                    color="blue"
                    title="Language"
                    value={resolveLanguage(language)}
                    options={SUPPORTED_LANGUAGES.map((code) => [code, LANGUAGE_NAMES[code]])}
                    onChange={(v) => setLanguage(resolveLanguage(v))}
                />
            </Section>

            <Section footer="Shows points that are still pending review, plus links to edit services on Phoenix.">
                <ToggleRow
                    icon={<PencilIcon />}
                    color="pink"
                    title="Curator Mode"
                    checked={curatorMode}
                    onChange={setCuratorMode}
                />
            </Section>

            <Section
                header="Database"
                footer={
                    dbStatus?.state === 'error' ? (
                        <span className="footer-error" role="alert">
                            Last update failed on {formatDate(dbStatus.checkedAt)}: {dbStatus.message}
                        </span>
                    ) : (
                        'Ratings are stored on your device, so the toolbar icon works without contacting ToS;DR on every page.'
                    )
                }
            >
                <Row icon={<ClockIcon />} color="gray" title="Update Every">
                    <span className="row-value">
                        {intervalDays} {intervalDays === 1 ? 'day' : 'days'}
                    </span>
                </Row>
                <div className="row row-slider">
                    <span className="slider-bound">{MIN_INTERVAL}</span>
                    <input
                        type="range"
                        aria-label="Update interval in days"
                        min={MIN_INTERVAL}
                        max={MAX_INTERVAL}
                        value={intervalDays}
                        style={{ ['--fill' as string]: `${sliderFill}%` }}
                        onChange={(e) => setIntervalDraft(Number(e.target.value))}
                        onPointerUp={commitInterval}
                        onKeyUp={commitInterval}
                        onBlur={commitInterval}
                    />
                    <span className="slider-bound">{MAX_INTERVAL}</span>
                </div>
                <Row icon={<DatabaseIcon />} color="teal" title="Services">
                    <span className="row-value">{db ? db.length.toLocaleString() : '—'}</span>
                </Row>
                <Row title="Last Updated" inset>
                    <span className="row-value">{lastModified ? formatDate(lastModified) : 'Never'}</span>
                </Row>
                <button
                    type="button"
                    className="row row-button"
                    disabled={updating}
                    onClick={() => void updateNow()}
                >
                    {updating ? 'Updating…' : 'Update Now'}
                </button>
            </Section>

            <Section
                header="Advanced"
                footer="Only change this if you run your own ToS;DR API. Enter a host name, or leave it empty for the default."
            >
                <ApiRow api={api} onSave={setApi} />
            </Section>

            <p className="version">ToS;DR {browser.runtime.getManifest().version}</p>
        </main>
    );
}

function formatDate(iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
        ? '—'
        : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

type TileColor = 'blue' | 'green' | 'orange' | 'pink' | 'indigo' | 'teal' | 'gray';

function Section({
    header,
    footer,
    children,
}: {
    header?: string;
    footer?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="section">
            {header && <h2 className="section-header">{header}</h2>}
            <div className="group">{children}</div>
            {footer && <p className="section-footer">{footer}</p>}
        </section>
    );
}

function Tile({ color, children }: { color: TileColor; children: ReactNode }) {
    return <span className={`tile tile-${color}`}>{children}</span>;
}

function Row({
    icon,
    color = 'gray',
    title,
    inset,
    children,
}: {
    icon?: ReactNode;
    color?: TileColor;
    title: string;
    inset?: boolean;
    children?: ReactNode;
}) {
    return (
        <div className={`row${icon || inset ? ' has-icon' : ''}`}>
            {icon ? <Tile color={color}>{icon}</Tile> : inset && <span className="tile-spacer" />}
            <span className="row-title">{title}</span>
            {children}
        </div>
    );
}

function ToggleRow({
    icon,
    color,
    title,
    checked,
    onChange,
}: {
    icon: ReactNode;
    color: TileColor;
    title: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <label className="row has-icon row-interactive">
            <Tile color={color}>{icon}</Tile>
            <span className="row-title">{title}</span>
            <input
                type="checkbox"
                role="switch"
                className="switch"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
        </label>
    );
}

function SelectRow<T extends string>({
    icon,
    color,
    title,
    value,
    options,
    onChange,
}: {
    icon: ReactNode;
    color: TileColor;
    title: string;
    value: T;
    options: Array<[T, string]>;
    onChange: (value: T) => void;
}) {
    const id = useId();
    const label = options.find(([v]) => v === value)?.[1] ?? value;
    return (
        <div className="row has-icon row-interactive row-select">
            <Tile color={color}>{icon}</Tile>
            <label className="row-title" htmlFor={id}>
                {title}
            </label>
            <span className="row-value" aria-hidden="true">
                {label}
                <ChevronUpDownIcon width={14} height={14} />
            </span>
            <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)}>
                {options.map(([v, text]) => (
                    <option key={v} value={v}>
                        {text}
                    </option>
                ))}
            </select>
        </div>
    );
}

function ApiRow({ api, onSave }: { api: string; onSave: (value: string) => void }) {
    const id = useId();
    return (
        <div className="row has-icon">
            <Tile color="gray">
                <ServerIcon />
            </Tile>
            <label className="row-title" htmlFor={id}>
                API Server
            </label>
            <input
                id={id}
                className="row-input"
                type="text"
                inputMode="url"
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                placeholder={DEFAULT_API_URL}
                defaultValue={api}
                key={api}
                onBlur={(e) => {
                    const host = normalizeHost(e.target.value);
                    e.target.value = host;
                    if (host !== api) {
                        onSave(host);
                    }
                }}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            />
        </div>
    );
}
