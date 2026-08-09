import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MOJILO_MANISH_LOGO, APP_NAME } from '../assets/logo';
import { Group } from '../types';

interface LoginModalProps {
  availableGroups?: Group[];
}

export const LoginModal: React.FC<LoginModalProps> = ({ availableGroups = [] }) => {
  const { login, signup, resetPassword, bootstrapFirstAdmin, error, clearError } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // 'login' | 'signup' | 'forgot' | 'first_admin'
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot' | 'first_admin'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (tab === 'login') {
        await login(email, password);
      } else if (tab === 'signup') {
        if (!name.trim()) throw new Error('Please enter your full name.');
        await signup(email, password, name, selectedGroupIds);
      } else if (tab === 'forgot') {
        await resetPassword(email);
        setSuccessMsg('Password reset link sent to your email address!');
      } else if (tab === 'first_admin') {
        // First Admin registration or setup
        if (!email || !password) throw new Error('Please fill in email and password.');
        await signup(email, password, name || 'Primary Admin', []);
        const res = await bootstrapFirstAdmin();
        if (res.success) {
          setSuccessMsg(res.message);
        }
      }
    } catch (err: any) {
      console.error('Auth submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds((prev) => 
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl text-slate-100 my-auto relative">
        {/* Language switch button */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'gu' : 'en')}
          className="absolute top-5 right-5 px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span>{language === 'en' ? '🇬🇧 English' : '🇮🇳 ગુજરાતી'}</span>
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden shadow-xl border-2 border-indigo-500/30 ring-4 ring-indigo-500/10">
            <img src={MOJILO_MANISH_LOGO} alt={APP_NAME} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{APP_NAME}</h2>
            <p className="text-xs text-indigo-300 font-medium">{t('appSubtitle', 'Online Study & Examination Portal')}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setTab('login'); clearError(); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-xl transition ${
              tab === 'login' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('login', 'Sign In')}
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); clearError(); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-xl transition ${
              tab === 'signup' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('register', 'Register')}
          </button>
          <button
            type="button"
            onClick={() => { setTab('first_admin'); clearError(); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-xl transition ${
              tab === 'first_admin' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            First Admin
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-950/60 border border-red-500/40 text-red-200 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 p-3 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Quick Demo Login Preset Buttons */}
        {tab === 'login' && (
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block text-center">
              ⚡ ત્વરિત ડેમો લોગિન (Quick 1-Click Demo Login):
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@mojilomanish.com');
                  setPassword('admin123');
                  login('admin@mojilomanish.com', 'admin123');
                }}
                className="py-2 px-3 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>👑 Admin Login</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('student@mojilomanish.com');
                  setPassword('student123');
                  login('student@mojilomanish.com', 'student123');
                }}
                className="py-2 px-3 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition"
              >
                <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>🎓 Student Login</span>
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {tab === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">{t('fullName', 'Full Name')}</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Manish Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">{t('emailAddress', 'Email Address')}</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                required
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {tab !== 'forgot' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-slate-300 font-semibold block">{t('password', 'Password')}</label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Group selection for Sign Up */}
          {tab === 'signup' && availableGroups.length > 0 && (
            <div className="space-y-2 pt-1">
              <label className="text-slate-300 font-semibold block">{t('selectGroup', 'Select Study Group(s)')}:</label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {availableGroups.map((grp) => {
                  const isChecked = selectedGroupIds.includes(grp.groupId);
                  return (
                    <button
                      key={grp.groupId}
                      type="button"
                      onClick={() => toggleGroupSelection(grp.groupId)}
                      className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition ${
                        isChecked
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{grp.name}</span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'first_admin' && (
            <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl text-[11px] text-amber-200 space-y-1">
              <span className="font-bold block flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> First Administrator Bootstrap
              </span>
              <p>
                Create the primary Administrator account for Mojilo Manish. The first account created via this tab will be granted full Admin role in Firestore!
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition flex items-center justify-center gap-2 ${
              tab === 'first_admin' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {isSubmitting ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>
                  {tab === 'login' && t('login', 'Sign In')}
                  {tab === 'signup' && t('register', 'Register')}
                  {tab === 'forgot' && 'Send Reset Email'}
                  {tab === 'first_admin' && 'Create First Admin Account'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {tab === 'forgot' && (
          <div className="text-center">
            <button
              onClick={() => setTab('login')}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
