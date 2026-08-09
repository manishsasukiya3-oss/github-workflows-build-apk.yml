import React from 'react';
import { 
  Home, 
  Users, 
  FileText, 
  Award, 
  BarChart3, 
  User, 
  ShieldCheck, 
  Smartphone, 
  ChevronDown,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MOJILO_MANISH_LOGO, APP_NAME } from '../assets/logo';
import { Group } from '../types';

interface NavigationProps {
  activeTab: 'home' | 'groups' | 'pdfs' | 'tests' | 'results' | 'profile' | 'admin';
  setActiveTab: (tab: 'home' | 'groups' | 'pdfs' | 'tests' | 'results' | 'profile' | 'admin') => void;
  userGroups?: Group[];
  onOpenApkGuide?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  userGroups = [],
  onOpenApkGuide,
}) => {
  const { userProfile, selectedGroupId, setSelectedGroupId } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const isAdmin = userProfile?.role === 'admin';

  const navItems = [
    { id: 'home', label: t('home', 'Home'), icon: Home },
    { id: 'groups', label: t('groups', 'Groups'), icon: Users },
    { id: 'pdfs', label: t('pdfs', 'PDFs'), icon: FileText },
    { id: 'tests', label: t('tests', 'Tests'), icon: Award },
    { id: 'results', label: t('results', 'Results'), icon: BarChart3 },
    { id: 'profile', label: t('profile', 'Profile'), icon: User },
  ];

  return (
    <>
      {/* Top Header App Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-white px-4 py-2.5 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Brand Name */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-indigo-500/30 shadow">
              <img src={MOJILO_MANISH_LOGO} alt={APP_NAME} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-extrabold text-base leading-none text-white">{APP_NAME}</h1>
              <span className="text-[10px] text-indigo-300 font-semibold tracking-wider">
                {t('appSubtitle', 'Exam & Study Portal')}
              </span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language Switcher Toggle Button */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'gu' : 'en')}
              title={t('selectLanguage', 'Select Language')}
              className="px-2.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === 'en' ? '🇬🇧 English' : '🇮🇳 ગુજરાતી'}</span>
            </button>

            {/* Active Group Selector Dropdown */}
            {userGroups.length > 0 && (
              <div className="relative">
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-indigo-300 text-xs font-semibold py-1.5 px-2.5 rounded-xl appearance-none pr-7 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">🌐 {t('allMyGroups', 'All My Groups')} ({userGroups.length})</option>
                  {userGroups.map((g) => (
                    <option key={g.groupId} value={g.groupId}>
                      👥 {g.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            )}

            {/* Admin Dashboard Pill */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">{t('adminPanel', 'Admin Panel')}</span>
              </button>
            )}

            {/* Android APK Build Guide Button */}
            {onOpenApkGuide && (
              <button
                onClick={onOpenApkGuide}
                title={t('apkGuideTitle', 'Android APK Packaging Guide')}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
              >
                <Smartphone className="w-4 h-4 text-indigo-400" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex flex-col items-center py-1 px-2 rounded-xl transition duration-150 ${
                  isActive
                    ? 'text-indigo-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-indigo-600/20' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
