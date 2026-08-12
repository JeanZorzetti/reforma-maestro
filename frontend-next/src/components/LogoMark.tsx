// Fonte da arte: docs/logo/svg/logo.svg (mesmo path, cores literais).
// Aqui as cores vêm dos tokens do tema para acompanhar o dark mode.
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={`shrink-0 ${className}`}>
            <path d="M5 21.5 24 7l19 14.5" className="stroke-primary" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 24.5V41h28V24.5" className="stroke-primary" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="15" y="29" width="18" height="7" rx="3.5" className="fill-primary/20" />
            <rect x="15" y="29" width="11.5" height="7" rx="3.5" className="fill-accent" />
        </svg>
    );
}
