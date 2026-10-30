/**
 * Image Placeholders & Resilient Fallbacks
 * Generates self-contained, high-fidelity SVG data URIs for salon services.
 * Guaranteed 100% offline reliability with zero network dependencies.
 */

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Returns an inline SVG Data URI styled specifically for Moreninha do Bronze services.
 * Used when network images fail, are offline, or have invalid links.
 */
export function getServicePlaceholderSvg(title = 'Procedimento Bronze', category = 'Bronzeamento Natural'): string {
  const safeTitle = escapeXml(title.slice(0, 35));
  const safeCategory = escapeXml(category.slice(0, 30));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="35%" stop-color="#1e293b" />
      <stop offset="70%" stop-color="#0c4a6e" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>

    <radialGradient id="sunGlow" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.32" />
      <stop offset="45%" stop-color="#d97706" stop-opacity="0.14" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
    </radialGradient>

    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="40%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.04" />
    </linearGradient>

    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>

  {/* Background */}
  <rect width="100%" height="100%" fill="url(#bgGrad)" />
  <circle cx="400" cy="220" r="280" fill="url(#sunGlow)" />

  {/* Decorative Sun Rays & Sparkles */}
  <g stroke="url(#goldGrad)" stroke-width="2" opacity="0.45" stroke-linecap="round">
    <line x1="400" y1="90" x2="400" y2="120" />
    <line x1="400" y1="280" x2="400" y2="310" />
    <line x1="300" y1="200" x2="330" y2="200" />
    <line x1="470" y1="200" x2="500" y2="200" />
    <line x1="330" y1="130" x2="350" y2="150" />
    <line x1="470" y1="130" x2="450" y2="150" />
    <line x1="330" y1="270" x2="350" y2="250" />
    <line x1="470" y1="270" x2="450" y2="250" />
  </g>

  {/* Golden Emblem Center */}
  <g transform="translate(400, 200)" filter="url(#shadow)">
    <circle r="46" fill="#1e293b" stroke="url(#goldGrad)" stroke-width="3" />
    <circle r="40" fill="none" stroke="#fef08a" stroke-width="1" stroke-dasharray="3,3" opacity="0.6" />
    
    {/* Sun & Sparkle Icon */}
    <circle r="18" fill="url(#goldGrad)" />
    <path d="M-6,-6 L6,-6 L0,8 Z" fill="#78350f" opacity="0.3" />
  </g>

  {/* Category Pill Badge */}
  <g transform="translate(400, 290)">
    <rect x="-110" y="-14" width="220" height="28" rx="14" fill="#0284c7" fill-opacity="0.35" stroke="#38bdf8" stroke-width="1.2" />
    <text text-anchor="middle" y="4" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#bae6fd" letter-spacing="1.5">
      ${safeCategory.toUpperCase()}
    </text>
  </g>

  {/* Service Title */}
  <text x="400" y="360" text-anchor="middle" font-family="serif, Georgia, Times" font-size="30" font-weight="800" fill="#ffffff" letter-spacing="0.5" filter="url(#shadow)">
    ${safeTitle}
  </text>

  {/* Salon Branding Subtitle */}
  <text x="400" y="405" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#fef08a" letter-spacing="2" opacity="0.9">
    MORENINHA DO BRONZE
  </text>

  {/* Bottom Quality Promise */}
  <text x="400" y="435" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" fill="#94a3b8" letter-spacing="1">
    BRONZEAMENTO NATURAL &bull; MESQUITA - RJ
  </text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
