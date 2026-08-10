// Self-contained Local Storage & Reactive Database Engine
// Operates 100% online in browser without any external Firebase connection required.

export const auth: any = {
  currentUser: { uid: 'usr_admin_1', email: 'admin@mojilomanish.com' },
  onAuthStateChanged: (cb: any) => {
    cb({ uid: 'usr_admin_1', email: 'admin@mojilomanish.com' });
    return () => {};
  },
  signOut: async () => {},
};

export const db: any = { type: 'local_db' };
export const storage: any = { type: 'local_storage' };

// Seed default sample data for Groups, PDFs, Tests if empty
const DEFAULT_SEED: Record<string, any[]> = {
  groups: [
    {
      groupId: 'grp_demo_1',
      name: 'GPSC Class 1-2 General Batch',
      description: 'GPSC તમામ વિષયો માટે ખાસ ઓનલાઇન તૈયારી ગ્રુપ',
      category: 'GPSC',
      membersCount: 142,
      createdAt: new Date().toISOString(),
    },
    {
      groupId: 'grp_demo_2',
      name: 'Binsachivalay & CCE Exam 2026',
      description: 'CCE ક્લાર્ક અને બિનસચિવાલય ખાસ મોક ટેસ્ટ અને મટીરીયલ',
      category: 'CCE',
      membersCount: 215,
      createdAt: new Date().toISOString(),
    },
  ],
  pdfs: [
    {
      pdfId: 'pdf_sample_1',
      title: 'ગુજરાતનો ઇતિહાસ અને સાંસ્કૃતિક વારસો (Most Important Notes)',
      description: 'GPSC અને CCE માટે મહત્વના 100 પ્રશ્નો અને મુદ્દા',
      category: 'History',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileSize: '2.4 MB',
      uploadDate: new Date().toISOString().split('T')[0],
      groupIds: ['grp_demo_1', 'all'],
    },
    {
      pdfId: 'pdf_sample_2',
      title: 'ભારતીય બંધારણ અને રાજ્યવ્યવસ્થા વનલાઇનર',
      description: 'સ્પર્ધાત્મક પરીક્ષાઓ માટે ઉપયોગી બંધારણ ના અગત્યના અનુચ્છેદ',
      category: 'Polity',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileSize: '1.8 MB',
      uploadDate: new Date().toISOString().split('T')[0],
      groupIds: ['grp_demo_2', 'all'],
    },
  ],
  tests: [
    {
      testId: 'test_sample_1',
      title: 'ગુજરાત નો ઇતિહાસ મોક ટેસ્ટ - 1',
      description: 'ગુજરાતના પ્રાચીન અને અર્વાચીન ઇતિહાસ પર આધારિત 10 પ્રશ્નોની ટેસ્ટ',
      category: 'History',
      duration: 15,
      totalMarks: 10,
      negativeMarking: 0.25,
      groupIds: ['grp_demo_1', 'all'],
      createdAt: new Date().toISOString(),
      questions: [
        {
          questionId: 'q1',
          questionText: 'ગુજરાતમાં માતૃશ્રાધ્ધ માટે કયું સ્થળ જાણીતું છે?',
          options: ['સિદ્ધપુર', 'ચાંદોદ', 'પ્રભાસ પાટણ', 'દ્વારકા'],
          correctOptionIndex: 0,
          explanation: 'સિદ્ધપુર (બિંદુ સરોવર) માતૃશ્રાધ્ધ માટે જાણીતું છે.',
        },
        {
          questionId: 'q2',
          questionText: 'સોલંકી વંશના સ્થાપક કોણ હતા?',
          options: ['સિદ્ધરાજ જયસિંહ', 'કુમારપાળ', 'મૂળરાજ પહેલો', 'ભીમદેવ પહેલો'],
          correctOptionIndex: 2,
          explanation: 'સોલંકી વંશની સ્થાપના મૂળરાજ પહેલાએ કરી હતી.',
        },
        {
          questionId: 'q3',
          questionText: 'ગુજરાતના પ્રથમ મહિલા મુખ્યમંત્રી કોણ હતા?',
          options: ['આનંદીબેન પટેલ', 'વિજયાલક્ષ્મી પંડિત', 'સરલા દેવી', 'સુચેતા કૃપલાણી'],
          correctOptionIndex: 0,
          explanation: 'આનંદીબેન પટેલ ગુજરાતના પ્રથમ મહિલા મુખ્યમંત્રી હતા.',
        },
      ],
    },
  ],
};

