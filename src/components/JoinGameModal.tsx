import React, { useState } from 'react';
import { UserAccount } from '../types';
import { Language, t } from '../utils/i18n';
import {
  Gamepad2,
  X,
  Sparkles,
  ArrowRight,
  Shield,
  Crown,
  Star,
  Zap,
  Rocket,
  Flame,
  Gem
} from 'lucide-react';

export const MASCOTS = [
  { id: 'falcon', label: 'Falcon', emoji: '🦅', color: 'from-amber-500 to-orange-600' },
  { id: 'camel', label: 'Desert Camel', emoji: '🐪', color: 'from-yellow-500 to-amber-700' },
  { id: 'palm', label: 'Golden Palm', emoji: '🌴', color: 'from-emerald-500 to-teal-700' },
  { id: 'crown', label: 'Scholar Crown', emoji: '👑', color: 'from-indigo-500 to-purple-600' },
  { id: 'shield', label: 'Guardian Shield', emoji: '🛡️', color: 'from-blue-500 to-indigo-700' },
  { id: 'star', label: 'Star Champion', emoji: '⭐', color: 'from-amber-400 to-yellow-600' },
  { id: 'rocket', label: 'Speed Rocket', emoji: '🚀', color: 'from-rose-500 to-red-700' },
  { id: 'diamond', label: 'Elite Diamond', emoji: '💎', color: 'from-cyan-400 to-blue-600' }
];

interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (pin: string, playerName: string, avatarId: string, isGuest: boolean) => void;
  initialPin?: string;
  user: UserAccount | null;
  language?: Language;
}

export const JoinGameModal: React.FC<JoinGameModalProps> = ({
  isOpen,
  onClose,
  onJoin,
  initialPin = '',
  user,
  language = 'en'
}) => {
  const [pin, setPin] = useState(initialPin);
  const [name, setName] = useState(user?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState('falcon');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(raw);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim().replace(/\s+/g, '');
    if (cleanPin.length !== 6) {
      setError(language === 'ar' ? 'الرجاء إدخال رمز مسابقة صالح مكون من 6 أرقام' : 'Please enter a valid 6-digit game PIN');
      return;
    }
    const cleanName = name.trim();
    if (!cleanName) {
      setError(language === 'ar' ? 'الرجاء إدخال اسمك أو لقبك للمشاركة' : 'Please enter your name or nickname to join');
      return;
    }

    const isGuest = !user;
    onJoin(cleanPin, cleanName, selectedAvatar, isGuest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-viewFadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* School Heritage Tri-Color Ribbon */}
        <div className="school-ribbon h-1.5 w-full" />

        {/* Colorful Header */}
        <div className="relative bg-gradient-to-r from-blue-900 via-indigo-900 to-rose-700 p-6 text-white text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 border border-white/30 shadow-inner mb-2.5">
            <Gamepad2 className="w-6 h-6 text-yellow-300 animate-bounce" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-bold text-amber-200 mb-1 border border-white/20">
            <span>{language === 'ar' ? 'سعة الجلسة: 25 طالباً كحد أقصى' : 'Live Arena: Max 25 Scholars Capacity'}</span>
          </div>

          <h2 className="text-xl font-black tracking-tight">
            {t('joinGame', language)}
          </h2>
          <p className="text-xs text-blue-100 font-medium mt-1">
            {language === 'ar'
              ? 'انضم إلى ساحة المسابقة التفاعلية المباشرة مع معلمك وزملائك'
              : 'Join the live interactive practice arena hosted by your teacher'}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PIN Input */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
              {t('gamePin', language)}
            </label>
            <div className="relative">
              <input
                type="text"
                value={pin}
                onChange={handlePinChange}
                placeholder="000 000"
                maxLength={6}
                autoFocus
                className="w-full text-center tracking-[0.3em] font-mono text-2xl font-black py-3 px-4 bg-slate-50 border-2 border-indigo-200 focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all shadow-inner text-indigo-950 placeholder-slate-300"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block text-center">
              {language === 'ar' ? 'اطلب الرمز من معلمك أو امسح رمز الاستجابة السريعة (QR)' : 'Ask your teacher for the 6-digit Game PIN displayed on the board'}
            </span>
          </div>

          {/* Player Name */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
              {language === 'ar' ? 'اسم اللاعب / اللقب' : 'Your Nickname / Player Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: فهد، سارة، البطل' : 'e.g. Fahad, Sarah, Champion'}
              maxLength={24}
              className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl text-sm font-bold text-slate-800 outline-none transition-all"
            />
            {user ? (
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                ✓ {language === 'ar' ? `مسجل كطالب: @${user.username}` : `Joined with scholar account: @${user.username}`}
              </span>
            ) : (
              <span className="text-[11px] text-indigo-600 font-semibold mt-1 block">
                ✦ {language === 'ar' ? 'الدخول كضيف (لا يلزم تسجيل الدخول)' : 'Joining as Guest (no login required)'}
              </span>
            )}
          </div>

          {/* Mascot / Avatar Selector */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
              {language === 'ar' ? 'اختر رمزك الأيقوني (Blook)' : 'Choose Your Mascot (Blook)'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {MASCOTS.map(m => {
                const isSelected = selectedAvatar === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedAvatar(m.id)}
                    className={`p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-2 border-indigo-600 shadow-md scale-105'
                        : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-2xl mb-1">{m.emoji}</span>
                    <span className="text-[10px] font-bold text-slate-600 truncate max-w-full">
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 group mt-2"
          >
            <span>{language === 'ar' ? 'دخول ساحة المسابقة 🎮' : 'Enter Live Arena 🎮'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};
