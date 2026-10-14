// High-resolution geometric STEM/Academy background illustration
// Inspired by modern digital learning, abstract polygonal networks, and tech vectors (Vector 18129294)

export const DEFAULT_TECH_BACKGROUND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <!-- Deep Space Academy Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050c1e"/>
      <stop offset="35%" stop-color="#0a1936"/>
      <stop offset="70%" stop-color="#0f2552"/>
      <stop offset="100%" stop-color="#061226"/>
    </linearGradient>

    <!-- Radial Ambient Spotlights -->
    <radialGradient id="cyanGlow" cx="20%" cy="30%" r="50%">
      <stop offset="0%" stop-color="#00d2ff" stop-opacity="0.25"/>
      <stop offset="60%" stop-color="#0066cc" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#0a1936" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="indigoGlow" cx="80%" cy="70%" r="60%">
      <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.30"/>
      <stop offset="50%" stop-color="#1e3a8a" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#050c1e" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="crimsonHeritageGlow" cx="85%" cy="20%" r="40%">
      <stop offset="0%" stop-color="#dc2626" stop-opacity="0.22"/>
      <stop offset="60%" stop-color="#991b1b" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#050c1e" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="emeraldHeritageGlow" cx="15%" cy="85%" r="45%">
      <stop offset="0%" stop-color="#059669" stop-opacity="0.20"/>
      <stop offset="60%" stop-color="#047857" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#050c1e" stop-opacity="0"/>
    </radialGradient>

    <!-- Modern Geometric Grid -->
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255, 255, 255, 0.04)" stroke-width="1"/>
      <circle cx="0" cy="0" r="1.5" fill="rgba(0, 210, 255, 0.25)"/>
    </pattern>

    <!-- Glowing Node Gradients -->
    <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00d2ff" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="#6366f1" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#dc2626" stop-opacity="0.3"/>
    </linearGradient>

    <linearGradient id="polyGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1e3a8a" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.05"/>
    </linearGradient>

    <linearGradient id="polyGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#065f46" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.06"/>
    </linearGradient>
  </defs>

  <!-- Base Canvas -->
  <rect width="1920" height="1080" fill="url(#bgGrad)"/>

  <!-- Radial Lights -->
  <rect width="1920" height="1080" fill="url(#cyanGlow)"/>
  <rect width="1920" height="1080" fill="url(#indigoGlow)"/>
  <rect width="1920" height="1080" fill="url(#crimsonHeritageGlow)"/>
  <rect width="1920" height="1080" fill="url(#emeraldHeritageGlow)"/>

  <!-- Geometric Grid Overlay -->
  <rect width="1920" height="1080" fill="url(#grid)"/>

  <!-- Dynamic STEM & Technology Vector Polygons (Inspired by 18129294 vector layout) -->
  <g stroke="rgba(255,255,255,0.08)" stroke-width="1.2">
    <!-- Polygonal Mesh Facets -->
    <polygon points="120,240 380,180 540,360 260,440" fill="url(#polyGrad1)"/>
    <polygon points="380,180 720,120 860,320 540,360" fill="rgba(99, 102, 241, 0.08)"/>
    <polygon points="720,120 1100,90 1240,280 860,320" fill="url(#polyGrad2)"/>
    <polygon points="1100,90 1480,140 1380,390 1240,280" fill="rgba(220, 38, 38, 0.06)"/>
    <polygon points="1480,140 1820,220 1690,460 1380,390" fill="url(#polyGrad1)"/>

    <!-- Mid & Lower Geometric Mesh -->
    <polygon points="260,440 540,360 480,680 180,620" fill="rgba(5, 150, 105, 0.07)"/>
    <polygon points="540,360 860,320 820,640 480,680" fill="url(#polyGrad2)"/>
    <polygon points="860,320 1240,280 1180,590 820,640" fill="rgba(30, 58, 138, 0.12)"/>
    <polygon points="1240,280 1380,390 1460,710 1180,590" fill="url(#polyGrad1)"/>
    <polygon points="1380,390 1690,460 1620,780 1460,710" fill="rgba(147, 51, 234, 0.06)"/>

    <!-- Bottom Structural Polygons -->
    <polygon points="480,680 820,640 760,940 360,920" fill="rgba(2, 132, 199, 0.08)"/>
    <polygon points="820,640 1180,590 1220,910 760,940" fill="url(#polyGrad1)"/>
    <polygon points="1180,590 1460,710 1520,960 1220,910" fill="rgba(220, 38, 38, 0.08)"/>
  </g>

  <!-- Glowing Constellation Vector Connections & Academic Tech Wave Lines -->
  <g stroke="url(#lineGrad1)" stroke-width="1.8" fill="none">
    <path d="M -50,480 C 350,320 700,680 1100,420 S 1650,220 2000,500" stroke="rgba(0, 210, 255, 0.35)" stroke-width="2.5"/>
    <path d="M -80,620 C 320,820 800,480 1250,720 S 1750,460 2050,680" stroke="rgba(99, 102, 241, 0.3)" stroke-width="2"/>
    <path d="M 100,150 C 600,400 950,150 1400,320 S 1800,100 2020,250" stroke="rgba(220, 38, 38, 0.25)" stroke-width="1.8"/>
  </g>

  <!-- Luminous Data Spheres & Geometric Nodes -->
  <g>
    <!-- Primary Luminous Constellation Nodes -->
    <circle cx="380" cy="180" r="5" fill="#00d2ff"/>
    <circle cx="380" cy="180" r="14" fill="#00d2ff" fill-opacity="0.25"/>

    <circle cx="540" cy="360" r="6" fill="#60a5fa"/>
    <circle cx="540" cy="360" r="16" fill="#60a5fa" fill-opacity="0.2"/>

    <circle cx="860" cy="320" r="7" fill="#818cf8"/>
    <circle cx="860" cy="320" r="20" fill="#818cf8" fill-opacity="0.25"/>

    <circle cx="1240" cy="280" r="6" fill="#f87171"/>
    <circle cx="1240" cy="280" r="18" fill="#f87171" fill-opacity="0.25"/>

    <circle cx="1380" cy="390" r="5.5" fill="#38bdf8"/>
    <circle cx="1380" cy="390" r="15" fill="#38bdf8" fill-opacity="0.2"/>

    <circle cx="820" cy="640" r="6" fill="#34d399"/>
    <circle cx="820" cy="640" r="16" fill="#34d399" fill-opacity="0.22"/>

    <circle cx="1180" cy="590" r="6.5" fill="#60a5fa"/>
    <circle cx="1180" cy="590" r="18" fill="#60a5fa" fill-opacity="0.25"/>

    <circle cx="1460" cy="710" r="5" fill="#f43f5e"/>
    <circle cx="1460" cy="710" r="14" fill="#f43f5e" fill-opacity="0.2"/>

    <circle cx="480" cy="680" r="5" fill="#2dd4bf"/>
    <circle cx="480" cy="680" r="13" fill="#2dd4bf" fill-opacity="0.2"/>

    <!-- Subtle Particle Stars -->
    <circle cx="210" cy="110" r="2" fill="#ffffff" fill-opacity="0.6"/>
    <circle cx="670" cy="240" r="2.5" fill="#00d2ff" fill-opacity="0.8"/>
    <circle cx="950" cy="180" r="2" fill="#ffffff" fill-opacity="0.7"/>
    <circle cx="1420" cy="260" r="2" fill="#a78bfa" fill-opacity="0.7"/>
    <circle cx="1680" cy="180" r="3" fill="#ffffff" fill-opacity="0.65"/>
    <circle cx="1780" cy="340" r="2" fill="#38bdf8" fill-opacity="0.6"/>
    <circle cx="310" cy="520" r="2" fill="#34d399" fill-opacity="0.7"/>
    <circle cx="710" cy="490" r="2.5" fill="#818cf8" fill-opacity="0.6"/>
    <circle cx="1020" cy="460" r="2" fill="#ffffff" fill-opacity="0.7"/>
    <circle cx="1560" cy="580" r="2" fill="#f87171" fill-opacity="0.6"/>
    <circle cx="1720" cy="690" r="3" fill="#60a5fa" fill-opacity="0.5"/>
    <circle cx="290" cy="810" r="2" fill="#2dd4bf" fill-opacity="0.6"/>
    <circle cx="630" cy="790" r="2" fill="#ffffff" fill-opacity="0.7"/>
    <circle cx="990" cy="820" r="3" fill="#818cf8" fill-opacity="0.6"/>
    <circle cx="1340" cy="850" r="2.5" fill="#f43f5e" fill-opacity="0.6"/>
    <circle cx="1660" cy="890" r="2" fill="#38bdf8" fill-opacity="0.5"/>
  </g>
