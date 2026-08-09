import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MOJILO_MANISH_LOGO, APP_NAME, APP_PACKAGE_ID } from '../assets/logo';
import { BookOpen, Award, ShieldCheck } from 'lucide-react';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onFinish) onFinish();
    }, 2400);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-between py-12 px-6 text-white text-center"
        >
          <div className="w-full flex justify-end">
            <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-1 rounded font-mono border border-slate-700/50">
              v1.0.0 • Android
            </span>
          </div>

          <div className="flex flex-col items-center space-y-4 max-w-sm">
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative"
            >
              <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl border-2 border-indigo-500/30 ring-4 ring-indigo-500/10">
                <img 
                  src={MOJILO_MANISH_LOGO} 
                  alt={APP_NAME} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-indigo-600 p-1.5 rounded-full ring-4 ring-slate-900 shadow-lg">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-1"
            >
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                {APP_NAME}
              </h1>
              <p className="text-xs text-indigo-300 font-medium tracking-wide">
                Online Education & Exam Portal
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-4 pt-2 text-slate-400 text-xs"
            >
              <div className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>PDF Library</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>MCQ Exams</span>
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-1 bg-indigo-500/30 rounded-full overflow-hidden">
              <div className="w-full h-full bg-indigo-500 animate-pulse"></div>
            </div>
            <span className="text-[11px] text-slate-500 font-mono tracking-wider">
              {APP_PACKAGE_ID}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
