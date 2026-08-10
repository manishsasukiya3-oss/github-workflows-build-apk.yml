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
  Globe,
  Bookmark,
  Sparkles,
  Trophy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MOJILO_MANISH_LOGO, APP_NAME } from '../assets/logo';
import { Group } from '../types';

export type NavTab = 'home' | 'groups' | 'pdfs' | 'tests' | 'results' | 'bookmarks' | 'flashcards' | 'leaderboard' | 'profile' | 'admin';

interface NavigationProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  userGroups?: Group[];
  onOpenApkGuide?: () => void;
  bookmarkedCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  userGroups = [],
  onOpenApkGuide,
  bookmarkedCount = 0,
}) => {
  const { userProfile, selectedGroupId, setSelectedGroupId } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const isAdmin = userProfile?.role === 'admin';

  const navItems = [
    { id: 'home', label: t('home', 'Home'), icon: Home },
    { id: 'groups', label: t('groups', 'Groups'), icon: Users },
    { id: 'pdfs', label: t('pdfs', 'PDFs'), icon: FileText },
    { id: 'tests', label: t('tests', 'Tests'), icon: Award },
    { id: 'bookmarks', label: 'બુકમાર્ક્સ', icon: Bookmark, badge: bookmarkedCount },
    { id: 'flashcards', label: 'ફ્લેશકાર્ડ્સ', icon: Sparkles },
    { id: 'leaderboard', label: 'રેન્કિંગ', icon: Trophy },
    { id: 'profile', label: t('profile', 'Profile'), icon: User },
  ];

  return (
    <>
      {/* Top Header App Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-white px-3 py-2 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & Brand Name */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-indigo-500/30 shadow">
              <img src={MOJILO_MANISH_LOGO} alt={APP_NAME} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-extrabold text-xs sm:text-base leading-none text-white">{APP_NAME}</h1>
              <span className="text-[9px] sm:text-[10px] text-indigo-300 font-semibold tracking-wider block">
                {t('appSubtitle', 'Exam & Study Portal')}
              </span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Language Switcher Toggle Button */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'gu' : 'en')}
              title={t('selectLanguage', 'Select Language')}
              className="px-2 py-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 font-bold text-[11px] rounded-xl flex items-center gap-1 shadow transition"
            >
              <Globe className="w-3 h-3 text-indigo-400" />
              <span>{language === 'en' ? 'EN' : 'ગુજરાતી'}</span>
            </button>

            {/* Active Group Selector Dropdown */}
            {userGroups.length > 0 && (
              <div className="relative hidden md:block">
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-indigo-300 text-xs font-semibold py-1 px-2.5 rounded-xl appearance-none pr-6 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">🌐 {t('allMyGroups', 'All My Groups')} ({userGroups.length})</option>
                  {userGroups.map((g) => (
                    <option key={g.groupId} value={g.groupId}>
                      👥 {g.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
              </div>
            )}

            {/* Admin Dashboard Pill */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-lg'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('adminPanel', 'Admin Panel')}</span>
              </button>
            )}

            {/* Android APK Guide Button */}
            {onOpenApkGuide && (
              <button
                onClick={onOpenApkGuide}
                title={t('apkGuideTitle', 'Android APK Packaging Guide')}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Nav Bar Tabs for Desktop/Tablet */}
        <div className="max-w-6xl mx-auto hidden sm:flex items-center gap-1 mt-2 pt-1 border-t border-slate-800/60 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as NavTab)}
                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Bottom Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 px-1 py-1 shadow-2xl sm:hidden">
        <div className="flex items-center justify-around overflow-x-auto">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as NavTab)}
                className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${
                  isActive ? 'text-indigo-400 font-bold' : 'text-slate-400'
                }`}
              >
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 text-[8px] font-black px-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

