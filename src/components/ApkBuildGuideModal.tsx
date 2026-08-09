import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Terminal, 
  PackageCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  Download, 
  Layers, 
  Folder 
} from 'lucide-react';
import { APP_PACKAGE_ID, APP_NAME } from '../assets/logo';

interface ApkBuildGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkBuildGuideModal: React.FC<ApkBuildGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const steps = [
    {
      title: '1. Export/Download Workspace',
      desc: 'Export this complete project source code to your computer or GitHub.',
      cmd: 'npm run build',
    },
    {
      title: '2. Initialize Capacitor Android Project',
      desc: 'Add the native Android platform folder configured for com.mojilomanish.app',
      cmd: 'npx cap add android && npx cap copy',
    },
    {
      title: '3. Open in Android Studio',
      desc: 'Launch Android Studio to build the native APK or Google Play AAB Bundle.',
      cmd: 'npx cap open android',
    },
    {
      title: '4. Build APK / AAB File in Android Studio',
      desc: 'In Android Studio menu: Select Build → Build Bundle(s) / APK(s) → Build APK(s) or Generate Signed Bundle/APK.',
      cmd: 'cd android && ./gradlew assembleDebug',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl my-auto text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Android APK / AAB Packaging Guide</h3>
              <p className="text-xs text-slate-400">{APP_NAME} ({APP_PACKAGE_ID})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration summary badge */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">App Name</span>
            <span className="font-bold text-white">{APP_NAME}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Package ID</span>
            <span className="font-mono text-indigo-300">{APP_PACKAGE_ID}</span>
          </div>
          <div className="col-span-2 md:col-span-1">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Framework</span>
            <span className="font-bold text-emerald-400">Capacitor Native Android</span>
          </div>
        </div>

        {/* Step-by-step instructions */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-indigo-400" /> Terminal Commands
          </h4>

          <div className="space-y-3">
            {steps.map((s, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-indigo-300">{s.title}</span>
                  <button
                    onClick={() => copyToClipboard(s.cmd)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded transition"
                  >
                    {copiedCmd === s.cmd ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Command
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400">{s.desc}</p>
                <div className="bg-slate-900 px-3 py-2 rounded-lg font-mono text-xs text-indigo-200 border border-slate-800">
                  $ {s.cmd}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generated output file location */}
        <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-2xl text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-indigo-200">
            <Folder className="w-4 h-4 text-indigo-400" /> Generated APK Output Location:
          </div>
          <p className="text-slate-300 font-mono text-[11px] bg-slate-900/80 p-2 rounded border border-indigo-500/20">
            android/app/build/outputs/apk/debug/app-debug.apk
          </p>
          <p className="text-[11px] text-slate-400">
            Install this <strong>.apk</strong> directly on any Android device or generate a signed <strong>.aab</strong> for Google Play Store submission!
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
