import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            {children}
        </svg>
    );
}

export function ExternalLinkIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M14 4h6v6" />
            <path d="M20 4 11 13" />
            <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
        </Icon>
    );
}

export function PencilIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
            <path d="m13.5 6.5 4 4" />
        </Icon>
    );
}

export function HeartIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
        </Icon>
    );
}

export function ChevronRightIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="m9 6 6 6-6 6" />
        </Icon>
    );
}

export function ChevronUpDownIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="m8 9 4-4 4 4" />
            <path d="m8 15 4 4 4-4" />
        </Icon>
    );
}

export function MoonIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
        </Icon>
    );
}

export function ImageIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="9" cy="10" r="1.5" />
            <path d="m21 16-5-5-9 9" />
        </Icon>
    );
}

export function ShieldIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
        </Icon>
    );
}

export function GlobeIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18" />
            <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18Z" />
        </Icon>
    );
}

export function ClockIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </Icon>
    );
}

export function DatabaseIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <ellipse cx="12" cy="6" rx="7" ry="3" />
            <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
            <path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
        </Icon>
    );
}

export function ServerIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <rect x="4" y="4" width="16" height="7" rx="1.5" />
            <rect x="4" y="13" width="16" height="7" rx="1.5" />
            <path d="M8 7.5h.01M8 16.5h.01" />
        </Icon>
    );
}
