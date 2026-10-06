import React, { useState } from 'react';
import { ExamType, UserProfile } from '../types';
import { EXAM_CONFIGS } from '../data/mockData';
import { AHS_LOGO_SRC } from '../assets/logo';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingModalProps {
  initialProfile: UserProfile;
  onComplete: (profile: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ initialProfile, onComplete }) => {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [error, setError] = useState('');

  const toggleExam = (exam: ExamType) => {
    const exists = profile.exams.includes(exam);
    if (exists && profile.exams.length === 1) {
      setError('Pick at least one exam.');
      return;
    }
    setError('');
    const newExams = exists ? profile.exams.filter(e => e !== exam) : [...profile.exams, exam];
    setProfile(p => ({ ...p, exams: newExams }));
  };

  const handleNext = () => {
    if (step === 0 && profile.exams.length === 0) {
      setError('Pick at least one exam.');
      return;
    }
    setError('');
    if (step < 2) {
      setStep((step + 1) as 1 | 2);
    } else {
      onComplete(profile);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((step - 1) as 0 | 1);
    }
  };

  const titles = [
    { kicker: 'Exams', title: 'Which exams are you preparing for?' },
    { kicker: 'Goals', title: 'What score are you aiming for?' },
    { kicker: 'Schedule', title: 'When is your test?' }
  ];

  return (
    <div className="min-h-screen bg-[#f3f2f2] flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between p-5 border-b-2 border-[#201e1d]/30 bg-[#f3f2f2]">
        <div className="flex items-center gap-3 font-extrabold text-lg text-[#201e1d]">
          <img src={AHS_LOGO_SRC} alt="Logo" className="h-8 w-auto object-contain" />
          <span>AHS Exams Prepline</span>
        </div>
        <div className="text-xs font-bold text-slate-500">
          Step {step + 1} of 3
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-3 gap-0.5 bg-slate-300">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-1 transition-all ${
              i <= step ? 'bg-[#1f3d7a]' : 'bg-transparent'
            }`}
          />
        ))}
      </div>

      {/* Main Body */}
      <div className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-10 flex flex-col justify-center gap-8">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] block mb-1">
            {titles[step].kicker}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#201e1d] tracking-tight">
            {titles[step].title}
          </h1>
        </div>

        {/* Step 0: Exam Pickers */}
        {step === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['GAT', 'SAT'] as ExamType[]).map(eKey => {
              const conf = EXAM_CONFIGS[eKey];
              const sel = profile.exams.includes(eKey);
              return (
                <button
                  key={eKey}
                  type="button"
                  onClick={() => toggleExam(eKey)}
                  className={`p-6 border-2 text-left cursor-pointer transition-all flex flex-col justify-between min-h-[170px] ${
                    sel
                      ? 'border-[#1f3d7a] bg-[#1f3d7a]/5'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-4xl font-black text-[#201e1d] tracking-tight">
                      {conf.id}
                    </span>
                    <div
                      className={`w-6 h-6 border-2 flex items-center justify-center ${
                        sel ? 'border-[#1f3d7a] bg-[#1f3d7a] text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {sel && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>
                  <div className="font-bold text-sm text-[#201e1d] mb-1">{conf.full}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{conf.desc}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 1: Target Scores */}
        {step === 1 && (
          <div className="border-t-2 border-l-2 border-[#201e1d]/30 bg-white">
            {profile.exams.map(eKey => {
              const conf = EXAM_CONFIGS[eKey];
              const target = profile.targets[eKey];
              return (
                <div key={eKey} className="p-6 border-r-2 border-b-2 border-[#201e1d]/30 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-[#201e1d]">{conf.id} target</span>
                    <span className="text-4xl font-black text-[#1f3d7a] tabular-nums">
                      {target}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={conf.min}
                    max={conf.max}
                    step={conf.step}
                    value={target}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      setProfile(p => ({
                        ...p,
                        targets: { ...p.targets, [eKey]: v }
                      }));
                    }}
                    className="w-full accent-[#1f3d7a] cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 font-bold">
                    <span>{conf.min}</span>
                    <span>{conf.hint}</span>
                    <span>{conf.max}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Step 2: Test Dates */}
        {step === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.exams.map(eKey => {
              const conf = EXAM_CONFIGS[eKey];
              const dateVal = profile.dates[eKey] || '2026-11-20';
              const days = Math.max(
                0,
                Math.ceil((new Date(dateVal + 'T00:00:00').getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
              );

              return (
                <div key={eKey} className="p-6 bg-white border-2 border-slate-300 space-y-3">
                  <label className="block text-base font-extrabold text-[#201e1d]">
                    {conf.id} test date
                  </label>
                  <input
                    type="date"
                    value={dateVal}
                    onChange={e => {
                      const d = e.target.value;
                      setProfile(p => ({
                        ...p,
                        dates: { ...p.dates, [eKey]: d }
                      }));
                    }}
                    className="w-full p-2.5 bg-[#f3f2f2] border border-slate-300 text-sm font-bold text-[#201e1d]"
                  />
                  <div className="text-xs text-slate-500 font-semibold">{days} days from today</div>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-900 text-xs font-bold">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-4 border-t-2 border-[#201e1d]/30">
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-5 py-3 border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-[#201e1d] cursor-pointer"
            >
              Back
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="btn-primary min-w-[200px] py-3 px-6 text-white text-xs font-black flex items-center justify-between cursor-pointer"
          >
            <span>{step === 2 ? 'Go to dashboard' : 'Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
