// Preset SVG logos for easy one-click brand customization
export interface PresetLogo {
  id: string;
  name: string;
  dataUrl: string;
}

const svgToDataUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export const PRESET_LOGOS: PresetLogo[] = [
  {
    id: 'crest-academic',
    name: 'Academic Crest',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
        <path d="M50 8 L85 24 V52 C85 74 50 92 50 92 C50 92 15 74 15 52 V24 L50 8 Z" fill="#1f3d7a" stroke="#dce4f4" stroke-width="3"/>
        <path d="M50 16 L78 30 V50 C78 68 50 82 50 82 C50 82 22 68 22 50 V30 L50 16 Z" fill="#2d529f"/>
        <path d="M50 32 L36 40 L50 48 L64 40 Z" fill="#f8fafc"/>
        <path d="M38 43 V56 C38 58 50 63 50 63 C50 63 62 58 62 56 V43" stroke="#f8fafc" stroke-width="2.5" fill="none"/>
        <circle cx="50" cy="70" r="3.5" fill="#f59e0b"/>
      </svg>
    `)
  },
  {
    id: 'shield-star',
    name: 'Excellence Shield',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
        <path d="M50 6 L88 22 V52 C88 75 50 94 50 94 C50 94 12 75 12 52 V22 L50 6 Z" fill="#0f172a" stroke="#38bdf8" stroke-width="3"/>
        <polygon points="50,26 55,38 68,39 58,48 61,61 50,54 39,61 42,48 32,39 45,38" fill="#38bdf8"/>
        <path d="M28 72 Q50 64 72 72" stroke="#e2e8f0" stroke-width="2.5" fill="none"/>
      </svg>
    `)
  },
  {
    id: 'laurel-wreath',
    name: 'Honors Laurel',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="42" fill="#1e293b" stroke="#f59e0b" stroke-width="3"/>
        <circle cx="50" cy="50" r="36" fill="#0f172a"/>
        <text x="50" y="58" font-family="sans-serif" font-weight="900" font-size="24" fill="#f59e0b" text-anchor="middle">AHS</text>
        <path d="M26 54 C24 38 34 26 50 24" stroke="#f59e0b" stroke-width="2" fill="none"/>
        <path d="M74 54 C76 38 66 26 50 24" stroke="#f59e0b" stroke-width="2" fill="none"/>
      </svg>
    `)
  },
  {
    id: 'modern-prep',
    name: 'Prepline Diamond',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
        <rect x="20" y="20" width="60" height="60" rx="14" transform="rotate(45 50 50)" fill="#1f3d7a" stroke="#60a5fa" stroke-width="3"/>
        <path d="M40 50 L47 57 L62 42" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `)
  }
];
