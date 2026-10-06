import React, { useState } from 'react';
import { X, Delete, Divide, Plus, Minus, Equal } from 'lucide-react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  onClose
}) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [justCalculated, setJustCalculated] = useState(false);

  if (!isOpen) return null;

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
      // Sanitize expression: allow only numbers, operators, decimals, spaces
      const sanitized = full.replace(/×/g, '*').replace(/÷/g, '/');
      if (!/^[\d\s+\-*/.()]+$/.test(sanitized)) {
        setDisplay('Error');
        return;
      }
      // Safe math evaluation
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-[#201e1d] text-white border-2 border-slate-700 w-full max-w-xs shadow-2xl p-4 space-y-3 font-sans">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">
            Exam Calculator
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display */}
        <div className="bg-[#0f172a] p-3 text-right border border-slate-700 font-mono">
          <div className="text-[10px] text-slate-400 h-4 truncate">{expression || ' '}</div>
          <div className="text-2xl font-black text-white truncate tracking-tight">{display}</div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
          <button
            onClick={handleClear}
            className="p-2.5 bg-red-950 text-red-200 hover:bg-red-900 border border-red-800 cursor-pointer"
          >
            AC
          </button>
          <button
            onClick={handleSqrt}
            className="p-2.5 bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 cursor-pointer"
          >
            √
          </button>
          <button
            onClick={handleSquare}
            className="p-2.5 bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 cursor-pointer"
          >
            x²
          </button>
          <button
            onClick={handleBackspace}
            className="p-2.5 bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 cursor-pointer flex items-center justify-center"
          >
            <Delete className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleDigit('7')}
            className="p-2.5 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 cursor-pointer"
          >
            7
          </button>
          <button
            onClick={() => handleDigit('8')}
            className="p-2.5 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 cursor-pointer"
          >
            8
          </button>
          <button
            onClick={() => handleDigit('9')}
            className="p-2.5 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 cursor-pointer"
          >
            9
          </button>
          <button
            onClick={() => handleOp('÷')}
            className="p-2.5 bg-[#1f3d7a] text-white hover:bg-blue-800 border border-blue-900 cursor-pointer flex items-center justify-center"
          >
            <Divide className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleDigit('4')}
            className="p-2.5 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 cursor-pointer"
          >
            4
          </button>
          <button
            onClick={() => handleDigit('5')}
            className="p-2.5 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 cursor-pointer"
          >
            5
          </button>
          <button
            onClick={() => handleDigit('6')}
            className="p-2.5 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 cursor-pointer"
          >
            6
          </button>
          <button
            onClick={() => handleOp('×')}
            className="p-2.5 bg-[#1f3d7a] text-white hover:bg-blue-800 border border-blue-900 cursor-pointer font-bold text-sm"
          >
            ×
          </button>

          <button
            onClick={() => handleDigit('1')}
            className="p-2.5 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 cursor-pointer"
          >
            1
          </button>
          <button
            onClick={() => handleDigit('2')}
            className="p-2.5 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 cursor-pointer"
          >
            2
          </button>
          <button
            onClick={() => handleDigit('3')}
            className="p-2.5 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 cursor-pointer"
          >
            3
          </button>
          <button
            onClick={() => handleOp('-')}
            className="p-2.5 bg-[#1f3d7a] text-white hover:bg-blue-800 border border-blue-900 cursor-pointer flex items-center justify-center"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleDigit('0')}
            className="p-2.5 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 cursor-pointer"
          >
            0
          </button>
          <button
            onClick={() => handleDigit('.')}
            className="p-2.5 bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 cursor-pointer"
          >
            .
          </button>
          <button
            onClick={handleCalculate}
            className="p-2.5 bg-emerald-700 text-white hover:bg-emerald-600 border border-emerald-600 cursor-pointer flex items-center justify-center"
          >
            <Equal className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOp('+')}
            className="p-2.5 bg-[#1f3d7a] text-white hover:bg-blue-800 border border-blue-900 cursor-pointer flex items-center justify-center"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
