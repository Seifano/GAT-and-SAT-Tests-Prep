import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { ExamType } from '../../types';

interface ReferenceSheetModalProps {
  exam: ExamType;
  isOpen: boolean;
  onClose: () => void;
}

export const ReferenceSheetModal: React.FC<ReferenceSheetModalProps> = ({
  exam,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white border-2 border-[#201e1d] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-[#201e1d] bg-[#f3f2f2]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#1f3d7a]" />
            <div>
              <h3 className="text-base font-extrabold text-[#201e1d]">
                {exam === 'NAFS' ? 'NAFS (G6 & G9) Reading & Language Reference Guide' : `${exam} Official Mathematics Reference Sheet`}
              </h3>
              <span className="text-[11px] text-slate-500 font-bold">
                {exam === 'NAFS' ? 'National standards reference for reading literacy and text analysis' : 'Standard reference formulas available during exam'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 text-[#201e1d] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {exam === 'NAFS' ? (
          <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#201e1d]">
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] border-b pb-1">
                Reading Strategies for NAFS (Grade 6 &amp; Grade 9)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200">
                  <span className="font-extrabold block text-sm text-emerald-900">1. Main Idea &amp; Central Theme</span>
                  <p className="text-[11px] text-emerald-800 mt-1">Look at the first and final sentences of each paragraph. Identify what the whole text is mostly about, not just a single interesting detail.</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200">
                  <span className="font-extrabold block text-sm text-blue-900">2. Words in Context Clues</span>
                  <p className="text-[11px] text-blue-800 mt-1">Reread the target sentence and substitute each answer choice into the sentence. The correct choice preserves the author's intended tone and meaning.</p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200">
                  <span className="font-extrabold block text-sm text-amber-900">3. Text Evidence &amp; Inferences</span>
                  <p className="text-[11px] text-amber-800 mt-1">Underline facts directly stated in the text. For inference questions, combine text clues with logical reasoning without assuming outside facts.</p>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200">
                  <span className="font-extrabold block text-sm text-purple-900">4. Author's Purpose &amp; Tone</span>
                  <p className="text-[11px] text-purple-800 mt-1">Determine why the author wrote the piece: to inform, explain, persuade, or reflect. Note positive, critical, or objective descriptive words.</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200">
              <strong className="block text-xs font-bold text-[#1f3d7a] mb-1">G6 vs G9 Focus Areas:</strong>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                <div><strong>Grade 6 (G6):</strong> Narrative comprehension, basic chronological sequencing, vocabulary definitions, sentence mechanics.</div>
                <div><strong>Grade 9 (G9):</strong> Multi-paragraph informational texts, nuances of tone, complex evidence synthesis, argument evaluation.</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#201e1d]">
          {/* Section 1: 2D Geometry & Areas */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] border-b pb-1">
              Area &amp; Circumference Formulas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200">
                <span className="font-extrabold block text-sm">Circle</span>
                <span className="font-mono text-xs block text-slate-700 mt-1">A = π r²</span>
                <span className="font-mono text-xs block text-slate-700">C = 2 π r</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Number of degrees in circle = 360°</span>
                <span className="text-[10px] text-slate-500 block">Number of radians = 2π</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200">
                <span className="font-extrabold block text-sm">Rectangle &amp; Parallelogram</span>
                <span className="font-mono text-xs block text-slate-700 mt-1">A = ℓ w</span>
                <span className="font-mono text-xs block text-slate-700">P = 2ℓ + 2w</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Parallelogram: A = b h</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200">
                <span className="font-extrabold block text-sm">Triangle</span>
                <span className="font-mono text-xs block text-slate-700 mt-1">A = ½ b h</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Sum of triangle angles = 180°</span>
                <span className="text-[10px] text-slate-500 block">Equilateral: A = (√3 / 4) s²</span>
              </div>
            </div>
          </div>

          {/* Section 2: Right Triangles & Trigonometry */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] border-b pb-1">
              Right Triangle &amp; Trigonometric Ratios
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200">
                <span className="font-extrabold block text-sm">Pythagorean Theorem</span>
                <span className="font-mono text-sm font-black text-[#1f3d7a] block mt-1">a² + b² = c²</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Common triples: (3, 4, 5), (5, 12, 13), (8, 15, 17), (7, 24, 25)</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200">
                <span className="font-extrabold block text-sm">Special Right: 30°-60°-90°</span>
                <span className="font-mono text-xs block text-slate-700 mt-1">Side opposite 30°: x</span>
                <span className="font-mono text-xs block text-slate-700">Side opposite 60°: x√3</span>
                <span className="font-mono text-xs block text-slate-700">Hypotenuse: 2x</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200">
                <span className="font-extrabold block text-sm">Special Right: 45°-45°-90°</span>
                <span className="font-mono text-xs block text-slate-700 mt-1">Legs: s, s</span>
                <span className="font-mono text-xs block text-slate-700">Hypotenuse: s√2</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Diagonal of square with side s</span>
              </div>
            </div>
          </div>

          {/* Section 3: 3D Solids & Volume */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#1f3d7a] border-b pb-1">
              3D Volume Formulas
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono text-[11px]">
              <div className="p-2.5 bg-slate-50 border border-slate-200 text-center">
                <span className="font-sans font-bold block text-xs">Rect Prism</span>
                <span className="text-slate-700 font-bold mt-1 block">V = ℓ w h</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 text-center">
                <span className="font-sans font-bold block text-xs">Cylinder</span>
                <span className="text-slate-700 font-bold mt-1 block">V = π r² h</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 text-center">
                <span className="font-sans font-bold block text-xs">Sphere</span>
                <span className="text-slate-700 font-bold mt-1 block">V = ⁴/₃ π r³</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 text-center">
                <span className="font-sans font-bold block text-xs">Cone</span>
                <span className="text-slate-700 font-bold mt-1 block">V = ⅓ π r² h</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 text-center">
                <span className="font-sans font-bold block text-xs">Pyramid</span>
                <span className="text-slate-700 font-bold mt-1 block">V = ⅓ ℓ w h</span>
              </div>
            </div>
          </div>

          {/* Section 4: Algebra & Qudurat/SAT Fundamentals */}
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-950 space-y-1">
            <strong className="block text-xs font-bold text-[#1f3d7a]">Algebraic Identities &amp; Laws:</strong>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              <span>(a + b)² = a² + 2ab + b²</span>
              <span>(a - b)² = a² - 2ab + b²</span>
              <span>a² - b² = (a + b)(a - b)</span>
            </div>
          </div>
        </div>
      )}

        {/* Footer */}
        <div className="p-4 border-t-2 border-[#201e1d] bg-[#f3f2f2] flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary px-5 py-2 text-white text-xs font-black cursor-pointer"
          >
            Close Sheet
          </button>
        </div>
      </div>
    </div>
  );
};
