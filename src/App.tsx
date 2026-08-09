import React, { useState, useEffect } from 'react';
import { 
  AuthProvider, 
  useAuth 
} from './context/AuthContext';
import { 
  LanguageProvider, 
  useLanguage 
} from './context/LanguageContext';
import { 
  db, 
  collection, 
  onSnapshot, 
  query, 
  where 
} from './lib/firebase';
import { UserProfile, Group, PDFItem, Test, TestResult } from './types';
import { Navigation } from './components/Navigation';
import { NetworkStatus } from './components/NetworkStatus';
import { SplashScreen } from './components/SplashScreen';
import { LoginModal } from './components/LoginModal';
import { PDFViewerModal } from './components/PDFViewerModal';
import { TestExamView } from './components/TestExamView';
import { AdminPanel } from './components/AdminPanel';
import { GroupDashboardView } from './components/GroupDashboardView';
import { ApkBuildGuideModal } from './components/ApkBuildGuideModal';
import { MOJILO_MANISH_LOGO, APP_NAME, APP_PACKAGE_ID } from './assets/logo';

import { 
  Home as HomeIcon, 
  Users, 
  FileText, 
  Award, 
  BarChart3, 
  User, 
  ShieldCheck, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Search, 
  Smartphone, 
  LogOut, 
  Globe
} from 'lucide-react';

