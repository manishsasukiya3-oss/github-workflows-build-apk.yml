import React from 'react';
import { Bookmark, FileText, Award, Eye, Play, Trash2, BookOpen } from 'lucide-react';
import { PDFItem, Test } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface BookmarksViewProps {
  bookmarkedPdfs: PDFItem[];
  bookmarkedTests: Test[];
  onRemovePdfBookmark: (pdfId: string) => void;
  onRemoveTestBookmark: (testId: string) => void;
  onViewPdf: (pdf: PDFItem) => void;
  onStartTest: (test: Test) => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  bookmarkedPdfs,
  bookmarkedTests,
  onRemovePdfBookmark,
  onRemoveTestBookmark,
  onViewPdf,
  onStartTest,
}) => {
  const { t } = useLanguage();

  const totalSaved = bookmarkedPdfs.length + bookmarkedTests.length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-200 font-semibold text-xs tracking-wider uppercase mb-1">
            <Bookmark className="w-4 h-4" />
            <span>{t('savedMaterial', 'બુકમાર્ક અને સેવ કરેલું મટીરીયલ')}</span>
          </div>
          <h2 className="text-2xl font-black">
            {t('myBookmarksTitle', 'મારા સેવ કરેલા પીડીએફ અને ટેસ્ટ')}
          </h2>
          <p className="text-amber-100 text-sm mt-1">
            {t('bookmarksSubtitle', 'તમે સેવ કરેલી તમામ અભ્યાસ સામગ્રી અહીં ઓફલાઇન એક્સેસ માટે ઉપલબ્ધ છે.')}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-center shrink-0">
          <span className="text-2xl font-black block">{totalSaved}</span>
          <span className="text-xs font-semibold text-amber-100">{t('totalSavedItems', 'કુલ સેવ કરેલી આઇટમ')}</span>
        </div>
      </div>

      {totalSaved === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 max-w-md mx-auto my-8">
          <Bookmark className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50 stroke-1" />
          <h3 className="text-lg font-bold text-white mb-2">
            {t('noBookmarksYet', 'કોઈ બુકમાર્ક સાચવેલ નથી')}
          </h3>
          <p className="text-xs text-slate-400">
            {t('noBookmarksNotice', 'કોઈપણ પીડીએફ અથવા ટેસ્ટ પર બુકમાર્ક આયકન પર ક્લિક કરીને તેને ઝડપી એક્સેસ માટે સાચવો.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Saved PDFs */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-lg">
                {t('savedPdfs', 'સેવ કરેલ પીડીએફ મટીરીયલ')} ({bookmarkedPdfs.length})
              </h3>
            </div>

            {bookmarkedPdfs.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">કોઈ પીડીએફ સાચવેલ નથી.</p>
            ) : (
              <div className="space-y-3">
                {bookmarkedPdfs.map((pdf) => (
                  <div
                    key={pdf.pdfId}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3 hover:border-amber-500/50 transition group"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="inline-block bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-md mb-1">
                        {pdf.category || 'PDF'}
                      </span>
                      <h4 className="font-bold text-slate-100 text-sm truncate">{pdf.title}</h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{pdf.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onViewPdf(pdf)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t('viewPdf', 'જુઓ')}</span>
                      </button>
                      <button
                        onClick={() => onRemovePdfBookmark(pdf.pdfId)}
                        title="દૂર કરો"
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saved Tests */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-lg">
                {t('savedTests', 'સેવ કરેલી મોક ટેસ્ટ')} ({bookmarkedTests.length})
              </h3>
            </div>

            {bookmarkedTests.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">કોઈ ટેસ્ટ સાચવેલ નથી.</p>
            ) : (
              <div className="space-y-3">
                {bookmarkedTests.map((test) => (
                  <div
                    key={test.testId}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3 hover:border-indigo-500/50 transition group"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="inline-block bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-md mb-1">
                        {test.category || 'Test'}
                      </span>
                      <h4 className="font-bold text-slate-100 text-sm truncate">{test.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>⏱️ {test.duration} મિનિટ</span>
                        <span>🎯 {test.totalMarks} ગુણ</span>
                        <span>❓ {test.questions?.length || 0} પ્રશ્નો</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onStartTest(test)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{t('startTest', 'શરૂ')}</span>
                      </button>
                      <button
                        onClick={() => onRemoveTestBookmark(test.testId)}
                        title="દૂર કરો"
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