</svg>`;

export const DEFAULT_TECH_BACKGROUND_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
  DEFAULT_TECH_BACKGROUND_SVG.replace(/\n\s*/g, ' ')
)}`;

export interface BackgroundPreset {
  id: string;
  name: string;
  desc: string;
  theme: string;
  svg: string;
  dataUrl: string;
}

export const PRESET_BACKGROUNDS: BackgroundPreset[] = [
  {
    id: 'cyber_vector_18129294',
    name: 'Modern Cyber Grid (Vector 18129294)',
    desc: 'High-tech geometric polygonal constellation with deep navy and luminous accents',
    theme: 'dark-navy',
    svg: DEFAULT_TECH_BACKGROUND_SVG,
    dataUrl: DEFAULT_TECH_BACKGROUND_DATA_URL
  },
  {
    id: 'deep_academy_indigo',
    name: 'Deep Academy Indigo & Crimson',
    desc: 'Regal indigo architectural vectors with crimson school heritage spotlights',
    theme: 'indigo-crimson',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%"><defs><linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#09142e"/><stop offset="50%" stop-color="#14214d"/><stop offset="100%" stop-color="#0b1736"/></linearGradient><radialGradient id="r1" cx="30%" cy="40%" r="55%"><stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3"/><stop offset="100%" stop-color="#09142e" stop-opacity="0"/></radialGradient><radialGradient id="r2" cx="80%" cy="30%" r="45%"><stop offset="0%" stop-color="#e11d48" stop-opacity="0.25"/><stop offset="100%" stop-color="#09142e" stop-opacity="0"/></radialGradient></defs><rect width="1920" height="1080" fill="url(#bg2)"/><rect width="1920" height="1080" fill="url(#r1)"/><rect width="1920" height="1080" fill="url(#r2)"/><g stroke="rgba(255,255,255,0.06)" stroke-width="1.5"><line x1="0" y1="200" x2="1920" y2="400"/><line x1="0" y1="500" x2="1920" y2="700"/><line x1="0" y1="800" x2="1920" y2="950"/><circle cx="480" cy="250" r="6" fill="#38bdf8"/><circle cx="1200" cy="550" r="7" fill="#fb7185"/></g></svg>`,
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%"><defs><linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#09142e"/><stop offset="50%" stop-color="#14214d"/><stop offset="100%" stop-color="#0b1736"/></linearGradient><radialGradient id="r1" cx="30%" cy="40%" r="55%"><stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3"/><stop offset="100%" stop-color="#09142e" stop-opacity="0"/></radialGradient><radialGradient id="r2" cx="80%" cy="30%" r="45%"><stop offset="0%" stop-color="#e11d48" stop-opacity="0.25"/><stop offset="100%" stop-color="#09142e" stop-opacity="0"/></radialGradient></defs><rect width="1920" height="1080" fill="url(#bg2)"/><rect width="1920" height="1080" fill="url(#r1)"/><rect width="1920" height="1080" fill="url(#r2)"/><g stroke="rgba(255,255,255,0.06)" stroke-width="1.5"><line x1="0" y1="200" x2="1920" y2="400"/><line x1="0" y1="500" x2="1920" y2="700"/><line x1="0" y1="800" x2="1920" y2="950"/><circle cx="480" cy="250" r="6" fill="#38bdf8"/><circle cx="1200" cy="550" r="7" fill="#fb7185"/></g></svg>`
    )}`
  },
  {
    id: 'emerald_nafs_science',
    name: 'Emerald STEM & National Standards',
    desc: 'Luminous emerald and teal educational lattice for science and mathematics exams',
    theme: 'emerald-teal',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%"><defs><linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#042018"/><stop offset="50%" stop-color="#064e3b"/><stop offset="100%" stop-color="#022c22"/></linearGradient><radialGradient id="r3" cx="50%" cy="30%" r="60%"><stop offset="0%" stop-color="#10b981" stop-opacity="0.25"/><stop offset="100%" stop-color="#042018" stop-opacity="0"/></radialGradient></defs><rect width="1920" height="1080" fill="url(#bg3)"/><rect width="1920" height="1080" fill="url(#r3)"/><g stroke="rgba(255,255,255,0.07)" stroke-width="1.2"><path d="M 0,300 Q 600,100 1200,400 T 1920,200" fill="none"/><path d="M 0,700 Q 700,900 1400,600 T 1920,800" fill="none"/><circle cx="700" cy="230" r="6" fill="#34d399"/><circle cx="1300" cy="650" r="6" fill="#6ee7b7"/></g></svg>`,
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%"><defs><linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#042018"/><stop offset="50%" stop-color="#064e3b"/><stop offset="100%" stop-color="#022c22"/></linearGradient><radialGradient id="r3" cx="50%" cy="30%" r="60%"><stop offset="0%" stop-color="#10b981" stop-opacity="0.25"/><stop offset="100%" stop-color="#042018" stop-opacity="0"/></radialGradient></defs><rect width="1920" height="1080" fill="url(#bg3)"/><rect width="1920" height="1080" fill="url(#r3)"/><g stroke="rgba(255,255,255,0.07)" stroke-width="1.2"><path d="M 0,300 Q 600,100 1200,400 T 1920,200" fill="none"/><path d="M 0,700 Q 700,900 1400,600 T 1920,800" fill="none"/><circle cx="700" cy="230" r="6" fill="#34d399"/><circle cx="1300" cy="650" r="6" fill="#6ee7b7"/></g></svg>`
    )}`
  }
];