function AppContent() {
  const { user, userProfile, loading, logout, selectedGroupId } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Navigation tab: 'home' | 'groups' | 'pdfs' | 'tests' | 'results' | 'profile' | 'admin'
  const [activeTab, setActiveTab] = useState<'home' | 'groups' | 'pdfs' | 'tests' | 'results' | 'profile' | 'admin'>('home');

  // Real Firestore Collections
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [pdfs, setPdfs] = useState<PDFItem[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);

  // Selected Active Modals/Views
  const [activePdf, setActivePdf] = useState<PDFItem | null>(null);
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [showApkGuide, setShowApkGuide] = useState<boolean>(false);
  const [selectedResultReview, setSelectedResultReview] = useState<TestResult | null>(null);

  // Search queries
  const [pdfSearch, setPdfSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');

  // 1. Subscribe to Firestore Collections when user is authenticated
  useEffect(() => {
    if (loading || !user) {
      setGroups([]);
      setUsers([]);
      setPdfs([]);
      setTests([]);
      setResults([]);
      return;
    }

    const unsubGroups = onSnapshot(
      collection(db, 'groups'),
      (snap) => {
        const list: Group[] = [];
        snap.forEach((doc) => list.push(doc.data() as Group));
        setGroups(list);
      },
      (err) => {
        console.warn('Firestore groups error:', err);
      }
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list: UserProfile[] = [];
        snap.forEach((doc) => list.push(doc.data() as UserProfile));
        setUsers(list);
      },
      (err) => {
        console.warn('Firestore users error:', err);
      }
    );

    const unsubPdfs = onSnapshot(
      collection(db, 'pdfs'),
      (snap) => {
        const list: PDFItem[] = [];
        snap.forEach((doc) => list.push(doc.data() as PDFItem));
        setPdfs(list);
      },
      (err) => {
        console.warn('Firestore pdfs error:', err);
      }
    );

    const unsubTests = onSnapshot(
      collection(db, 'tests'),
      (snap) => {
        const list: Test[] = [];
        snap.forEach((doc) => list.push(doc.data() as Test));
        setTests(list);
      },
      (err) => {
        console.warn('Firestore tests error:', err);
      }
    );

    // Results query: Admins see all test results, students see only their own results
    const resultsQuery = userProfile?.role === 'admin'
      ? collection(db, 'results')
      : query(collection(db, 'results'), where('userId', '==', user.uid));

    const unsubResults = onSnapshot(
      resultsQuery,
      (snap) => {
        const list: TestResult[] = [];
        snap.forEach((doc) => list.push(doc.data() as TestResult));
        setResults(list);
      },
      (err) => {
        console.warn('Firestore results error:', err);
      }
    );

    return () => {
      unsubGroups();
      unsubUsers();
      unsubPdfs();
      unsubTests();
      unsubResults();
    };
  }, [user, loading, userProfile?.role]);

  // Default local fallbacks if Firestore returns empty or is disconnected
  const DEFAULT_GROUPS: Group[] = [
    {
      groupId: 'grp_general',
      name: 'General Gujarati Batch (સામાન્ય વર્ગ)',
      description: 'ગુજરાતી સ્પર્ધાત્મક પરીક્ષાઓ માટેનું સામાન્ય સ્ટડી ગ્રુપ',
      createdAt: new Date().toISOString(),
      memberIds: [],
    },
    {
      groupId: 'grp_gpsc',
      name: 'GPSC Class 1-2 Special Batch',
      description: 'જીપીએસસી ક્લાસ ૧ અને ૨ ની તૈયારી કરતા વિદ્યાર્થીઓ માટે',
      createdAt: new Date().toISOString(),
      memberIds: [],
    },
    {
      groupId: 'grp_clerk',
      name: 'Talati & CCE Exam Group',
      description: 'તલાટી મંત્રી અને સીસીઈ પરીક્ષા તૈયારી ગ્રુપ',
      createdAt: new Date().toISOString(),
      memberIds: [],
    },
  ];

  const DEFAULT_PDFS: PDFItem[] = [
    {
      pdfId: 'pdf_1',
      title: 'GPSC & CCE General Knowledge Guide 2026',
      description: 'ગુજરાતનો ઇતિહાસ, સંસ્કૃતિ અને વર્તમાન પ્રવાહો સંપૂર્ણ માહિતી પીડીએફ',
      category: 'General Knowledge',
      storagePath: 'local',
      storageUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileName: 'gujarat_gk_guide_2026.pdf',
      fileSize: 1024 * 1024 * 2.5,
      groupIds: ['all'],
      uploadedAt: new Date().toISOString(),
    },
    {
      pdfId: 'pdf_2',
      title: 'Gujarati Vyakaran & Sahitya Notes',
      description: 'ગુજરાતી વ્યાકરણના નિયમો, અલંકાર, છંદ અને સાહિત્યકાર પરિચય',
      category: 'Grammar',
      storagePath: 'local',
      storageUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileName: 'gujarati_vyakaran_notes.pdf',
      fileSize: 1024 * 1024 * 1.8,
      groupIds: ['all'],
      uploadedAt: new Date().toISOString(),
    },
  ];

  const DEFAULT_TESTS: Test[] = [
    {
      testId: 'test_1',
      title: 'Gujarati Vyakaran Speed Test - 01',
      description: 'વ્યાકરણ અને શબ્દ ભંડોળ ની ૧૫ મિનિટ ની ઓનલાઈન ટેસ્ટ',
      category: 'Grammar',
      duration: 15,
      totalMarks: 5,
      groupIds: ['all'],
      createdAt: new Date().toISOString(),
      questions: [
        {
          id: 'q1',
          question: 'નીચેનામાંથી કયો શબ્દ "સૂર્ય" નો પર્યાયવાચી નથી?',
          options: ['ભાસ્કર', 'દિનકર', 'નિશાકર', 'આદિત્ય'],
          correctAnswer: 2,
          explanation: 'નિશાકર એટલે ચંદ્ર થાય છે, સૂર્ય નહીં.',
          marks: 1,
        },
        {
          id: 'q2',
          question: 'ગુજરાતી ભાષાની પ્રથમ નવલકથા કઈ છે?',
          options: ['સરસ્વતીચંદ્ર', 'કરણઘેલો', 'માનવીની ભવાઈ', 'સત્યના પ્રયોગો'],
          correctAnswer: 1,
          explanation: 'નંદશંકર તુલજાશંકર મહેતા લિખિત "કરણઘેલો" (૧૮૬૬) પ્રથમ નવલકથા છે.',
          marks: 1,
        },
        {
          id: 'q3',
          question: '"છોકરો દોડે છે" - વાક્યમાં કૃદંત ઓળખાવો:',
          options: ['વર્તમાન કૃદંત', 'ભૂત કૃદંત', 'ભવિષ્ય કૃદંત', 'હેત્વર્થ કૃદંત'],
          correctAnswer: 0,
          explanation: '"દોડે" - વર્તમાન કાળ દર્શાવે છે.',
          marks: 1,
        },
      ],
    },
  ];

  const activeGroups = groups.length > 0 ? groups : DEFAULT_GROUPS;
  const activePdfs = pdfs.length > 0 ? pdfs : DEFAULT_PDFS;
  const activeTests = tests.length > 0 ? tests : DEFAULT_TESTS;

  // Filter content assigned to user's groups
  const userAssignedGroupIds = userProfile?.groupIds || [];
  const isAdmin = userProfile?.role === 'admin';

  // Get user's assigned group objects
  const myGroupObjects = activeGroups.filter(
    (g) => userAssignedGroupIds.includes(g.groupId) || isAdmin
  );

  // Filter PDFs
  const accessiblePdfs = activePdfs.filter((pdf) => {
    if (isAdmin) return true;
    const targets = pdf.groupIds || [];
    if (targets.includes('all')) return true;
    return targets.some((gid) => userAssignedGroupIds.includes(gid));
  }).filter((pdf) => {
    if (selectedGroupId !== 'all' && !pdf.groupIds?.includes(selectedGroupId) && !pdf.groupIds?.includes('all')) {
      return false;
    }
    return pdf.title?.toLowerCase().includes(pdfSearch.toLowerCase()) || 
           pdf.description?.toLowerCase().includes(pdfSearch.toLowerCase());
  });

  // Filter Tests
  const accessibleTests = activeTests.filter((test) => {
    if (isAdmin) return true;
    const targets = test.groupIds || [];
    if (targets.includes('all')) return true;
    return targets.some((gid) => userAssignedGroupIds.includes(gid));
  }).filter((test) => {
    if (selectedGroupId !== 'all' && !test.groupIds?.includes(selectedGroupId) && !test.groupIds?.includes('all')) {
      return false;
    }
    return test.title?.toLowerCase().includes(testSearch.toLowerCase()) || 
           test.description?.toLowerCase().includes(testSearch.toLowerCase());
  });

  // Filter My Personal Results
  const myResults = results.filter((r) => r.userId === userProfile?.userId);

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <NetworkStatus />
        <LoginModal availableGroups={groups} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16">
      <NetworkStatus />
      
      <Navigation
        activeTab={activeTab}
        setActiveTab={(t) => {
          setActiveGroup(null);
          setActiveTab(t);
        }}
        userGroups={myGroupObjects}
        onOpenApkGuide={() => setShowApkGuide(true)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
        {/* If Active Group details is open */}
        {activeGroup ? (
          <GroupDashboardView
            group={activeGroup}
            pdfs={pdfs}
            tests={tests}
            results={results}
            onBack={() => setActiveGroup(null)}
            onOpenPdf={(pdf) => setActivePdf(pdf)}
            onStartTest={(test) => setActiveTest(test)}
          />
        ) : (
          <>
            {/* 1. HOME TAB */}
            {activeTab === 'home' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Welcome Hero Header */}
                <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 md:p-8 shadow-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-indigo-500/30">
                          {isAdmin ? '🛡️ Administrator' : '🎓 Student Portal'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {APP_PACKAGE_ID}
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                        Welcome back, {userProfile?.name || 'Student'}!
                      </h2>
                      <p className="text-xs md:text-sm text-slate-300">
                        Access your online study PDFs, take MCQ tests, and track your group performance.
                      </p>
                    </div>

                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-500/30 shadow-lg shrink-0">
                      <img src={MOJILO_MANISH_LOGO} alt={APP_NAME} className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* My Assigned Groups Chips */}
                  <div className="pt-3 border-t border-indigo-500/20 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 font-semibold">My Groups:</span>
                    {myGroupObjects.length === 0 ? (
                      <span className="text-slate-500 italic">No groups assigned yet. Contact Admin.</span>
                    ) : (
                      myGroupObjects.map((g) => (
                        <button
                          key={g.groupId}
                          onClick={() => setActiveGroup(g)}
                          className="bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/30 px-3 py-1 rounded-xl font-bold flex items-center gap-1 transition"
                        >
                          <Users className="w-3.5 h-3.5 text-indigo-400" /> {g.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Action Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setActiveTab('pdfs')}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 p-4 rounded-2xl text-left space-y-2 transition shadow-lg group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Study PDFs</h4>
                      <p className="text-[11px] text-slate-400">{accessiblePdfs.length} Files Available</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('tests')}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 p-4 rounded-2xl text-left space-y-2 transition shadow-lg group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">MCQ Exams</h4>
                      <p className="text-[11px] text-slate-400">{accessibleTests.length} Tests Ready</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('results')}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 p-4 rounded-2xl text-left space-y-2 transition shadow-lg group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">My Results</h4>
                      <p className="text-[11px] text-slate-400">{myResults.length} Completed Exams</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setShowApkGuide(true)}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 p-4 rounded-2xl text-left space-y-2 transition shadow-lg group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">APK Packaging</h4>
                      <p className="text-[11px] text-indigo-300">Build Android App</p>
                    </div>
                  </button>
                </div>

                {/* Upcoming Tests Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" /> Assigned MCQ Exams
                    </h3>
                    <button onClick={() => setActiveTab('tests')} className="text-xs text-indigo-400 hover:underline">
                      View All ({accessibleTests.length})
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {accessibleTests.slice(0, 4).map((test) => (
                      <div
                        key={test.testId}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md"
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {test.category || 'Exam'}
                          </span>
                          <h4 className="font-bold text-sm text-white mt-1 truncate">{test.title}</h4>
                          <p className="text-xs text-slate-400">{test.duration} mins • {test.questions?.length || 0} Questions</p>
                        </div>

                        <button
                          onClick={() => setActiveTest(test)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow shrink-0 flex items-center gap-1"
                        >
                          Start <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. GROUPS TAB */}
            {activeTab === 'groups' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-2xl font-extrabold text-white">My Study Groups</h2>
                  <p className="text-xs text-slate-400">Select a group to access its assigned PDFs and online tests.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myGroupObjects.length === 0 ? (
                    <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs">
                      You are not assigned to any group yet. Ask your Administrator to add you to a study group!
                    </div>
                  ) : (
                    myGroupObjects.map((group) => {
                      const groupPdfsCount = pdfs.filter((p) => p.groupIds?.includes(group.groupId) || p.groupIds?.includes('all')).length;
                      const groupTestsCount = tests.filter((t) => t.groupIds?.includes(group.groupId) || t.groupIds?.includes('all')).length;

                      return (
                        <div
                          key={group.groupId}
                          onClick={() => setActiveGroup(group)}
                          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 space-y-4 cursor-pointer transition shadow-xl group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:scale-105 transition">
                              <Users className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition">{group.name}</h3>
                              <p className="text-xs text-slate-400">{group.description || 'Study & examination group'}</p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                            <span>📚 {groupPdfsCount} PDFs</span>
                            <span>📝 {groupTestsCount} Tests</span>
                            <span className="bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-500/20 font-bold flex items-center gap-1">
                              🎙️ Voice Call Live
                            </span>
                            <span className="text-indigo-400 font-bold flex items-center gap-1">
                              Open Portal <ChevronRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 3. PDFS TAB */}
            {activeTab === 'pdfs' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-extrabold text-white">Study PDF Library</h2>
                    <p className="text-xs text-slate-400">{accessiblePdfs.length} PDFs available for your group(s)</p>
                  </div>

                  <div className="relative max-w-xs w-full">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search PDFs..."
                      value={pdfSearch}
                      onChange={(e) => setPdfSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {accessiblePdfs.length === 0 ? (
                    <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs">
                      No PDFs found for your assigned groups.
                    </div>
                  ) : (
                    accessiblePdfs.map((pdf) => (
                      <div
                        key={pdf.pdfId}
                        className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xl transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <h4 className="font-bold text-sm text-white truncate">{pdf.title}</h4>
                            <p className="text-xs text-slate-400 truncate">{pdf.description || 'Study document'}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => setActivePdf(pdf)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow shrink-0 flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Read
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 4. TESTS TAB */}
            {activeTab === 'tests' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-extrabold text-white">Online MCQ Examinations</h2>
                    <p className="text-xs text-slate-400">{accessibleTests.length} Tests assigned to your group(s)</p>
                  </div>

                  <div className="relative max-w-xs w-full">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search tests..."
                      value={testSearch}
                      onChange={(e) => setTestSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {accessibleTests.length === 0 ? (
                    <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs">
                      No online tests assigned to your group.
                    </div>
                  ) : (
                    accessibleTests.map((test) => {
                      const myPrevResult = myResults.find((r) => r.testId === test.testId);

                      return (
                        <div
                          key={test.testId}
                          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                {test.category || 'Exam'}
                              </span>
                              <h3 className="font-bold text-base text-white mt-1">{test.title}</h3>
                              <p className="text-xs text-slate-300 line-clamp-2">{test.description}</p>
                            </div>
                            {myPrevResult && (
                              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
                                {myPrevResult.percentage}%
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-indigo-400" /> {test.duration} mins
                              </span>
                              <span>•</span>
                              <span>{test.questions?.length || 0} Questions</span>
                            </div>

                            <button
                              onClick={() => setActiveTest(test)}
                              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow flex items-center gap-1"
                            >
                              {myPrevResult ? 'Retake Exam' : 'Start Exam'} <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 5. RESULTS TAB */}
            {activeTab === 'results' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-2xl font-extrabold text-white">My Exam Results</h2>
                  <p className="text-xs text-slate-400">Track all completed examination scores online.</p>
                </div>

                <div className="space-y-3">
                  {myResults.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs">
                      You haven't completed any online examinations yet.
                    </div>
                  ) : (
                    myResults.map((r) => (
                      <div
                        key={r.resultId}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] text-indigo-400 font-mono">
                            Submitted on {new Date(r.submittedAt).toLocaleDateString()}
                          </span>
                          <h4 className="font-bold text-base text-white">{r.testTitle}</h4>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span>Correct: <strong className="text-emerald-400">{r.correct}</strong></span>
                            <span>•</span>
                            <span>Wrong: <strong className="text-red-400">{r.wrong}</strong></span>
                            <span>•</span>
                            <span>Unanswered: <strong className="text-amber-400">{r.unanswered}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                          <div className="text-right">
                            <span className="text-2xl font-black text-emerald-400 block">{r.percentage}%</span>
                            <span className="text-[10px] text-slate-400">{r.score} / {r.totalMarks} Marks</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 6. PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-2xl shrink-0">
                      {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-xl text-white">{userProfile?.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {userProfile?.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">{userProfile?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">{t('language', 'Language')} / ભાષા</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setLanguage('gu')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                          language === 'gu'
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <span>🇮🇳 ગુજરાતી (Gujarati)</span>
                      </button>
                      <button
                        onClick={() => setLanguage('en')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                          language === 'en'
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <span>🇬🇧 English</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">{t('assignedGroups', 'Assigned Groups')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {myGroupObjects.length === 0 ? (
                        <span className="text-xs text-slate-500 italic">No groups assigned</span>
                      ) : (
                        myGroupObjects.map((g) => (
                          <span key={g.groupId} className="bg-indigo-950 text-indigo-200 border border-indigo-500/30 px-3 py-1 rounded-xl text-xs font-semibold">
                            👥 {g.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <button
                      onClick={() => setShowApkGuide(true)}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl border border-slate-700 text-xs flex items-center justify-center gap-2 shadow transition"
                    >
                      <Smartphone className="w-4 h-4 text-indigo-400" />
                      <span>{t('apkGuideTitle', 'Android APK / AAB Packaging Guide')}</span>
                    </button>

                    <button
                      onClick={logout}
                      className="w-full py-3 bg-red-950/60 hover:bg-red-900/60 text-red-200 border border-red-500/30 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('logout', 'Sign Out of Account')}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 7. PROTECTED ADMIN TAB */}
            {activeTab === 'admin' && isAdmin && (
              <AdminPanel
                users={users}
                groups={activeGroups}
                pdfs={activePdfs}
                tests={activeTests}
                results={results}
                onRefresh={() => {}}
              />
            )}
          </>
        )}
      </main>

      {/* MODALS */}
      {/* 1. PDF Viewer Modal */}
      {activePdf && (
        <PDFViewerModal
          pdf={activePdf}
          onClose={() => setActivePdf(null)}
        />
      )}

      {/* 2. MCQ Test Exam View */}
      {activeTest && (
        <TestExamView
          test={activeTest}
          onClose={() => setActiveTest(null)}
        />
      )}

      {/* 3. Android APK Packaging Guide Modal */}
      <ApkBuildGuideModal
        isOpen={showApkGuide}
        onClose={() => setShowApkGuide(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SplashScreen />
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
