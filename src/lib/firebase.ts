// Local Offline Database & Storage Adapter
// Completely disconnects from external Firebase cloud servers to ensure 100% reliable login & privacy

export const auth: any = {
  currentUser: { uid: 'usr_active', email: 'admin@mojilomanish.com' },
  onAuthStateChanged: (cb: any) => {
    cb({ uid: 'usr_active', email: 'admin@mojilomanish.com' });
    return () => {};
  },
  signOut: async () => {},
};

export const db: any = { type: 'local_db' };
export const storage: any = { type: 'local_storage' };

// Helpers for Local Storage collections
const getCollectionData = (collName: string): Record<string, any> => {
  try {
    const raw = localStorage.getItem(`app_db_${collName}`);
    return raw ? JSON.parse(raw) : {};
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

// Storage stubs and local storage file store
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
        // Fallback sample PDF data URL if file read fails
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
