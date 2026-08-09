import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  ShieldAlert,
  FolderOpen,
  Lock
} from 'lucide-react';
import { PDFItem } from '../types';
import { useAuth } from '../context/AuthContext';

interface PDFViewerModalProps {
  pdf: PDFItem | null;
  onClose: () => void;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({ pdf, onClose }) => {
  const { userProfile } = useAuth();
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const isDataOrBlobUrl = pdf?.storageUrl?.startsWith('data:') || pdf?.storageUrl?.startsWith('blob:');
  const [useGoogleViewer, setUseGoogleViewer] = useState<boolean>(!isDataOrBlobUrl);
  const [showSecurityWarning, setShowSecurityWarning] = useState<boolean>(false);

  // Security screenshot & shortcut prevention
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block PrintScreen, Ctrl+P, Ctrl+S, Ctrl+U, F12
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'u')) ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        setShowSecurityWarning(true);
        setTimeout(() => setShowSecurityWarning(false), 3500);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setShowSecurityWarning(true);
      setTimeout(() => setShowSecurityWarning(false), 3500);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  if (!pdf) return null;

  // Format file size
  const formatSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const encodedPdfUrl = encodeURIComponent(pdf.storageUrl);
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodedPdfUrl}&embedded=true`;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col justify-between overflow-hidden animate-fadeIn select-none"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Security Toast Warning */}
      {showSecurityWarning && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-2xl border border-red-400 flex items-center gap-2 animate-bounce">
          <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
          <span>⚠️ વિડીયો/પીડીએફ ની સુરક્ષા માટે સ્ક્રીનશોટ અથવા સેવ કરવું મનાઈ છે!</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h3 className="font-semibold text-sm truncate text-white">{pdf.title}</h3>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate">
              <span className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300 border border-slate-700">
                {pdf.category || 'Study PDF'}
              </span>
              <span>•</span>
              <span className="bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Secure Reader
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 25, 200))}
            title="Zoom In"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 25, 50))}
            title="Zoom Out"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 rounded-lg transition ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main PDF Content Canvas with Protected Watermark Overlay */}
      <div className="flex-1 bg-slate-950 overflow-auto p-2 flex flex-col items-center justify-center relative pointer-events-auto">
        
        {/* Floating Security Watermark Overlay */}
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center overflow-hidden opacity-20 select-none">
          <div className="rotate-[-25deg] text-slate-200 text-center font-black space-y-4">
            <p className="text-3xl tracking-widest uppercase">MOJILO MANISH PROTECTED CONTENT</p>
            <p className="text-xl text-amber-300">{userProfile?.name || 'Authorized Student'} ({userProfile?.email || 'Registered User'})</p>
            <p className="text-sm text-red-400 font-mono">DO NOT COPY • DO NOT SHARE • SCREENSHOT RESTRICTED</p>
          </div>
        </div>

        <div 
          style={{ width: `${zoomLevel}%`, maxWidth: '100%', height: '100%' }} 
          className="transition-all duration-200 flex flex-col h-full w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-800 relative z-10"
        >
          {useGoogleViewer ? (
            <iframe
              src={googleViewerUrl}
              className="w-full h-full border-0"
              title={pdf.title}
              onError={() => setUseGoogleViewer(false)}
            />
          ) : (
            <object
              data={pdf.storageUrl}
              type="application/pdf"
              className="w-full h-full border-0"
            >
              <div className="p-8 text-center text-slate-700 space-y-4 my-auto">
                <FileText className="w-16 h-16 mx-auto text-indigo-500 opacity-60" />
                <p className="font-medium text-sm">Unable to render PDF directly in frame.</p>
                <button
                  onClick={() => setUseGoogleViewer(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium text-xs rounded-lg hover:bg-indigo-700 shadow"
                >
                  Switch to Google Online Reader
                </button>
              </div>
            </object>
          )}
        </div>
      </div>

      {/* Footer info bar */}
      <div className="bg-slate-900 border-t border-slate-800 text-slate-400 px-4 py-2 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2 truncate">
          <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
          <span className="truncate">{pdf.description || 'સુરક્ષિત સ્ટડી મટીરીયલ (Protected Material)'}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[11px]">
          <button 
            onClick={() => setUseGoogleViewer(!useGoogleViewer)}
            className="text-indigo-400 hover:underline"
          >
            {useGoogleViewer ? 'Direct Embed Mode' : 'Google Viewer Mode'}
          </button>
          <span>Zoom: {zoomLevel}%</span>
        </div>
      </div>
    </div>
  );
};
