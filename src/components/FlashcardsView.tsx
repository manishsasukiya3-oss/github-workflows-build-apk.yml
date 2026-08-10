import React, { useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, RotateCw, CheckCircle2, HelpCircle, Sparkles, Award } from 'lucide-react';
import { Test, Question } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface FlashcardsViewProps {
  tests: Test[];
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({ tests }) => {
  const { t } = useLanguage();
  const [selectedTestId, setSelectedTestId] = useState<string>(tests[0]?.testId || '');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());

  const selectedTest = tests.find((t) => t.testId === selectedTestId) || tests[0];
  const questions: Question[] = selectedTest?.questions || [];
  const currentQ: Question | undefined = questions[currentQuestionIndex];

  const handleNext = () => {
    setIsFlipped(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setCurrentQuestionIndex(0);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else {
      setCurrentQuestionIndex(questions.length - 1);
    }
  };

  const toggleMastered = (qId: string) => {
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  if (!tests || tests.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 max-w-md mx-auto">
        <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">ફ્લેશકાર્ડ માટે કોઈ ટેસ્ટ ઉપલબ્ધ નથી</h3>
        <p className="text-xs text-slate-400">એડમિન દ્વારા ટેસ્ટ ઉમેરાયા બાદ તમે અહીં ક્વિક રિવિઝન કરી શકશો.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-200 font-bold text-xs uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4 text-pink-300" />
            <span>{t('flashcardsTag', 'ઝડપી પુનરાવર્તન - ક્વિક ફ્લેશકાર્ડ્સ')}</span>
          </div>
          <h2 className="text-2xl font-black">
            {t('flashcardsTitle', 'પ્રશ્નોત્તરી ફ્લેશકાર્ડ રિવિઝન મોડ')}
          </h2>
          <p className="text-indigo-100 text-xs md:text-sm mt-1">
            કાર્ડ પર ક્લિક કરી સાચો ઉત્તર અને સમજૂતી જુઓ. સરળતાથી મોક ટેસ્ટનું ક્વિક રિવિઝન કરો.
          </p>
        </div>

        {/* Test Dropdown Selector */}
        <div className="shrink-0 w-full md:w-auto">
          <select
            value={selectedTestId}
            onChange={(e) => {
              setSelectedTestId(e.target.value);
              setCurrentQuestionIndex(0);
              setIsFlipped(false);
            }}
            className="w-full bg-slate-950/80 border border-white/30 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow focus:outline-none focus:border-indigo-400"
          >
            {tests.map((test) => (
              <option key={test.testId} value={test.testId}>
                📝 {test.title} ({test.questions?.length || 0} પ્રશ્નો)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Flashcard Interactive Area */}
      {currentQ ? (
        <div className="space-y-4">
          {/* Progress Header */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
            <span>
              પ્રશ્ન {currentQuestionIndex + 1} / {questions.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">
                ✅ યાદ રહી ગયેલ: {masteredIds.size}
              </span>
            </div>
          </div>

          {/* Flashcard Box */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`min-h-[280px] bg-slate-900 border-2 rounded-3xl p-6 sm:p-8 flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-2xl relative select-none ${
              isFlipped
                ? 'border-emerald-500/80 bg-gradient-to-b from-slate-900 to-emerald-950/30'
                : 'border-indigo-500/50 hover:border-indigo-400 bg-gradient-to-b from-slate-900 to-indigo-950/20'
            }`}
          >
            {/* Top Indicator Badge */}
            <div className="flex items-center justify-between">
              <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-500/20">
                {selectedTest.category || 'GK Exam'}
              </span>

              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-full">
                <RotateCw className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
                <span>{isFlipped ? 'ઉત્તર છુપાવો' : 'ઉત્તર જોવા માટે ક્લિક કરો'}</span>
              </span>
            </div>

            {/* Content (Front: Question | Back: Answer & Explanation) */}
            <div className="my-6">
              {!isFlipped ? (
                <div className="space-y-4">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-relaxed">
                    {currentQ.question}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800">
                    {currentQ.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className="bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-300 text-xs font-semibold flex items-center gap-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 font-bold text-xs px-3 py-1 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>સાચો જવાબ:</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-emerald-300">
                    {currentQ.options[currentQ.correctAnswer]}
                  </h3>

                  {currentQ.explanation && (
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-slate-300 text-xs sm:text-sm leading-relaxed mt-2">
                      <strong className="text-indigo-300 block mb-1">💡 વિગતવાર સમજૂતી:</strong>
                      {currentQ.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Controls inside card */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMastered(currentQ.id || `q_${currentQuestionIndex}`);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  masteredIds.has(currentQ.id || `q_${currentQuestionIndex}`)
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {masteredIds.has(currentQ.id || `q_${currentQuestionIndex}`)
                    ? 'યાદ રહી ગયું!'
                    : 'યાદ રાખો'}
                </span>
              </button>

              <span className="text-[11px] text-slate-500 font-medium">
                ક્લિક કરીને કાર્ડ ફેરવો 🔄
              </span>
            </div>
          </div>

          {/* Navigation Prev / Next Buttons */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={handlePrev}
              className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>અગાઉનો પ્રશ્ન</span>
            </button>

            <button
              onClick={handleNext}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition"
            >
              <span>પછીનો પ્રશ્ન</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400">આ ટેસ્ટમાં કોઈ પ્રશ્નો ઉપલબ્ધ નથી.</div>
      )}
    </div>
  );
};