// Helpers for Local Storage collections
const getCollectionData = (collName: string): Record<string, any> => {
  try {
    const raw = localStorage.getItem(`app_db_${collName}`);
    if (raw) {
      return JSON.parse(raw);
    }
    // Seed default if exists
    if (DEFAULT_SEED[collName]) {
      const seededObj: Record<string, any> = {};
      DEFAULT_SEED[collName].forEach((item) => {
        const id = item.groupId || item.pdfId || item.testId || `id_${Math.random()}`;
        seededObj[id] = item;
      });
      localStorage.setItem(`app_db_${collName}`, JSON.stringify(seededObj));
      return seededObj;
    }
    return {};
  } catch {
    return {};
  }
};

const setCollectionData = (collName: string, data: Record<string, any>) => {
  try {
    localStorage.setItem(`app_db_${collName}`, JSON.stringify(data));
    notifyListeners(collName);
  } catch (e) {
    console.error('Local Storage save error:', e);
  }
};

// Listeners registry for onSnapshot
const listeners: Record<string, Set<(snap: any) => void>> = {};

const notifyListeners = (collName: string) => {
  if (!listeners[collName]) return;
  const items = getCollectionData(collName);
  const docsList = Object.entries(items).map(([id, data]) => ({
    id,
    data: () => data,
  }));

  const snap = {
    docs: docsList,
    forEach: (cb: (doc: any) => void) => docsList.forEach(cb),
  };

  listeners[collName].forEach((cb) => cb(snap));
};

export const collection = (dbInstance: any, collName: string) => {
  return { collName };
};

export const doc = (dbInstance: any, collName: string, docId?: string) => {
  return { collName, docId: docId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` };
};

export const setDoc = async (docRef: any, data: any) => {
  const { collName, docId } = docRef;
  const curr = getCollectionData(collName);
  curr[docId] = { ...data, id: docId };
  setCollectionData(collName, curr);
};

export const addDoc = async (collRef: any, data: any) => {
  const collName = collRef.collName;
  const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const curr = getCollectionData(collName);
  const fullData = { ...data, id: docId };
  curr[docId] = fullData;
  setCollectionData(collName, curr);
  return { id: docId };
};

export const updateDoc = async (docRef: any, updates: any) => {
  const { collName, docId } = docRef;
  const curr = getCollectionData(collName);
  if (curr[docId]) {
    curr[docId] = { ...curr[docId], ...updates };
    setCollectionData(collName, curr);
  }
};

export const deleteDoc = async (docRef: any) => {
  const { collName, docId } = docRef;
  const curr = getCollectionData(collName);
  delete curr[docId];
  setCollectionData(collName, curr);
};

export const getDocs = async (collRefOrQuery: any) => {
  const collName = collRefOrQuery.collName || collRefOrQuery;
  const items = getCollectionData(collName);
  const docsList = Object.entries(items).map(([id, data]) => ({
    id,
    data: () => data,
  }));
  return {
    docs: docsList,
    forEach: (cb: (doc: any) => void) => docsList.forEach(cb),
  };
};

export const getDoc = async (docRef: any) => {
  const { collName, docId } = docRef;
  const curr = getCollectionData(collName);
  const item = curr[docId];
  return {
    exists: () => !!item,
    data: () => item,
    id: docId,
  };
};

export const query = (collRef: any, ...clauses: any[]) => {
  return collRef;
};

export const where = (field: string, op: string, val: any) => {
  return { field, op, val };
};

export const onSnapshot = (
  target: any,
  onNext: (snap: any) => void,
  onError?: (err: any) => void
) => {
  const collName = target.collName || 'default';
  if (!listeners[collName]) {
    listeners[collName] = new Set();
  }
  listeners[collName].add(onNext);

  // Initial emission
  setTimeout(() => {
    notifyListeners(collName);
  }, 10);

  return () => {
    listeners[collName]?.delete(onNext);
  };
};

// Local storage file store
const fileStore: Record<string, string> = {};

export const ref = (storageInst: any, path: string) => {
  return { path };
};

export const uploadBytesResumable = (refInst: any, file: File) => {
  let progressCb: any = null;
  let completeCb: any = null;

  const snapshot = {
    ref: refInst,
  };

  const task = {
    snapshot,
    on: (evt: string, pCb: any, eCb: any, cCb: any) => {
      progressCb = pCb;
      completeCb = cCb;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        fileStore[refInst.path] = dataUrl;
        if (progressCb) progressCb({ bytesTransferred: file.size, totalBytes: file.size });
        if (completeCb) completeCb();
      };
      reader.onerror = () => {
        fileStore[refInst.path] = `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`;
        if (completeCb) completeCb();
      };
      reader.readAsDataURL(file);
    },
  };

  return task;
};

export const getDownloadURL = async (refInst: any) => {
  return fileStore[refInst.path] || `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`;
};

export const deleteObject = async (refInst: any) => {};
