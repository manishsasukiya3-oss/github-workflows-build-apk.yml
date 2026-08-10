import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Award, 
  FileText, 
  ArrowLeft, 
  HelpCircle,
  BarChart2,
  Check,
  Send,
  RotateCcw
} from 'lucide-react';
import { Test, TestResult } from '../types';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, db } from '../lib/db';

interface TestExamViewProps {
  test: Test;
  onClose: () => void;
  onResultSubmitted?: (result: TestResult) => void;
}

export const TestExamView: React.FC<TestExamViewProps> = ({ 
  test, 
  onClose,
  onResultSubmitted 
}) => {
  const { userProfile } = useAuth();
  
  // Stages: 'instructions' | 'exam' | 'confirm_submit' | 'result'
  const [stage, setStage] = useState<'instructions' | 'exam' | 'confirm_submit' | 'result'>('instructions');
  
  // Exam state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(test.duration * 60);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedResult, setSubmittedResult] = useState<TestResult | null>(null);

  // Timer effect
  useEffect(() => {
    if (stage !== 'exam') return;

    if (timeLeftSeconds <= 0) {
      // Auto submit when timer expires
      handleFinalSubmission();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, timeLeftSeconds]);

  // Handle option selection
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  // Clear answer for current question
  const handleClearAnswer = (questionId: string) => {
    setUserAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  // Submit test and calculate metrics
  const handleFinalSubmission = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const questions = test.questions || [];
    let score = 0;
    let totalPossibleMarks = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    questions.forEach((q) => {
      const qMarks = q.marks || 1;
      totalPossibleMarks += qMarks;

      const selectedOpt = userAnswers[q.id];
      if (selectedOpt === undefined) {
        unansweredCount++;
      } else if (selectedOpt === q.correctAnswer) {
        correctCount++;
        score += qMarks;
      } else {
        wrongCount++;
      }
    });

    const totalMarks = test.totalMarks || totalPossibleMarks || questions.length;
    const percentage = Math.max(0, Math.round((score / (totalMarks || 1)) * 100));
    const completionTimeSeconds = (test.duration * 60) - timeLeftSeconds;

    const resultData: Omit<TestResult, 'resultId'> = {
      userId: userProfile?.userId || 'anonymous',
      userName: userProfile?.name || 'Student',
      userEmail: userProfile?.email || '',
      testId: test.testId,
      testTitle: test.title,
      groupIds: test.groupIds || [],
      score: score,
      totalMarks: totalMarks,
      percentage: percentage,
      correct: correctCount,
      wrong: wrongCount,
      unanswered: unansweredCount,
      completionTimeSeconds: Math.max(1, completionTimeSeconds),
      submittedAt: new Date().toISOString(),
      userAnswers: userAnswers,
    };

    try {
      const docRef = await addDoc(collection(db, 'results'), resultData);
      const fullResult: TestResult = {
        resultId: docRef.id,
        ...resultData,
      };

      setSubmittedResult(fullResult);
      if (onResultSubmitted) {
        onResultSubmitted(fullResult);
      }
      setStage('result');
    } catch (err) {
      console.error('Failed to submit online result:', err);
      // Even if Firestore fails, show local result calculation so user doesn't lose exam submission
      const fallbackResult: TestResult = {
        resultId: `local_${Date.now()}`,
        ...resultData,
      };
      setSubmittedResult(fallbackResult);
      setStage('result');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = test.questions?.[currentQuestionIndex];
  const totalQ = test.questions?.length || 0;
  const answeredCount = Object.keys(userAnswers).length;

  // 1. Instructions Screen
  if (stage === 'instructions') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/95 text-slate-100 flex flex-col justify-between p-4 md:p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full my-auto space-y-6">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" /> Exit Examination
          </button>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="space-y-2 border-b border-slate-700 pb-4">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2.5 py-1 rounded-full font-medium">
                {test.category || 'Examination'}
              </span>
              <h2 className="text-2xl font-bold text-white">{test.title}</h2>
              <p className="text-sm text-slate-300">{test.description || 'No special instructions provided.'}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50 flex items-center gap-3">
                <Clock className="w-6 h-6 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Duration</p>
                  <p className="text-sm font-bold text-white">{test.duration} Minutes</p>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50 flex items-center gap-3">
                <FileText className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Questions</p>
                  <p className="text-sm font-bold text-white">{totalQ} MCQs</p>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50 flex items-center gap-3 col-span-2 md:col-span-1">
                <Award className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Marks</p>
                  <p className="text-sm font-bold text-white">{test.totalMarks || totalQ} Marks</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-900/80 p-4 rounded-xl border border-slate-700/80 text-xs text-slate-300">
              <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" /> Exam Rules & Guidelines:
              </h4>
              <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-300">
                <li>Timer starts immediately when you click <strong>Start Test Now</strong>.</li>
                <li>You can navigate between questions at any time using the question navigator.</li>
                <li>When the time limit expires, your test will be <strong>automatically submitted</strong>.</li>
                <li>Results, correct answers, and explanations will be generated instantly online.</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setTimeLeftSeconds(test.duration * 60);
                setStage('exam');
              }}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition text-sm flex items-center justify-center gap-2"
            >
              Start Examination Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Exam Mode
  if (stage === 'exam' || stage === 'confirm_submit') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 text-slate-100 flex flex-col justify-between overflow-hidden">
        {/* Exam Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
          <div className="truncate max-w-[50%]">
            <h3 className="font-bold text-sm text-white truncate">{test.title}</h3>
            <span className="text-[11px] text-slate-400">
              Q {currentQuestionIndex + 1} of {totalQ}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-xs ${
              timeLeftSeconds < 120 
                ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse' 
                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(timeLeftSeconds)}</span>
            </div>

            <button
              onClick={() => setStage('confirm_submit')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" /> Submit
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
          {/* Question Matrix Navigator Pill Grid */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Question Navigator</span>
              <span>{answeredCount} / {totalQ} Answered</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
              {test.questions?.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== undefined;
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={q.id || idx}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                      isCurrent
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow'
                        : isAnswered
                        ? 'bg-emerald-600/80 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Question Display Card */}
          {currentQ && (
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-slate-700/80 pb-3">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                  Question {currentQuestionIndex + 1}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {currentQ.marks || 1} Mark{(currentQ.marks || 1) > 1 ? 's' : ''}
                </span>
              </div>

              <h3 className="text-base md:text-lg font-semibold text-white leading-relaxed">
                {currentQ.question}
              </h3>

              {/* Options */}
              <div className="space-y-3 pt-2">
                {currentQ.options?.map((opt, optIdx) => {
                  const isSelected = userAnswers[currentQ.id] === optIdx;
                  const optionLetters = ['A', 'B', 'C', 'D', 'E'];
                  const letter = optionLetters[optIdx] || `${optIdx + 1}`;

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQ.id, optIdx)}
                      className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between text-sm ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium ring-1 ring-indigo-500'
                          : 'bg-slate-900/60 border-slate-700/80 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {letter}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {userAnswers[currentQ.id] !== undefined && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleClearAnswer(currentQ.id)}
                    className="text-xs text-slate-400 hover:text-slate-200 underline"
                  >
                    Clear Selection
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Exam Footer controls */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 flex items-center justify-between shrink-0 max-w-4xl mx-auto w-full">
          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold rounded-lg flex items-center gap-1 text-slate-200"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="text-xs text-slate-400 font-medium">
            {currentQuestionIndex + 1} / {totalQ}
          </span>

          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQ - 1, prev + 1))}
            disabled={currentQuestionIndex === totalQ - 1}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold rounded-lg flex items-center gap-1 text-white shadow"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Confirmation Modal overlay */}
        {stage === 'confirm_submit' && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl text-center">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
                <Send className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Submit Examination?</h3>
                <p className="text-xs text-slate-300">
                  You have answered <strong className="text-emerald-400">{answeredCount}</strong> out of <strong className="text-white">{totalQ}</strong> questions.
                </p>
                {answeredCount < totalQ && (
                  <p className="text-xs text-amber-400 font-medium bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    ⚠️ You still have {totalQ - answeredCount} unanswered questions!
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setStage('exam')}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl"
                >
                  Return to Exam
                </button>
                <button
                  onClick={handleFinalSubmission}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? 'Submitting...' : 'Yes, Submit Now'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Score & Detailed Result Analysis Screen
  if (stage === 'result' && submittedResult) {
    const questions = test.questions || [];

    return (
      <div className="fixed inset-0 z-50 bg-slate-900 text-slate-100 flex flex-col justify-between overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto w-full space-y-6 my-auto">
          {/* Result Card Banner */}
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 text-center">
            <div className="space-y-2">
              <span className="text-xs font-bold tracking-wider text-indigo-400 uppercase bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Test Completed
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">{test.title}</h2>
              <p className="text-xs text-slate-400">Result saved to online backend profile</p>
            </div>

            {/* Score Big Circle */}
            <div className="relative w-36 h-36 mx-auto flex flex-col items-center justify-center rounded-full bg-slate-900 border-4 border-indigo-500 shadow-inner">
              <span className="text-4xl font-extrabold text-white">{submittedResult.percentage}%</span>
              <span className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">
                {submittedResult.score} / {submittedResult.totalMarks} Marks
              </span>
            </div>

            {/* Stats Breakdown Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl">
                <p className="text-[11px] text-emerald-400 font-bold uppercase">Correct</p>
                <p className="text-lg font-extrabold text-white">{submittedResult.correct}</p>
              </div>

              <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl">
                <p className="text-[11px] text-red-400 font-bold uppercase">Wrong</p>
                <p className="text-lg font-extrabold text-white">{submittedResult.wrong}</p>
              </div>

              <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl">
                <p className="text-[11px] text-amber-400 font-bold uppercase">Unanswered</p>
                <p className="text-lg font-extrabold text-white">{submittedResult.unanswered}</p>
              </div>

              <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl">
                <p className="text-[11px] text-slate-400 font-bold uppercase">Time Taken</p>
                <p className="text-lg font-extrabold text-white">
                  {Math.floor(submittedResult.completionTimeSeconds / 60)}m {submittedResult.completionTimeSeconds % 60}s
                </p>
              </div>
            </div>
          </div>

          {/* Per Question Detailed Answer Key Review */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-400" /> Answer Key & Explanations
            </h3>

            <div className="space-y-4">
              {questions.map((q, qIdx) => {
                const userAnsIndex = submittedResult.userAnswers?.[q.id];
                const isCorrect = userAnsIndex === q.correctAnswer;
                const isUnanswered = userAnsIndex === undefined;

                return (
                  <div
                    key={q.id || qIdx}
                    className={`bg-slate-800 border rounded-2xl p-5 space-y-3 ${
                      isCorrect
                        ? 'border-emerald-500/40 bg-emerald-950/10'
                        : isUnanswered
                        ? 'border-amber-500/40 bg-amber-950/10'
                        : 'border-red-500/40 bg-red-950/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {qIdx + 1}
                        </span>
                        <span className="font-semibold text-sm text-white">{q.question}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        isCorrect
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isUnanswered
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {isCorrect ? 'Correct (+ Marks)' : isUnanswered ? 'Not Answered' : 'Incorrect'}
                      </span>
                    </div>

                    <div className="space-y-2 pt-1 text-xs">
                      {q.options?.map((opt, oIdx) => {
                        const isSelectedByStudent = userAnsIndex === oIdx;
                        const isTheCorrectOption = oIdx === q.correctAnswer;

                        let optClass = 'bg-slate-900/60 border-slate-700/60 text-slate-300';
                        if (isTheCorrectOption) {
                          optClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-semibold ring-1 ring-emerald-500';
                        } else if (isSelectedByStudent && !isCorrect) {
                          optClass = 'bg-red-950/80 border-red-500 text-red-200 font-semibold';
                        }

                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-xl border flex items-center justify-between ${optClass}`}
                          >
                            <span>
                              {['A','B','C','D','E'][oIdx] || oIdx + 1}. {opt}
                            </span>
                            <div className="flex items-center gap-1 font-bold">
                              {isTheCorrectOption && (
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                                  Correct Answer
                                </span>
                              )}
                              {isSelectedByStudent && !isTheCorrectOption && (
                                <span className="text-[10px] text-red-400 bg-red-500/20 px-2 py-0.5 rounded">
                                  Your Choice
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3 text-xs text-indigo-200 space-y-1">
                        <span className="font-bold text-indigo-300 block">💡 Explanation:</span>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex justify-center">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition text-sm"
            >
              Back to Exam Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
