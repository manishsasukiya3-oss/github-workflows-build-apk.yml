import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'gu';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav & Common
    appSubtitle: 'Exam & Study Portal',
    home: 'Home',
    groups: 'Groups',
    pdfs: 'PDFs',
    tests: 'Tests',
    results: 'Results',
    profile: 'Profile',
    adminPanel: 'Admin Panel',
    allMyGroups: 'All My Groups',
    logout: 'Log Out',
    login: 'Login',
    register: 'Register',
    
    // Home / Dashboard
    welcome: 'Welcome',
    recentPdfs: 'Recent PDFs & Material',
    availableTests: 'Available Online Tests',
    myGroups: 'My Enrolled Groups',
    noPdfsYet: 'No PDF materials assigned to your group yet.',
    noTestsYet: 'No online tests assigned to your group yet.',
    viewPdf: 'View PDF',
    startTest: 'Start Test',
    searchPdf: 'Search PDFs...',
    searchTest: 'Search Tests...',
    testDuration: 'mins',
    totalMarks: 'Marks',
    questionsCount: 'Questions',
    assignedGroups: 'Assigned Groups',
    allGroups: 'All Groups',

    // Group Dashboard
    groupNoticeboard: 'Group Noticeboard',
    groupPdfs: 'Group Study Materials (PDFs)',
    groupTests: 'Group Online Tests',
    noGroupSelected: 'Please select a group to view contents',
    noticeboardEmpty: 'No announcements posted for this group yet.',
    
    // Tests & Exam
    timeRemaining: 'Time Remaining',
    question: 'Question',
    of: 'of',
    submitTest: 'Submit Test',
    answered: 'Answered',
    unanswered: 'Unanswered',
    score: 'Score',
    passed: 'Passed',
    failed: 'Failed',
    testResult: 'Test Result',
    backToDashboard: 'Back to Dashboard',
    reviewAnswers: 'Review Answers',
    congratulations: 'Congratulations!',
    keepPracticing: 'Keep Practicing!',
    percentage: 'Percentage',
    correctAnswers: 'Correct Answers',
    wrongAnswers: 'Wrong Answers',

    // Admin
    manageGroups: 'Manage Groups',
    uploadPdf: 'Upload PDF',
    createTest: 'Create Test',
    userManagement: 'User Management',
    resultsOverview: 'Results Overview',
    
    // Auth & Profile
    fullName: 'Full Name',
    emailAddress: 'Email Address',
    mobileNumber: 'Mobile Number',
    password: 'Password',
    selectGroup: 'Select Group',
    adminLogin: 'Admin Login',
    studentLogin: 'Student Login',
    profileDetails: 'Profile Details',
    role: 'Role',
    student: 'Student',
    admin: 'Admin',
    language: 'Language',
    selectLanguage: 'Select Language',
    
    // Build Guide
    apkGuideTitle: 'Android App (APK / AAB) Packaging Guide'
  },
  gu: {
    // Nav & Common
    appSubtitle: 'પરીક્ષા અને અભ્યાસ પોર્ટલ',
    home: 'મુખ્ય પૃષ્ઠ',
    groups: 'જૂથો (ગ્રુપ્સ)',
    pdfs: 'પીડીએફ સાહિત્ય',
    tests: 'ઓનલાઇન ટેસ્ટ',
    results: 'પરિણામો',
    profile: 'પ્રોફાઇલ',
    adminPanel: 'એડમિન પેનલ',
    allMyGroups: 'મારા બધા જૂથો',
    logout: 'લોગ આઉટ',
    login: 'લોગિન',
    register: 'રજિસ્ટર (નવું એકાઉન્ટ)',
    
    // Home / Dashboard
    welcome: 'સ્વાગત છે',
    recentPdfs: 'તાજેતરની પીડીએફ અને સાહિત્ય',
    availableTests: 'ઉપલબ્ધ ઓનલાઇન પરીક્ષાઓ',
    myGroups: 'મારા જોડાયેલા જૂથો',
    noPdfsYet: 'હજુ સુધી તમારા જૂથ માટે કોઈ પીડીએફ ફાળવવામાં આવી નથી.',
    noTestsYet: 'હજુ સુધી તમારા જૂથ માટે કોઈ ટેસ્ટ ફાળવવામાં આવી નથી.',
    viewPdf: 'પીડીએફ જુઓ',
    startTest: 'ટેસ્ટ શરૂ કરો',
    searchPdf: 'પીડીએફ શોધો...',
    searchTest: 'ટેસ્ટ શોધો...',
    testDuration: 'મિનિટ',
    totalMarks: 'ગુણ',
    questionsCount: 'પ્રશ્નો',
    assignedGroups: 'ફાળવેલ જૂથો',
    allGroups: 'બધા જૂથો',

    // Group Dashboard
    groupNoticeboard: 'જૂથ સુચના બોર્ડ (નોટિસ)',
    groupPdfs: 'જૂથ અભ્યાસ સામગ્રી (પીડીએફ)',
    groupTests: 'જૂથ ઓનલાઇન પરીક્ષાઓ',
    noGroupSelected: 'સામગ્રી જોવા માટે કૃપા કરીને જૂથ પસંદ કરો',
    noticeboardEmpty: 'આ જૂથ માટે હજી સુધી કોઈ જાહેરાત પોસ્ટ કરાઈ નથી.',
    
    // Tests & Exam
    timeRemaining: 'બાકી રહેલ સમય',
    question: 'પ્રશ્ન',
    of: 'માંથી',
    submitTest: 'ટેસ્ટ જમા કરો',
    answered: 'ઉત્તર આપેલ',
    unanswered: 'ઉત્તર વગરના',
    score: 'ગુણ (સ્કોર)',
    passed: 'ઉત્તીર્ણ (પાસ)',
    failed: 'અનુત્તીર્ણ (નાપાસ)',
    testResult: 'પરીક્ષાનું પરિણામ',
    backToDashboard: 'ડેશબોર્ડ પર પાછા જાઓ',
    reviewAnswers: 'જવાબોની સમીક્ષા કરો',
    congratulations: 'અભિનંદન!',
    keepPracticing: 'મહેનત ચાલુ રાખો!',
    percentage: 'ટકાવારી',
    correctAnswers: 'સાચા જવાબો',
    wrongAnswers: 'ખોટા જવાબો',

    // Admin
    manageGroups: 'જૂથોનું સંચાલન',
    uploadPdf: 'પીડીએફ અપલોડ કરો',
    createTest: 'નવી ટેસ્ટ બનાવો',
    userManagement: 'વપરાશકર્તા સંચાલન',
    resultsOverview: 'પરિણામોની સમીક્ષા',
    
    // Auth & Profile
    fullName: 'પૂરું નામ',
    emailAddress: 'ઈમેલ એડ્રેસ',
    mobileNumber: 'મોબાઈલ નંબર',
    password: 'પાસવર્ડ',
    selectGroup: 'જૂથ પસંદ કરો',
    adminLogin: 'એડમિન લોગિન',
    studentLogin: 'વિદ્યાર્થી લોગિન',
    profileDetails: 'પ્રોફાઇલ વિગતો',
    role: 'હોદ્દો (રોલ)',
    student: 'વિદ્યાર્થી',
    admin: 'એડમિન',
    language: 'ભાષા',
    selectLanguage: 'ભાષા પસંદ કરો',
    
    // Build Guide
    apkGuideTitle: 'એન્ડ્રોઇડ એપ (APK / AAB) માર્ગદર્શિકા'
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'gu', // default to Gujarati / English switch
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'en' || saved === 'gu') ? saved : 'gu'; // default gujarati or english
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    if (translations.en[key]) {
      return translations.en[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
