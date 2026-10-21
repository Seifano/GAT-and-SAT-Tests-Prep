import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Delete,
  Divide,
  Plus,
  Minus,
  Equal,
  Maximize2,
  Minimize2,
  ExternalLink,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
  PanelRightClose,
  PanelRightOpen,
  Calculator as CalcIcon
} from 'lucide-react';
import { ExamType } from '../../types';

export interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam?: ExamType | string;
  initialMode?: 'desmos-graphing' | 'desmos-scientific' | 'basic';
}

type CalculatorMode = 'desmos-graphing' | 'desmos-scientific' | 'basic';
type WindowLayout = 'docked' | 'modal' | 'fullscreen';

// College Board SAT Desmos Tips
const SAT_DESMOS_TIPS = [
  {
    title: 'Solving Systems of Equations',
    shortcut: 'Type both equations on separate lines',
    description: 'Graph both equations (e.g., y = 3x - 5 and 2x + 4y = 14). Desmos automatically marks their intersection point with a gray dot. Click it to read the exact (x, y) solution!',
    example: 'y = 2x + 1 \\n 3x - y = 4'
  },
  {
    title: 'Finding Zeros, Roots & X-Intercepts',
    shortcut: 'Graph y = f(x)',
    description: 'Enter any equation like y = 2x² - 5x - 3. Gray dots instantly mark every real x-intercept. Click the dots to get roots without factoring!',
    example: 'y = 2x^2 - 5x - 3'
  },
  {
    title: 'Parabola Vertex & Maximum/Minimum',
    shortcut: 'Graph quadratic, click the apex dot',
    description: 'For any quadratic expression, Desmos marks the vertex extremum. Click the vertex dot to get the maximum/minimum value (y-coordinate) and where it occurs (x-coordinate).',
    example: 'y = -(x - 3)^2 + 8'
  },
  {
    title: 'Checking Equivalent Expressions',
    shortcut: 'Graph original expression & each choice',
    description: 'When asked "Which expression is equivalent to...?", graph the original prompt as y1. Graph choices A, B, C, D. The graph that lies completely on top of the original is the answer!',
    example: 'y = (2x + 3)^2 - 5'
  },
  {
    title: 'Evaluating Functions f(x)',
    shortcut: 'Define f(x), then evaluate on next line',
    description: 'Define f(x) = 3x² - 7x + 11 on line 1. On line 2, type f(4) or f(-2) to compute the exact answer instantly.',
    example: 'f(x) = 3x^2 - 7x + 11 \\n f(4)'
  },
  {
    title: 'Linear Regressions & Line of Best Fit',
    shortcut: 'Add Table -> type y₁ ~ m x₁ + b',
    description: 'Click [+] -> Table. Enter given coordinate pairs (x₁, y₁). On the next row, type y1 ~ m x1 + b. Desmos computes the slope m, intercept b, and correlation r² automatically!',
    example: 'y1 ~ m x1 + b'
  },
  {
    title: 'Inequalities & Shaded Regions',
    shortcut: 'Use <, >, <=, or >=',
    description: 'Type inequalities directly (e.g., y >= 2x - 4). Desmos accurately shades the solution set and displays solid vs dashed boundary lines.',
    example: 'y >= 2x - 4'
  }
];

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  onClose,
  exam = 'SAT',
  initialMode
}) => {
  // Default to Desmos Graphing for SAT, or respect initialMode
  const isSatTrack = exam === 'SAT';
  const defaultMode: CalculatorMode = initialMode || (isSatTrack ? 'desmos-graphing' : 'desmos-graphing');

  const [mode, setMode] = useState<CalculatorMode>(defaultMode);
  const [layout, setLayout] = useState<WindowLayout>('modal');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Standard Keypad State
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [justCalculated, setJustCalculated] = useState(false);

  // Reset or set appropriate mode when opening or exam changes
  useEffect(() => {
    if (isOpen) {
      if (initialMode) {
        setMode(initialMode);
      } else if (exam === 'SAT') {
        setMode('desmos-graphing');
      }
      setIsMinimized(false);
    }
  }, [isOpen, exam, initialMode]);

  if (!isOpen) return null;

  // Keypad Handlers
  const handleDigit = (d: string) => {
    if (justCalculated || display === '0') {
      setDisplay(d);
      setJustCalculated(false);
    } else {
      setDisplay(prev => (prev.length < 16 ? prev + d : prev));
    }
  };

  const handleOp = (op: string) => {
    setExpression(`${display} ${op} `);
    setDisplay('0');
    setJustCalculated(false);
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
    setJustCalculated(false);
  };

  const handleBackspace = () => {
    if (justCalculated) {
      handleClear();
      return;
    }
    setDisplay(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleCalculate = () => {
    try {
      const full = expression + display;
      const sanitized = full.replace(/×/g, '*').replace(/÷/g, '/');
      if (!/^[\d\s+\-*/.()]+$/.test(sanitized)) {
        setDisplay('Error');
        return;
      }
      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${sanitized})`)();
      if (!isFinite(result)) {
        setDisplay('Error');
      } else {
        const rounded = Math.round(result * 100000000) / 100000000;
        setDisplay(String(rounded));
        setExpression('');
        setJustCalculated(true);
      }
    } catch {
      setDisplay('Error');
    }
  };

  const handleSqrt = () => {
    const val = parseFloat(display);
    if (val < 0) {
      setDisplay('Error');
    } else {
      setDisplay(String(Math.round(Math.sqrt(val) * 100000000) / 100000000));
      setJustCalculated(true);
    }
  };

  const handleSquare = () => {
    const val = parseFloat(display);
    setDisplay(String(Math.round(val * val * 100000000) / 100000000));
    setJustCalculated(true);
  };

  // If minimized into a floating quick-access bubble at bottom right
  if (isMinimized) {
    return createPortal(
      <div className="fixed bottom-6 right-6 z-50 animate-bounce-subtle">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 px-4 py-3 bg-[#135a39] hover:bg-[#0f462c] text-white font-bold rounded-2xl shadow-2xl border-2 border-emerald-400 cursor-pointer transition-all hover:scale-105 active:scale-95"
          title="Restore Desmos SAT Calculator"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-400 text-[#135a39] font-black text-xs flex items-center justify-center">
            D
          </div>
          <span className="text-sm tracking-wide">
            {mode === 'desmos-graphing'
              ? 'Desmos SAT Graphing Calculator'
              : mode === 'desmos-scientific'
              ? 'Desmos Scientific'
              : 'Standard Keypad'}
          </span>
          <span className="text-[10px] bg-emerald-300 text-[#135a39] font-black px-1.5 py-0.5 rounded-full uppercase">
            Active
          </span>
        </button>
      </div>,
      document.body
    );
  }

  // Layout styling
  const isDocked = layout === 'docked';
  const isFullscreen = layout === 'fullscreen';

  const modalContainerClasses = isDocked
    ? 'fixed top-0 right-0 h-full w-full md:w-[620px] lg:w-[680px] z-50 bg-[#1e222b] text-white shadow-2xl border-l-2 border-slate-700 flex flex-col'
    : isFullscreen
    ? 'fixed inset-0 z-50 bg-[#1e222b] text-white flex flex-col p-2 sm:p-4'
    : 'relative w-full max-w-4xl bg-[#1e222b] text-white border-2 border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:h-[82vh]';

  return createPortal(
    <div
      className={
        isDocked
          ? 'fixed inset-0 z-50 pointer-events-none'
          : 'fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4'
      }
    >
      <div className={`${modalContainerClasses} pointer-events-auto`}>
        {/* Header Toolbar */}
        <div className="bg-[#151821] px-3.5 py-2.5 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setMode('desmos-graphing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'desmos-graphing'
                  ? 'bg-[#135a39] text-emerald-200 border border-emerald-500/50 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Official College Board SAT Desmos Graphing Calculator"
            >
              <span className="w-4 h-4 rounded bg-emerald-400 text-[#135a39] font-black text-[10px] flex items-center justify-center">
                D
              </span>
              <span>Desmos Graphing</span>
              {isSatTrack && (
                <span className="hidden sm:inline-block text-[9px] bg-emerald-400/20 text-emerald-300 font-black px-1.5 py-0.2 rounded-full uppercase border border-emerald-400/30">
                  SAT Official
                </span>
              )}
            </button>

            <button
              onClick={() => setMode('desmos-scientific')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'desmos-scientific'
                  ? 'bg-blue-900/80 text-sky-200 border border-sky-500/50 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Desmos Scientific Calculator"
            >
              <span>Scientific</span>
            </button>

            <button
              onClick={() => setMode('basic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'basic'
                  ? 'bg-slate-700 text-white border border-slate-500 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Compact Quick Arithmetic Keypad"
            >
              <CalcIcon className="w-3.5 h-3.5" />
              <span>Keypad</span>
            </button>
          </div>

          {/* Action / Window Buttons */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* SAT Tips Button */}
            {mode === 'desmos-graphing' && (
              <button
                onClick={() => setShowTips(!showTips)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  showTips
                    ? 'bg-amber-900/60 text-amber-200 border-amber-500'
                    : 'bg-slate-800/80 text-amber-300 border-amber-500/40 hover:bg-slate-700'
                }`}
                title="Toggle SAT Math Desmos Tips & Shortcuts"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">SAT Desmos Tips</span>
                {showTips ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Reload Iframe in case of connection glitch */}
            {mode.startsWith('desmos') && (
              <button
                onClick={() => setIframeKey(k => k + 1)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                title="Reset / Reload Desmos Calculator"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Dock to Right / Split-Screen Toggle */}
            <button
              onClick={() => setLayout(layout === 'docked' ? 'modal' : 'docked')}
              className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                isDocked ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isDocked ? 'Return to Centered Window' : 'Dock to Right (Split-Screen side-by-side with questions)'}
            >
              {isDocked ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>

            {/* Maximize / Standard Toggle */}
            {!isDocked && (
              <button
                onClick={() => setLayout(layout === 'fullscreen' ? 'modal' : 'fullscreen')}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                title={isFullscreen ? 'Restore Size' : 'Maximize Full Screen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}

            {/* Minimize to Floating Pill */}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              title="Minimize to floating pill (preserves graphs)"
            >
              <Minimize2 className="w-3.5 h-3.5 rotate-45" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-red-900/60 hover:text-red-200 rounded-lg cursor-pointer ml-1"
              title="Close calculator"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SAT Desmos Cheat Sheet Collapsible Banner */}
        {showTips && mode === 'desmos-graphing' && (
          <div className="bg-[#111c16] border-b border-emerald-800/80 p-3.5 max-h-56 overflow-y-auto space-y-2.5 shrink-0 text-xs text-slate-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-emerald-900">
              <div className="flex items-center gap-2 font-black text-emerald-300 uppercase tracking-wider text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Essential SAT Math Desmos Tricks (College Board Proven)</span>
              </div>
              <button
                onClick={() => setShowTips(false)}
                className="text-slate-400 hover:text-white text-[11px] underline cursor-pointer"
              >
                Hide
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {SAT_DESMOS_TIPS.map((tip, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-emerald-900/50 p-2.5 rounded-xl space-y-1"
                >
                  <div className="font-bold text-emerald-200 flex items-center justify-between">
                    <span>{tip.title}</span>
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
                      {tip.shortcut}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                    {tip.description}
                  </p>
                  <div className="text-[10px] font-mono bg-black/50 text-sky-300 px-2 py-1 rounded border border-slate-800">
                    Example: {tip.example}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calculator Body */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#0f1117] relative">
          {/* Mode 1: Desmos Graphing Calculator */}
          {mode === 'desmos-graphing' && (
            <div className="flex-1 w-full h-full relative flex flex-col">
              <iframe
                key={`desmos-graphing-${iframeKey}`}
                src="https://www.desmos.com/testing/default/graphing"
                title="Desmos Graphing Calculator (College Board SAT Testing Version)"
                className="w-full h-full flex-1 border-0 rounded-b-xl"
                allow="clipboard-write"
                loading="eager"
              />
              <div className="bg-[#151821] px-3 py-1.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 font-bold">Official SAT Testing Desmos Mode</span>
                  <span>· Type equations, click gray dots for roots/intersections</span>
                </span>
                <a
                  href="https://www.desmos.com/testing/default/graphing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1 underline text-sky-400"
                >
                  <span>Open in external tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Mode 2: Desmos Scientific Calculator */}
          {mode === 'desmos-scientific' && (
            <div className="flex-1 w-full h-full relative flex flex-col">
              <iframe
                key={`desmos-sci-${iframeKey}`}
                src="https://www.desmos.com/scientific?embed"
                title="Desmos Scientific Calculator"
                className="w-full h-full flex-1 border-0 rounded-b-xl"
                allow="clipboard-write"
                loading="eager"
              />
              <div className="bg-[#151821] px-3 py-1.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
                <span className="text-sky-300 font-bold">Desmos Scientific Calculator</span>
                <a
                  href="https://www.desmos.com/scientific"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1 underline text-sky-400"
                >
                  <span>External window</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Mode 3: Built-in Compact Keypad */}
          {mode === 'basic' && (
            <div className="flex-1 flex items-center justify-center p-6 bg-[#161a23]">
              <div className="bg-[#20242f] text-white border-2 border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4 font-sans">
                {/* Display */}
                <div className="bg-[#0b0e14] p-4 text-right rounded-xl border border-slate-700 font-mono">
                  <div className="text-xs text-slate-400 h-5 truncate">{expression || ' '}</div>
                  <div className="text-3xl font-black text-white truncate tracking-tight">{display}</div>
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-4 gap-2 text-sm font-bold">
                  <button
                    onClick={handleClear}
                    className="p-3 bg-red-950/80 text-red-200 hover:bg-red-900 border border-red-800/80 rounded-xl cursor-pointer"
                  >
                    AC
                  </button>
                  <button
                    onClick={handleSqrt}
                    className="p-3 bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer"
                  >
                    √
                  </button>
                  <button
                    onClick={handleSquare}
                    className="p-3 bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer"
                  >
                    x²
                  </button>
                  <button
                    onClick={handleBackspace}
                    className="p-3 bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer flex items-center justify-center"
                  >
                    <Delete className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDigit('7')}
                    className="p-3 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer"
                  >
                    7
                  </button>
                  <button
                    onClick={() => handleDigit('8')}
                    className="p-3 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer"
                  >
                    8
                  </button>
                  <button
                    onClick={() => handleDigit('9')}
                    className="p-3 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer"
                  >
                    9
                  </button>
                  <button
                    onClick={() => handleOp('÷')}
                    className="p-3 bg-[#1f3d7a] text-white hover:bg-blue-800 border border-blue-900 rounded-xl cursor-pointer flex items-center justify-center"
                  >
                    <Divide className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDigit('4')}
                    className="p-3 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer"
                  >
                    4
                  </button>
                  <button
                    onClick={() => handleDigit('5')}
                    className="p-3 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer"
                  >
                    5
                  </button>
                  <button
                    onClick={() => handleDigit('6')}
                    className="p-3 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer"
                  >
                    6
                  </button>
                  <button
                    onClick={() => handleOp('×')}
                    className="p-3 bg-[#1f3d7a] text-white hover:bg-blue-800 border border-blue-900 rounded-xl cursor-pointer font-bold"
                  >
                    ×
                  </button>

                  <button
                    onClick={() => handleDigit('1')}
                    className="p-3 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer"
                  >
                    1
                  </button>
                  <button
                    onClick={() => handleDigit('2')}
                    className="p-3 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer"
                  >
                    2
                  </button>
                  <button
                    onClick={() => handleDigit('3')}
                    className="p-3 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer"
                  >
                    3
                  </button>
                  <button
                    onClick={() => handleOp('-')}
                    className="p-3 bg-[#1f3d7a] text-white hover:bg-blue-800 border border-blue-900 rounded-xl cursor-pointer flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDigit('0')}
                    className="p-3 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    onClick={() => handleDigit('.')}
                    className="p-3 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer"
                  >
                    .
                  </button>
                  <button
                    onClick={handleCalculate}
                    className="p-3 bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-500 rounded-xl cursor-pointer flex items-center justify-center"
                  >
                    <Equal className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOp('+')}
                    className="p-3 bg-[#1f3d7a] text-white hover:bg-blue-800 border border-blue-900 rounded-xl cursor-pointer flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
