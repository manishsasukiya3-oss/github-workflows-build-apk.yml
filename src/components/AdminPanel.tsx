import React, { useState } from 'react';
import { 
  Users, 
  FolderPlus, 
  Upload, 
  FileText, 
  Award, 
  BarChart2, 
  UserPlus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Plus, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  Layers,
  ChevronRight,
  Filter,
  Key,
  Lock
} from 'lucide-react';
import { UserProfile, Group, PDFItem, Test, Question, TestResult } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  db, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  collection, 
  storage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from '../lib/firebase';

interface AdminPanelProps {
  users: UserProfile[];
  groups: Group[];
  pdfs: PDFItem[];
  tests: Test[];
  results: TestResult[];
  onRefresh: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  groups,
  pdfs,
  tests,
  results,
  onRefresh,
}) => {
  const { adminCreateUser, adminUpdateUserPassword, adminUpdateUser, adminDeleteUser, allUsers } = useAuth();
  const displayUsers = users && users.length > 0 ? users : allUsers;

  // Sub-tabs: 'users' | 'groups' | 'pdfs' | 'tests' | 'results'
  const [subTab, setSubTab] = useState<'users' | 'groups' | 'pdfs' | 'tests' | 'results'>('users');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');

  // Form states
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Group Form
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  // PDF Form
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfDesc, setPdfDesc] = useState('');
  const [pdfCategory, setPdfCategory] = useState('General');
  const [pdfGroupTarget, setPdfGroupTarget] = useState<string[]>(['all']);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Test Form
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [testTitle, setTestTitle] = useState('');
  const [testDesc, setTestDesc] = useState('');
  const [testCategory, setTestCategory] = useState('General');
  const [testDuration, setTestDuration] = useState<number>(15);
  const [testGroupTarget, setTestGroupTarget] = useState<string[]>(['all']);
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: `q_${Date.now()}_1`,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      marks: 1,
    },
  ]);

  // User Add / Edit Form Modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [newUserGroupIds, setNewUserGroupIds] = useState<string[]>([]);

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userGroupIds, setUserGroupIds] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [editUserPassword, setEditUserPassword] = useState('');

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // --- Group Actions ---
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      if (editingGroupId) {
        await updateDoc(doc(db, 'groups', editingGroupId), {
          name: groupName.trim(),
          description: groupDesc.trim(),
        });
        showStatus('success', 'Group updated successfully.');
      } else {
        const newGroupId = `grp_${Date.now()}`;
        const newGroup: Group = {
          groupId: newGroupId,
          name: groupName.trim(),
          description: groupDesc.trim(),
          memberIds: [],
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'groups', newGroupId), newGroup);
        showStatus('success', 'Group created successfully.');
      }

      setShowGroupModal(false);
      setEditingGroupId(null);
      setGroupName('');
      setGroupDesc('');
      onRefresh();
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to save group.');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('Are you sure you want to delete this group?')) return;
    try {
      await deleteDoc(doc(db, 'groups', groupId));
      showStatus('success', 'Group deleted.');
      onRefresh();
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to delete group.');
    }
  };

  // --- PDF Upload Actions ---
  const handleUploadPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfTitle.trim()) return;
    if (!pdfFile) {
      showStatus('error', 'Please select a PDF file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const pdfId = `pdf_${Date.now()}`;
      const storagePath = `pdfs/${pdfId}_${pdfFile.name}`;
      const storageRef = ref(storage, storagePath);

      // Upload to Firebase Storage
      const uploadTask = uploadBytesResumable(storageRef, pdfFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          console.error('PDF upload error:', error);
          // Fallback handling if storage quota or rules error:
          const reader = new FileReader();
          reader.onload = async () => {
            const dataUrl = reader.result as string;
            const pdfDoc: PDFItem = {
              pdfId,
              title: pdfTitle.trim(),
              description: pdfDesc.trim(),
              category: pdfCategory || 'General',
              storagePath: 'local_storage',
              storageUrl: dataUrl,
              fileName: pdfFile.name,
              fileSize: pdfFile.size,
              groupIds: pdfGroupTarget,
              uploadedAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'pdfs', pdfId), pdfDoc);
            showStatus('success', 'PDF uploaded successfully.');
            setShowPdfModal(false);
            setIsUploading(false);
            onRefresh();
          };
          reader.readAsDataURL(pdfFile);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const pdfDoc: PDFItem = {
            pdfId,
            title: pdfTitle.trim(),
            description: pdfDesc.trim(),
            category: pdfCategory || 'General',
            storagePath,
            storageUrl: downloadUrl,
            fileName: pdfFile.name,
            fileSize: pdfFile.size,
            groupIds: pdfGroupTarget,
            uploadedAt: new Date().toISOString(),
          };

          await setDoc(doc(db, 'pdfs', pdfId), pdfDoc);
          showStatus('success', 'PDF uploaded and assigned successfully.');
          setShowPdfModal(false);
          setPdfTitle('');
          setPdfDesc('');
          setPdfFile(null);
          setIsUploading(false);
          onRefresh();
        }
      );
    } catch (err: any) {
      showStatus('error', err.message || 'Upload failed.');
      setIsUploading(false);
    }
  };

  const handleDeletePdf = async (pdfId: string) => {
    if (!window.confirm('Delete this PDF document?')) return;
    try {
      await deleteDoc(doc(db, 'pdfs', pdfId));
      showStatus('success', 'PDF deleted.');
      onRefresh();
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to delete PDF.');
    }
  };

  // --- Test Actions ---
  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q_${Date.now()}_${prev.length + 1}`,
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        marks: 1,
      },
    ]);
  };

  const handleQuestionChange = (idx: number, field: keyof Question, value: any) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleOptionChange = (qIdx: number, optIdx: number, value: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const opts = [...next[qIdx].options];
      opts[optIdx] = value;
      next[qIdx].options = opts;
      return next;
    });
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) return;

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) {
        showStatus('error', `Question ${i + 1} text cannot be empty.`);
        return;
      }
      for (let j = 0; j < questions[i].options.length; j++) {
        if (!questions[i].options[j].trim()) {
          showStatus('error', `Option ${j + 1} in Question ${i + 1} cannot be empty.`);
          return;
        }
      }
    }

    try {
      const totalMarksCalc = questions.reduce((acc, q) => acc + (q.marks || 1), 0);
      const testId = editingTestId || `test_${Date.now()}`;

      const testData: Test = {
        testId,
        title: testTitle.trim(),
        description: testDesc.trim(),
        category: testCategory || 'General',
        duration: Number(testDuration) || 15,
        totalMarks: totalMarksCalc,
        groupIds: testGroupTarget,
        createdAt: new Date().toISOString(),
        questions: questions,
      };

      await setDoc(doc(db, 'tests', testId), testData);
      showStatus('success', 'Examination Test saved successfully.');

      setShowTestModal(false);
      setEditingTestId(null);
      setTestTitle('');
      setTestDesc('');
      setQuestions([
        {
          id: `q_${Date.now()}_1`,
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          explanation: '',
          marks: 1,
        },
      ]);
      onRefresh();
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to save test.');
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!window.confirm('Delete this examination test?')) return;
    try {
      await deleteDoc(doc(db, 'tests', testId));
      showStatus('success', 'Test deleted.');
      onRefresh();
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to delete test.');
    }
  };

  // --- User Management Actions ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      showStatus('error', 'કૃપા કરીને નામ, ઈમેલ અને પાસવર્ડ ભરો.');
      return;
    }

    try {
      await adminCreateUser({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword.trim(),
        role: newUserRole,
        groupIds: newUserGroupIds,
      });

      showStatus('success', 'નવો યુઝર/વિદ્યાર્થી સફળતાપૂર્વક ઉમેરાયો.');
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('123456');
      setNewUserGroupIds([]);
      onRefresh();
    } catch (err: any) {
      showStatus('error', err.message || 'યુઝર ઉમેરવામાં નિષ્ફળ.');
    }
  };

  const handleSaveUserGroups = async () => {
    if (!editingUser) return;
    try {
      const updates: Partial<UserProfile> = {
        groupIds: userGroupIds,
        role: userRole,
      };

      if (editUserPassword.trim()) {
        updates.password = editUserPassword.trim();
        await adminUpdateUserPassword(editingUser.userId, editUserPassword.trim());
      }

      await adminUpdateUser(editingUser.userId, updates);

      showStatus('success', 'યુઝર પ્રોફાઈલ અને પાસવર્ડ સફળતાપૂર્વક અપડેટ થયો.');
      setEditingUser(null);
      setEditUserPassword('');
      onRefresh();
    } catch (err: any) {
      showStatus('error', err.message || 'અપડેટ કરવામાં નિષ્ફળ.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('શું તમે ખરેખર આ યુઝરને ડિલીટ કરવા માગો છો?')) return;
    try {
      await adminDeleteUser(userId);
      showStatus('success', 'યુઝર ડિલીટ થયો.');
      onRefresh();
    } catch (err: any) {
      showStatus('error', err.message || 'ડિલીટ કરવામાં નિષ્ફળ.');
    }
  };

  // Filtered lists
  const filteredUsers = displayUsers.filter((u) => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroupFilter === 'all' || u.groupIds?.includes(selectedGroupFilter);
    return matchesSearch && matchesGroup;
  });

  const filteredResults = results.filter((r) => {
    const matchesSearch = r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.testTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroupFilter === 'all' || r.groupIds?.includes(selectedGroupFilter);
    return matchesSearch && matchesGroup;
  });

  // Calculate Result Statistics
  const highestScore = filteredResults.length > 0 
    ? Math.max(...filteredResults.map((r) => r.percentage)) 
    : 0;
  
  const avgScore = filteredResults.length > 0
    ? Math.round(filteredResults.reduce((acc, r) => acc + r.percentage, 0) / filteredResults.length)
    : 0;

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600/20 via-slate-800 to-indigo-600/20 border border-amber-500/30 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
            ADMINISTRATOR CONTROL PANEL
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">System Management Hub</h2>
          <p className="text-xs text-slate-300">Create groups, assign users, upload PDFs, and manage exams.</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-700/80 text-center shrink-0">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Users</span>
            <span className="font-extrabold text-sm text-white">{users.length}</span>
          </div>
          <div className="bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-700/80 text-center shrink-0">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Groups</span>
            <span className="font-extrabold text-sm text-amber-300">{groups.length}</span>
          </div>
          <div className="bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-700/80 text-center shrink-0">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">PDFs</span>
            <span className="font-extrabold text-sm text-indigo-300">{pdfs.length}</span>
          </div>
          <div className="bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-700/80 text-center shrink-0">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Tests</span>
            <span className="font-extrabold text-sm text-emerald-300">{tests.length}</span>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {statusMsg && (
        <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-lg ${
          statusMsg.type === 'success' ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/40' : 'bg-red-950/80 text-red-200 border border-red-500/40'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Admin Sub Navigation Tabs */}
      <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex flex-wrap gap-1 text-xs font-bold">
        {[
          { id: 'users', label: 'Users', icon: Users, count: users.length },
          { id: 'groups', label: 'Groups', icon: FolderPlus, count: groups.length },
          { id: 'pdfs', label: 'PDF Library', icon: FileText, count: pdfs.length },
          { id: 'tests', label: 'Tests', icon: Award, count: tests.length },
          { id: 'results', label: 'Group Results', icon: BarChart2, count: results.length },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = subTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id as any)}
              className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
                isActive ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-slate-950 text-white' : 'bg-slate-800 text-slate-300'}`}>
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: USERS MANAGEMENT */}
      {subTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs font-semibold py-2 px-3 rounded-xl text-white focus:outline-none"
              >
                <option value="all">Filter by Group: All</option>
                {groups.map((g) => (
                  <option key={g.groupId} value={g.groupId}>{g.name}</option>
                ))}
              </select>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow flex items-center gap-1.5 shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ નવો વિદ્યાર્થી/યુઝર</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">User Details</th>
                    <th className="p-3.5">Password / પાસવર્ડ</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Assigned Groups</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">No users found.</td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const userGroupNames = groups
                        .filter((g) => u.groupIds?.includes(g.groupId))
                        .map((g) => g.name);

                      return (
                        <tr key={u.userId} className="hover:bg-slate-800/50 transition">
                          <td className="p-3.5">
                            <span className="font-bold text-white block">{u.name}</span>
                            <span className="text-slate-400 text-[11px] font-mono">{u.email}</span>
                          </td>
                          <td className="p-3.5 font-mono text-amber-300 font-bold">
                            <span className="inline-flex items-center gap-1.5 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-500/30">
                              <Key className="w-3 h-3 text-amber-400" />
                              <span>{u.password || '123456'}</span>
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              u.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {userGroupNames.length === 0 ? (
                              <span className="text-slate-500 italic">No groups assigned</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {userGroupNames.map((gn, idx) => (
                                  <span key={idx} className="bg-indigo-950 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-medium">
                                    {gn}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setUserGroupIds(u.groupIds || []);
                                  setUserRole(u.role || 'user');
                                  setEditUserPassword(u.password || '');
                                }}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-[11px] shadow flex items-center gap-1"
                              >
                                <Edit className="w-3.5 h-3.5" /> Manage
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.userId)}
                                className="p-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/30 text-red-300 rounded-lg transition"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GROUPS MANAGEMENT */}
      {subTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-white">Groups & Classes ({groups.length})</h3>
            <button
              onClick={() => {
                setEditingGroupId(null);
                setGroupName('');
                setGroupDesc('');
                setShowGroupModal(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create New Group
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.length === 0 ? (
              <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                No groups created yet. Click "Create New Group" to get started!
              </div>
            ) : (
              groups.map((grp) => {
                const assignedPdfsCount = pdfs.filter((p) => p.groupIds?.includes(grp.groupId) || p.groupIds?.includes('all')).length;
                const assignedTestsCount = tests.filter((t) => t.groupIds?.includes(grp.groupId) || t.groupIds?.includes('all')).length;

                return (
                  <div key={grp.groupId} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-base text-white">{grp.name}</h4>
                        <p className="text-xs text-slate-300 mt-0.5">{grp.description || 'General study group'}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingGroupId(grp.groupId);
                            setGroupName(grp.name);
                            setGroupDesc(grp.description || '');
                            setShowGroupModal(true);
                          }}
                          className="p-1.5 text-indigo-400 hover:bg-indigo-950 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(grp.groupId)}
                          className="p-1.5 text-red-400 hover:bg-red-950 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Members</span>
                        <span className="font-extrabold text-white">{grp.memberIds?.length || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">PDFs</span>
                        <span className="font-extrabold text-indigo-300">{assignedPdfsCount}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Tests</span>
                        <span className="font-extrabold text-amber-300">{assignedTestsCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PDF MANAGEMENT */}
      {subTab === 'pdfs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-white">Study PDFs ({pdfs.length})</h3>
            <button
              onClick={() => {
                setPdfTitle('');
                setPdfDesc('');
                setPdfFile(null);
                setPdfGroupTarget(['all']);
                setShowPdfModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" /> Upload New PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pdfs.length === 0 ? (
              <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                No PDFs uploaded yet.
              </div>
            ) : (
              pdfs.map((pdf) => {
                const isAllGroups = pdf.groupIds?.includes('all');
                const groupNames = isAllGroups 
                  ? ['🌐 All Groups'] 
                  : groups.filter((g) => pdf.groupIds?.includes(g.groupId)).map((g) => g.name);

                return (
                  <div key={pdf.pdfId} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="truncate space-y-1">
                        <h4 className="font-bold text-sm text-white truncate">{pdf.title}</h4>
                        <div className="flex flex-wrap gap-1">
                          {groupNames.map((gn, idx) => (
                            <span key={idx} className="bg-slate-800 text-indigo-300 border border-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                              {gn}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeletePdf(pdf.pdfId)}
                      className="p-2 text-red-400 hover:bg-red-950 rounded-lg transition shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: TEST CREATOR & TESTS MANAGEMENT */}
      {subTab === 'tests' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-white">Examination Tests ({tests.length})</h3>
            <button
              onClick={() => {
                setEditingTestId(null);
                setTestTitle('');
                setTestDesc('');
                setTestGroupTarget(['all']);
                setQuestions([
                  {
                    id: `q_${Date.now()}_1`,
                    question: '',
                    options: ['', '', '', ''],
                    correctAnswer: 0,
                    explanation: '',
                    marks: 1,
                  },
                ]);
                setShowTestModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create New Test
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tests.length === 0 ? (
              <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                No examination tests created yet.
              </div>
            ) : (
              tests.map((test) => (
                <div key={test.testId} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {test.category || 'Exam'}
                      </span>
                      <h4 className="font-bold text-base text-white mt-1">{test.title}</h4>
                      <p className="text-xs text-slate-300 line-clamp-1">{test.description}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteTest(test.testId)}
                      className="p-1.5 text-red-400 hover:bg-red-950 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
                    <span>⏱️ {test.duration} mins</span>
                    <span>📝 {test.questions?.length || 0} Questions</span>
                    <span>🏆 {test.totalMarks} Marks</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: GROUP RESULTS ANALYTICS */}
      {subTab === 'results' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Total Submissions</span>
              <span className="text-xl font-extrabold text-white">{filteredResults.length}</span>
            </div>
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Highest Score</span>
              <span className="text-xl font-extrabold text-emerald-400">{highestScore}%</span>
            </div>
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center col-span-2 md:col-span-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Average Score</span>
              <span className="text-xl font-extrabold text-indigo-400">{avgScore}%</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Test Title</th>
                    <th className="p-3.5">Score</th>
                    <th className="p-3.5">Percentage</th>
                    <th className="p-3.5">Submitted Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">No test results recorded yet.</td>
                    </tr>
                  ) : (
                    filteredResults.map((r) => (
                      <tr key={r.resultId} className="hover:bg-slate-800/50 transition">
                        <td className="p-3.5">
                          <span className="font-bold text-white block">{r.userName}</span>
                          <span className="text-[10px] text-slate-400">{r.userEmail}</span>
                        </td>
                        <td className="p-3.5 font-semibold text-indigo-300">{r.testTitle}</td>
                        <td className="p-3.5 font-mono">{r.score} / {r.totalMarks}</td>
                        <td className="p-3.5 font-extrabold text-emerald-400">{r.percentage}%</td>
                        <td className="p-3.5 text-slate-400">{new Date(r.submittedAt).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: CREATE/EDIT GROUP --- */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">
                {editingGroupId ? 'Edit Group' : 'Create New Group'}
              </h3>
              <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Group Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 10 - Batch A"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Description</label>
                <textarea
                  placeholder="Description or notes for this group..."
                  rows={3}
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow"
                >
                  Save Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: UPLOAD PDF --- */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Upload Study PDF</h3>
              <button onClick={() => setShowPdfModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadPDF} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">PDF Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 1: Physics Fundamentals"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Description</label>
                <input
                  type="text"
                  placeholder="Short description..."
                  value={pdfDesc}
                  onChange={(e) => setPdfDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Select PDF File from Device *</label>
                <input
                  type="file"
                  accept="application/pdf"
                  required
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:font-semibold text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Assign to Group(s):</label>
                <div className="space-y-1 max-h-28 overflow-y-auto bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <label className="flex items-center gap-2 p-1 text-slate-200">
                    <input
                      type="checkbox"
                      checked={pdfGroupTarget.includes('all')}
                      onChange={(e) => {
                        if (e.target.checked) setPdfGroupTarget(['all']);
                        else setPdfGroupTarget([]);
                      }}
                    />
                    <span>🌐 All Groups</span>
                  </label>
                  {groups.map((g) => (
                    <label key={g.groupId} className="flex items-center gap-2 p-1 text-slate-300">
                      <input
                        type="checkbox"
                        checked={pdfGroupTarget.includes(g.groupId)}
                        onChange={(e) => {
                          const isAll = pdfGroupTarget.includes('all');
                          const cleanTarget = isAll ? [] : [...pdfGroupTarget];
                          if (e.target.checked) {
                            setPdfGroupTarget([...cleanTarget, g.groupId]);
                          } else {
                            setPdfGroupTarget(cleanTarget.filter((id) => id !== g.groupId));
                          }
                        }}
                      />
                      <span>👥 {g.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {isUploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                    <span>Uploading PDF to Firebase Storage...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${uploadProgress}%` }} className="bg-indigo-500 h-full transition-all"></div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  disabled={isUploading}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow"
                >
                  Upload & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: CREATE / EDIT MCQ TEST --- */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl text-slate-100 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Create Online MCQ Examination</h3>
              <button onClick={() => setShowTestModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTest} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Test Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science Mock Examination 2026"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Duration (Minutes) *</label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    required
                    value={testDuration}
                    onChange={(e) => setTestDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Target Group(s):</label>
                <div className="flex flex-wrap gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <label className="flex items-center gap-1.5 text-slate-200">
                    <input
                      type="checkbox"
                      checked={testGroupTarget.includes('all')}
                      onChange={(e) => {
                        if (e.target.checked) setTestGroupTarget(['all']);
                        else setTestGroupTarget([]);
                      }}
                    />
                    <span>🌐 All Groups</span>
                  </label>
                  {groups.map((g) => (
                    <label key={g.groupId} className="flex items-center gap-1.5 text-slate-300">
                      <input
                        type="checkbox"
                        checked={testGroupTarget.includes(g.groupId)}
                        onChange={(e) => {
                          const isAll = testGroupTarget.includes('all');
                          const cleanTarget = isAll ? [] : [...testGroupTarget];
                          if (e.target.checked) setTestGroupTarget([...cleanTarget, g.groupId]);
                          else setTestGroupTarget(cleanTarget.filter((id) => id !== g.groupId));
                        }}
                      />
                      <span>👥 {g.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Question Creator Section */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-indigo-300">Questions ({questions.length})</h4>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </div>

                {questions.map((q, qIdx) => (
                  <div key={q.id || qIdx} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-amber-400">Question #{qIdx + 1}</span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="Enter question statement..."
                      value={q.question}
                      onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct_${qIdx}`}
                            checked={q.correctAnswer === oIdx}
                            onChange={() => handleQuestionChange(qIdx, 'correctAnswer', oIdx)}
                            title="Mark as correct option"
                          />
                          <input
                            type="text"
                            required
                            placeholder={`Option ${['A','B','C','D'][oIdx]}`}
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Explanation / hint for correct answer..."
                      value={q.explanation}
                      onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 text-[11px]"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-white font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow"
                >
                  Save MCQ Examination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: MANAGE USER GROUPS & ROLE & PASSWORD --- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">યુઝર/વિદ્યાર્થી પ્રોફાઈલ અને પાસવર્ડ બદલો</h3>
                <p className="text-xs text-slate-400">{editingUser.name} ({editingUser.email})</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-amber-300 font-bold block flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>નવો પાસવર્ડ સેટ કરો (Set New Password):</span>
                </label>
                <input
                  type="text"
                  placeholder="નવો પાસવર્ડ લખો (લઘુત્તમ 6 અક્ષર)..."
                  value={editUserPassword}
                  onChange={(e) => setEditUserPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-2.5 text-amber-200 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">રોલ (System Role):</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                >
                  <option value="user">Student User (વિદ્યાર્થી)</option>
                  <option value="admin">Administrator (એડમિન)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">ફાળવેલ ગ્રુપ (Assigned Groups):</label>
                <div className="space-y-1 max-h-40 overflow-y-auto bg-slate-950 p-2 rounded-xl border border-slate-800">
                  {groups.map((g) => {
                    const isAssigned = userGroupIds.includes(g.groupId);
                    return (
                      <label key={g.groupId} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 cursor-pointer">
                        <span className="text-slate-200">{g.name}</span>
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={(e) => {
                            if (e.target.checked) setUserGroupIds([...userGroupIds, g.groupId]);
                            else setUserGroupIds(userGroupIds.filter((id) => id !== g.groupId));
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 bg-slate-800 text-white font-bold rounded-xl"
                >
                  રદ કરો
                </button>
                <button
                  type="button"
                  onClick={handleSaveUserGroups}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow"
                >
                  પ્રોફાઈલ સાચવો
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 5: ADD NEW USER BY ADMIN --- */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">નવો યુઝર / વિદ્યાર્થી ઉમેરો</h3>
                <p className="text-xs text-slate-400">એડમિન દ્વારા વિદ્યાર્થીનું એકાઉન્ટ અને પાસવર્ડ બનાવો</p>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">પૂરું નામ (Full Name):</label>
                <input
                  type="text"
                  required
                  placeholder="દા.ત. રમેશ પટેલ"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">ઈમેલ એડ્રેસ (Email Address):</label>
                <input
                  type="email"
                  required
                  placeholder="student1@mojilomanish.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-amber-300 font-bold block flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>પાસવર્ડ બનાવો (Set Account Password):</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="123456"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-2.5 text-amber-200 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">એકાઉન્ટ રોલ (Role):</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                >
                  <option value="user">Student User (વિદ્યાર્થી)</option>
                  <option value="admin">Administrator (એડમિન)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">ગ્રુપ ફાળવણી (Assign Groups):</label>
                <div className="space-y-1 max-h-32 overflow-y-auto bg-slate-950 p-2 rounded-xl border border-slate-800">
                  {groups.map((g) => {
                    const isChecked = newUserGroupIds.includes(g.groupId);
                    return (
                      <label key={g.groupId} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 cursor-pointer">
                        <span className="text-slate-200">{g.name}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setNewUserGroupIds([...newUserGroupIds, g.groupId]);
                            else setNewUserGroupIds(newUserGroupIds.filter((id) => id !== g.groupId));
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-white font-bold rounded-xl"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow"
                >
                  યુઝર બનાવો
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
