import React, { useState } from 'react';
import { AppSettings } from '../types';
import { AHS_LOGO_SRC } from '../assets/logo';
import { PRESET_LOGOS } from '../data/presetLogos';
import { PRESET_BACKGROUNDS, DEFAULT_TECH_BACKGROUND_DATA_URL } from '../assets/background';
import { Upload, RotateCcw, Check, Sparkles, Image, Eye, Type, CheckCircle2, Palette } from 'lucide-react';

interface AdminBrandingViewProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

export const AdminBrandingView: React.FC<AdminBrandingViewProps> = ({ settings, onSaveSettings }) => {
  const [appName, setAppName] = useState(settings.appName);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || AHS_LOGO_SRC);
  const [backgroundUrl, setBackgroundUrl] = useState(settings.backgroundUrl || DEFAULT_TECH_BACKGROUND_DATA_URL);
  const [backgroundTheme, setBackgroundTheme] = useState(settings.backgroundTheme || 'cyber_vector_18129294');
  const [loginTitle, setLoginTitle] = useState(settings.loginTitle);
  const [loginHeadline, setLoginHeadline] = useState(settings.loginHeadline);
  const [loginDescription, setLoginDescription] = useState(settings.loginDescription);
  const [footnotes, setFootnotes] = useState(
    settings.loginFootnotes || [
      { title: 'GAT', subtitle: 'Verbal · Quant' },
      { title: 'SAT', subtitle: 'R&W · Math' },
      { title: 'Feedback', subtitle: 'By skill' }
    ]
  );

  const [saved, setSaved] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const bgFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setLogoUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleResetLogo = () => {
    setLogoUrl(AHS_LOGO_SRC);
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setBackgroundUrl(dataUrl);
        setBackgroundTheme('custom_uploaded');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleResetBackground = () => {
    setBackgroundUrl(DEFAULT_TECH_BACKGROUND_DATA_URL);
    setBackgroundTheme('cyber_vector_18129294');
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveSettings({
      appName: appName.trim() || 'AHS Exams Prepline',
      logoUrl: logoUrl.trim() || AHS_LOGO_SRC,
      backgroundUrl: backgroundUrl.trim() || DEFAULT_TECH_BACKGROUND_DATA_URL,
      backgroundTheme: backgroundTheme,
      loginTitle: loginTitle.trim() || 'AHS Exams Prepline',
      loginHeadline: loginHeadline.trim() || 'GAT and SAT practice, in one place.',
      loginDescription: loginDescription.trim(),
      loginFootnotes: footnotes
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-[#201e1d]/30">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] mb-1">
            Admin Configuration
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#201e1d] tracking-tight break-words">
            Change Logo &amp; Rename Login Page
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mt-1 leading-relaxed break-words">
            Customize the school logo emblem, rename the login page titles, and update brand wording across the student portal.
          </p>
        </div>

        <button
          onClick={() => handleSave()}
          className="btn-primary px-6 py-2.5 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
        >
          {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Sparkles className="w-4 h-4" />}
          <span>{saved ? 'Changes Saved!' : 'Save Branding Changes'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Logo Customization */}
        <div className="border-2 border-[#201e1d]/30 bg-white p-6 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b-2 border-[#201e1d]/20">
            <div className="flex items-center gap-2 text-[#1f3d7a] font-extrabold text-base">
              <Image className="w-5 h-5" />
              <h2>Change School / Portal Logo</h2>
            </div>
            <button
              type="button"
              onClick={handleResetLogo}
              className="text-xs font-bold text-slate-600 hover:text-black flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Official AHS Emblem</span>
            </button>
          </div>

          {/* Quick Preset Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Choose from Preset Emblems or Upload Your Own:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* Default AHS */}
              <button
                type="button"
                onClick={() => setLogoUrl(AHS_LOGO_SRC)}
                className={`p-3 border-2 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                  logoUrl === AHS_LOGO_SRC
                    ? 'border-[#1f3d7a] bg-[#1f3d7a]/5 ring-2 ring-[#1f3d7a]/20'
                    : 'border-slate-200 hover:border-slate-400 bg-slate-50'
                }`}
              >
                <img src={AHS_LOGO_SRC} alt="AHS Official" className="h-10 w-auto object-contain" />
                <span className="text-[11px] font-bold text-[#201e1d] flex items-center gap-1">
                  AHS Falcon
                  {logoUrl === AHS_LOGO_SRC && <CheckCircle2 className="w-3 h-3 text-[#1f3d7a]" />}
                </span>
              </button>

              {/* Other presets */}
              {PRESET_LOGOS.map(p => {
                const isSelected = logoUrl === p.dataUrl;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setLogoUrl(p.dataUrl)}
                    className={`p-3 border-2 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#1f3d7a] bg-[#1f3d7a]/5 ring-2 ring-[#1f3d7a]/20'
                        : 'border-slate-200 hover:border-slate-400 bg-slate-50'
                    }`}
                  >
                    <img src={p.dataUrl} alt={p.name} className="h-10 w-auto object-contain" />
                    <span className="text-[11px] font-bold text-[#201e1d] flex items-center gap-1">
                      {p.name}
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-[#1f3d7a]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-2">
            {/* Live Logo Preview Box */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Live Logo Preview on Themes</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-6 bg-[#0a1730] flex flex-col items-center justify-center border border-slate-700 min-h-[140px]">
                  <img
                    src={logoUrl}
                    alt="Logo on Dark Preview"
                    className="max-h-20 w-auto object-contain filter drop-shadow-md"
                  />
                  <span className="text-[10px] text-slate-400 mt-2 font-mono">Dark (Login Screen)</span>
                </div>
                <div className="p-6 bg-[#f3f2f2] flex flex-col items-center justify-center border border-slate-300 min-h-[140px]">
                  <img
                    src={logoUrl}
                    alt="Logo on Light Preview"
                    className="max-h-16 w-auto object-contain"
                  />
                  <span className="text-[10px] text-slate-500 mt-2 font-mono">Light (Top Header)</span>
                </div>
              </div>
            </div>

            {/* Upload Controls */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#201e1d] mb-1">
                  Upload Custom Logo File (PNG, SVG, JPG, WebP)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 border-2 border-dashed border-slate-300 hover:border-[#1f3d7a] bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-2 font-bold text-slate-700 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-[#1f3d7a]" />
                  <span>Browse and upload logo image...</span>
                </button>
              </div>

              <div>
                <label className="block font-bold text-[#201e1d] mb-1">
                  Or Paste Image URL / Data URI
                </label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png or data:image/..."
                  className="w-full p-2.5 bg-[#f3f2f2] border border-slate-300 text-xs font-mono text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Custom Portal & Login Background (No Boring White Background) */}
        <div className="border-2 border-[#201e1d]/30 bg-white p-6 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b-2 border-[#201e1d]/20">
            <div className="flex items-center gap-2 text-[#1f3d7a] font-extrabold text-base">
              <Palette className="w-5 h-5" />
              <h2>Login &amp; Portal Background Artwork</h2>
            </div>
            <button
              type="button"
              onClick={handleResetBackground}
              className="text-xs text-slate-600 hover:text-[#1f3d7a] flex items-center gap-1 font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default Tech Background</span>
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Replaces the boring white background across the login page and study dashboard with high-resolution geometric tech vectors or your own uploaded school campus background.
          </p>

          {/* Preset Background Options */}
          <div>
            <label className="block font-bold text-[#201e1d] text-xs mb-2">
              Choose Preset Graphic Theme
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PRESET_BACKGROUNDS.map(preset => {
                const isSelected = backgroundTheme === preset.id || backgroundUrl === preset.dataUrl;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setBackgroundUrl(preset.dataUrl);
                      setBackgroundTheme(preset.id);
                    }}
                    className={`p-3 text-left border-2 transition-all cursor-pointer rounded-xl flex flex-col justify-between h-28 relative overflow-hidden ${
                      isSelected
                        ? 'border-[#1f3d7a] ring-2 ring-[#1f3d7a]/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-400 bg-slate-50'
                    }`}
                  >
                    <div
                      className="absolute inset-0 opacity-25 pointer-events-none bg-cover bg-center"
                      style={{ backgroundImage: `url(${preset.dataUrl})` }}
                    />
                    <div className="relative z-1 flex items-start justify-between">
                      <span className="font-extrabold text-xs text-slate-900 leading-snug">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#1f3d7a] shrink-0" />
                      )}
                    </div>
                    <span className="relative z-1 text-[10px] text-slate-600 line-clamp-2">
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload Custom Background File or URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-200 text-xs">
            <div>
              <label className="block font-bold text-[#201e1d] mb-1">
                Upload Custom Background File (PNG, JPG, SVG, WebP)
              </label>
              <input
                type="file"
                ref={bgFileInputRef}
                onChange={handleBackgroundUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => bgFileInputRef.current?.click()}
                className="w-full py-3 px-4 border-2 border-dashed border-slate-300 hover:border-[#1f3d7a] bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-2 font-bold text-slate-700 cursor-pointer transition-colors rounded-xl"
              >
                <Upload className="w-4 h-4 text-[#1f3d7a]" />
                <span>Upload Custom Background Image...</span>
              </button>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Images are saved to the cloud database and displayed across all entry and dashboard views.
              </span>
            </div>

            <div>
              <label className="block font-bold text-[#201e1d] mb-1">
                Or Paste Background Image URL / Data URI
              </label>
              <input
                type="text"
                value={backgroundUrl.startsWith('data:') ? 'Custom Vector Artwork (Data URI loaded)' : backgroundUrl}
                onChange={e => {
                  setBackgroundUrl(e.target.value);
                  setBackgroundTheme('custom_url');
                }}
                placeholder="https://example.com/background.jpg"
                className="w-full p-2.5 bg-[#f3f2f2] border border-slate-300 text-xs font-mono text-[#201e1d] focus:outline-none focus:border-[#1f3d7a] rounded-lg"
              />
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600">Active Theme:</span>
                <span className="px-2 py-0.5 rounded-md bg-sky-100 text-[#1f3d7a] font-mono text-[10px] font-bold">
                  {backgroundTheme}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Rename Login Page & Title Customization */}
        <div className="border-2 border-[#201e1d]/30 bg-white p-6 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-[#201e1d]/20 text-[#1f3d7a] font-extrabold text-base">
            <Type className="w-5 h-5" />
            <h2>Rename Login Page &amp; Brand Headings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-bold text-[#201e1d] mb-1">
                Login Page Brand Title (Next to Logo) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={loginTitle}
                onChange={e => setLoginTitle(e.target.value)}
                placeholder="e.g. AHS Exams Prepline"
                className="w-full p-2.5 bg-[#f3f2f2] border border-slate-300 text-sm font-bold text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                The name displayed beside the logo on the login page screen.
              </span>
            </div>

            <div>
              <label className="block font-bold text-[#201e1d] mb-1">
                Portal App Name (Header &amp; Browser Tab)
              </label>
              <input
                type="text"
                value={appName}
                onChange={e => setAppName(e.target.value)}
                placeholder="e.g. AHS Exams Prepline"
                className="w-full p-2.5 bg-[#f3f2f2] border border-slate-300 text-sm font-bold text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Shown in the top navigation header and browser tab.
              </span>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-[#201e1d] mb-1">
                Main Hero Headline on Login Screen <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={loginHeadline}
                onChange={e => setLoginHeadline(e.target.value)}
                placeholder="e.g. GAT and SAT practice, in one place."
                className="w-full p-2.5 bg-[#f3f2f2] border border-slate-300 text-sm font-bold text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                The large bold statement on the left panel of the login screen.
              </span>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-[#201e1d] mb-1">
                Hero Description / Purpose Statement
              </label>
              <textarea
                rows={3}
                value={loginDescription}
                onChange={e => setLoginDescription(e.target.value)}
                placeholder="Explain the platform purpose, practice tests, and question banks..."
                className="w-full p-2.5 bg-[#f3f2f2] border border-slate-300 text-xs text-[#201e1d] focus:outline-none focus:border-[#1f3d7a]"
              />
            </div>

            {/* 3 Footnote Badges */}
            <div className="md:col-span-2 space-y-2">
              <label className="block font-bold text-[#201e1d]">
                Login Screen Footer Highlights (3 Badges)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {footnotes.map((fn, idx) => (
                  <div key={idx} className="p-3 bg-[#f3f2f2] border border-slate-300 space-y-1.5">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Badge {idx + 1} Label</span>
                      <input
                        type="text"
                        value={fn.title}
                        onChange={e => {
                          const copy = [...footnotes];
                          copy[idx] = { ...copy[idx], title: e.target.value };
                          setFootnotes(copy);
                        }}
                        className="w-full p-1.5 bg-white border border-slate-300 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Subtitle</span>
                      <input
                        type="text"
                        value={fn.subtitle}
                        onChange={e => {
                          const copy = [...footnotes];
                          copy[idx] = { ...copy[idx], subtitle: e.target.value };
                          setFootnotes(copy);
                        }}
                        className="w-full p-1.5 bg-white border border-slate-300 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Live Preview Box */}
        <div className="border-2 border-[#201e1d]/30 bg-white p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-[#201e1d]/20 text-[#1f3d7a] font-extrabold text-base">
            <Eye className="w-5 h-5" />
            <h2>Live Login &amp; Portal Stage Preview</h2>
          </div>

          <div
            className="rounded-2xl text-white p-8 max-w-2xl border-2 border-slate-700/80 shadow-2xl relative overflow-hidden bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundUrl})` }}
          >
            {/* Soft Ambient Overlay */}
            <div className="absolute inset-0 bg-[#061022]/80 backdrop-blur-[1px] pointer-events-none" />

            <div className="relative z-1 space-y-6">
              <div className="flex items-center gap-3">
                <img
                  src={logoUrl}
                  alt="Emblem"
                  className="h-12 w-auto object-contain filter drop-shadow-md"
                />
                <span className="text-xl font-black text-white">{loginTitle}</span>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-300 border border-cyan-400/40 px-2.5 py-0.5 bg-cyan-950/40 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Official Exam Prep Portal</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black leading-tight text-white">
                  {loginHeadline}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                  {loginDescription}
                </p>
              </div>

              <div className="grid grid-cols-3 border-t border-white/30 pt-3 gap-2 text-xs">
                {footnotes.map((fn, i) => (
                  <div key={i}>
                    <span className="text-slate-400 block text-[10px]">{fn.title}</span>
                    <span className="font-extrabold text-white text-xs">{fn.subtitle}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-[#201e1d]/30">
          <button
            type="submit"
            className="btn-primary px-8 py-3 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm"
          >
            {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Sparkles className="w-4 h-4" />}
            <span>{saved ? 'Settings Saved to Cloud!' : 'Save Branding, Logo & Background'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
