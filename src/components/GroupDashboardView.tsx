import React, { useState } from 'react';
import { 
  Users, 
  FileText, 
  Award, 
  BarChart3, 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Lock,
  ChevronRight,
  Radio,
  Mic,
  PhoneCall
} from 'lucide-react';
import { Group, PDFItem, Test, TestResult } from '../types';
import { GroupVoiceCallModal } from './GroupVoiceCallModal';

interface GroupDashboardViewProps {
  group: Group;
  pdfs: PDFItem[];
  tests: Test[];
  results: TestResult[];
  onBack: () => void;
  onOpenPdf: (pdf: PDFItem) => void;
  onStartTest: (test: Test) => void;
}

export const GroupDashboardView: React.FC<GroupDashboardViewProps> = ({
  group,
  pdfs,
  tests,
  results,
  onBack,
  onOpenPdf,
  onStartTest,
}) => {
  const [showVoiceCall, setShowVoiceCall] = useState<boolean>(false);

  // Filter content assigned to this group or all
  const groupPdfs = pdfs.filter(
    (p) => p.groupIds?.includes(group.groupId) || p.groupIds?.includes('all')
  );

  const groupTests = tests.filter(
    (t) => t.groupIds?.includes(group.groupId) || t.groupIds?.includes('all')
  );

  const groupResults = results.filter(
    (r) => r.groupIds?.includes(group.groupId)
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      {/* Top Banner */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider">Group Dashboard</span>
          <h2 className="text-2xl font-bold text-white">{group.name}</h2>
        </div>
      </div>

      {/* Group Info & Voice Call Launch Banner */}
      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">{group.name}</h3>
              <p className="text-xs text-slate-300">{group.description || 'Dedicated study & exam group'}</p>
            </div>
          </div>

          {/* Group Voice Call Trigger Button */}
          <button
            onClick={() => setShowVoiceCall(true)}
            className="py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-xl border border-emerald-400/30 flex items-center justify-center gap-2 transition shrink-0 animate-pulse"
          >
            <Radio className="w-4 h-4 text-emerald-200" />
            <Mic className="w-4 h-4 text-amber-300" />
            <span>🎙️ લાઈવ ગ્રુપ વોઇસ કોલ (Join Voice Call)</span>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
          <span>👥 Members: <strong className="text-white">{group.memberIds?.length || 0}</strong></span>
          <span>📚 PDFs: <strong className="text-indigo-300">{groupPdfs.length}</strong></span>
          <span>📝 Tests: <strong className="text-amber-300">{groupTests.length}</strong></span>
        </div>
      </div>

      {/* PDFs Section */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" /> Study PDFs ({groupPdfs.length})
        </h3>

        {groupPdfs.length === 0 ? (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 text-center text-xs text-slate-400">
            No study PDFs assigned to this group yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {groupPdfs.map((pdf) => (
              <div
                key={pdf.pdfId}
                className="bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 rounded-2xl p-4 flex items-center justify-between gap-3 transition shadow"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <h4 className="font-bold text-sm text-white truncate">{pdf.title}</h4>
                    <p className="text-xs text-slate-400 truncate">{pdf.description || 'Study Material'}</p>
                  </div>
                </div>

                <button
                  onClick={() => onOpenPdf(pdf)}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow shrink-0 flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Read
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tests Section */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" /> Online Examination Tests ({groupTests.length})
        </h3>

        {groupTests.length === 0 ? (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 text-center text-xs text-slate-400">
            No online tests assigned to this group yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {groupTests.map((test) => {
              const myResult = groupResults.find((r) => r.testId === test.testId);

              return (
                <div
                  key={test.testId}
                  className="bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 rounded-2xl p-4 space-y-3 transition shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {test.category || 'Examination'}
                      </span>
                      <h4 className="font-bold text-sm text-white mt-1">{test.title}</h4>
                    </div>
                    {myResult && (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> {myResult.percentage}%
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">{test.description}</p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/60">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" /> {test.duration} mins
                      </span>
                      <span>•</span>
                      <span>{test.questions?.length || 0} Questions</span>
                    </div>

                    <button
                      onClick={() => onStartTest(test)}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow flex items-center gap-1"
                    >
                      {myResult ? 'Retake Test' : 'Start Exam'} <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" /> Group Exam Performance
        </h3>

        {groupResults.length === 0 ? (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 text-center text-xs text-slate-400">
            No completed exam records for this group yet.
          </div>
        ) : (
          <div className="space-y-2">
            {groupResults.map((r) => (
              <div
                key={r.resultId}
                className="bg-slate-800 border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between text-xs"
              >
                <div>
                  <h5 className="font-bold text-white">{r.testTitle}</h5>
                  <p className="text-slate-400 text-[11px]">{r.userName} • {new Date(r.submittedAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-sm text-emerald-400 block">{r.percentage}%</span>
                  <span className="text-[10px] text-slate-400">{r.score} / {r.totalMarks} Marks</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Render Voice Call Room Modal */}
      {showVoiceCall && (
        <GroupVoiceCallModal
          group={group}
          onClose={() => setShowVoiceCall(false)}
        />
      )}
    </div>
  );
};
