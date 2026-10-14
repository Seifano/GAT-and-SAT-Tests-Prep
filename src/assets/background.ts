// Background presets and default geometric tech background for AHS Exams Prepline

// Clean geometric tech SVG blueprint vector background
export const DEFAULT_TECH_BACKGROUND_DATA_URL =
  `data:image/svg+xml;utf8,` +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900" fill="none">
  <rect width="1440" height="900" fill="#f8fafc" />
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1f3d7a" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.02" />
    </linearGradient>
    <linearGradient id="g2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.06" />
      <stop offset="100%" stop-color="#1e293b" stop-opacity="0.01" />
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#64748b" stroke-width="0.5" stroke-opacity="0.12" />
      <circle cx="48" cy="48" r="1" fill="#1f3d7a" fill-opacity="0.18" />
    </pattern>
  </defs>
  
  <rect width="1440" height="900" fill="url(#g1)" />
  <rect width="1440" height="900" fill="url(#grid)" />
  
  <!-- Subtle geometric circuits / polygons -->
  <path d="M-100 200 L400 -50 L750 300 L250 550 Z" fill="url(#g2)" />
  <path d="M900 150 L1550 50 L1350 700 L800 500 Z" fill="url(#g1)" />
  <circle cx="1200" cy="180" r="280" stroke="#1f3d7a" stroke-opacity="0.06" stroke-width="1.5" stroke-dasharray="8 6" fill="none" />
  <circle cx="200" cy="750" r="340" stroke="#0284c7" stroke-opacity="0.05" stroke-width="1.5" stroke-dasharray="12 8" fill="none" />
</svg>
`.trim());

export interface BackgroundPreset {
  id: string;
  name: string;
  desc: string;
  dataUrl: string;
}

export const PRESET_BACKGROUNDS: BackgroundPreset[] = [
  {
    id: 'cyber_vector_18129294',
    name: 'Cyber Vector Tech',
    desc: 'High-res geometric grid with architectural tech vectors and clean lines.',
    dataUrl: DEFAULT_TECH_BACKGROUND_DATA_URL,
  },
  {
    id: 'academic_constellation',
    name: 'Academic Constellation',
    desc: 'Deep slate with subtle knowledge node connectors and orbital rings.',
    dataUrl:
      `data:image/svg+xml;utf8,` +
      encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900" fill="none">
  <rect width="1440" height="900" fill="#f1f5f9" />
  <defs>
    <radialGradient id="acad1" cx="20%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#1e3a8a" stop-opacity="0.07" />
      <stop offset="100%" stop-color="#f1f5f9" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="acad2" cx="80%" cy="70%" r="50%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.06" />
      <stop offset="100%" stop-color="#f1f5f9" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1440" height="900" fill="url(#acad1)" />
  <rect width="1440" height="900" fill="url(#acad2)" />
  <g stroke="#334155" stroke-opacity="0.1" stroke-width="1">
    <line x1="200" y1="180" x2="380" y2="280" />
    <line x1="380" y1="280" x2="520" y2="190" />
    <line x1="380" y1="280" x2="320" y2="440" />
    <line x1="1100" y1="400" x2="1280" y2="300" />
    <line x1="1280" y1="300" x2="1360" y2="460" />
    <line x1="1100" y1="400" x2="1000" y2="580" />
  </g>
  <circle cx="200" cy="180" r="4" fill="#1e3a8a" fill-opacity="0.25" />
  <circle cx="380" cy="280" r="6" fill="#1e3a8a" fill-opacity="0.3" />
  <circle cx="520" cy="190" r="3" fill="#0284c7" fill-opacity="0.25" />
  <circle cx="320" cy="440" r="4" fill="#0284c7" fill-opacity="0.25" />
  <circle cx="1100" cy="400" r="5" fill="#1e3a8a" fill-opacity="0.3" />
  <circle cx="1280" cy="300" r="4" fill="#0284c7" fill-opacity="0.25" />
  <circle cx="1360" cy="460" r="6" fill="#1e3a8a" fill-opacity="0.25" />
</svg>
`.trim()),
  },
  {
    id: 'modern_minimal_mesh',
    name: 'Modern Minimal Mesh',
    desc: 'Warm neutral background with soft gradient flow and clean framing.',
    dataUrl:
      `data:image/svg+xml;utf8,` +
      encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900" fill="none">
  <rect width="1440" height="900" fill="#fafaf9" />
  <defs>
    <linearGradient id="warm1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.04" />
      <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.03" />
      <stop offset="100%" stop-color="#10b981" stop-opacity="0.03" />
    </linearGradient>
  </defs>
  <rect width="1440" height="900" fill="url(#warm1)" />
  <circle cx="720" cy="450" r="500" stroke="#78716c" stroke-opacity="0.05" stroke-width="1" fill="none" />
  <circle cx="720" cy="450" r="350" stroke="#78716c" stroke-opacity="0.04" stroke-width="1" stroke-dasharray="6 6" fill="none" />
</svg>
`.trim()),
  },
];
