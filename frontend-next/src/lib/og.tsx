import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const BRAND_BLUE = "#2563EB";
const BRAND_BLUE_DARK = "#1D4ED8";
const BRAND_NAVY = "#0F1E3D";
const BRAND_ORANGE = "#F59E0B";

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// Same path data as components/LogoMark.tsx / app/icon.svg, with literal
// colors instead of Tailwind classes — satori (next/og) can't read CSS.
function LogoMark() {
  return (
    <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="11" fill="#fff" />
      <g transform="translate(24 24) scale(.72) translate(-24 -24)">
        <path
          d="M5 21.5 24 7l19 14.5"
          stroke={BRAND_BLUE}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 24.5V41h28V24.5"
          stroke={BRAND_BLUE}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="15" y="29" width="18" height="7" rx="3.5" fill={BRAND_BLUE} fillOpacity=".25" />
        <rect x="15" y="29" width="11.5" height="7" rx="3.5" fill={BRAND_ORANGE} />
      </g>
    </svg>
  );
}

export function ogImage(opts: { eyebrow?: string; title: string; description?: string }) {
  const title = truncate(opts.title, 90);
  const description = opts.description ? truncate(opts.description, 140) : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: `linear-gradient(135deg, ${BRAND_BLUE_DARK} 0%, ${BRAND_BLUE} 55%, ${BRAND_NAVY} 100%)`,
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <LogoMark />
          <div style={{ fontSize: 30, fontWeight: 700 }}>Reforma Maestro</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 980 }}>
          {opts.eyebrow && (
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: BRAND_ORANGE }}>
              {opts.eyebrow}
            </div>
          )}
          <div style={{ display: "flex", fontSize: 56, fontWeight: 800, lineHeight: 1.15 }}>
            {title}
          </div>
          {description && (
            <div style={{ display: "flex", fontSize: 26, color: "rgba(255,255,255,0.85)" }}>
              {description}
            </div>
          )}
        </div>
      </div>
    ),
    ogSize
  );
}
