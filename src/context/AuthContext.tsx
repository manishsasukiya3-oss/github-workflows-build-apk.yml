import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';

// Pre-seeded default local accounts for instant testing & offline operation
const DEFAULT_USERS: UserProfile[] = [
  {
    userId: 'usr_admin_1',
    name: 'Admin Manager',
    email: 'admin@mojilomanish.com',
    password: 'admin123',
    role: 'admin',
    groupIds: ['all', 'grp_demo_1'],
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'usr_student_1',
    name: 'Student User',
    email: 'student@mojilomanish.com',
    password: 'student123',
    role: 'user',
    groupIds: ['grp_demo_1'],
    status: 'active',
    createdAt: new Date().toISOString(),
  }
];

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  selectedGroupId: string;
  setSelectedGroupId: (id: string) => void;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string, groupIds?: string[]) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  bootstrapFirstAdmin: () => Promise<{ success: boolean; message: string }>;
  clearError: () => void;
  
  // Admin In-App User & Password Management
  allUsers: UserProfile[];
  adminCreateUser: (userData: Partial<UserProfile> & { email: string; password?: string; name: string }) => Promise<void>;
  adminUpdateUserPassword: (userId: string, newPass: string) => Promise<void>;
  adminUpdateUser: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
  adminDeleteUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Load all users from localStorage on mount
  useEffect(() => {
    try {
      const savedUsersJson = localStorage.getItem('app_users_db');
      let usersList: UserProfile[] = savedUsersJson ? JSON.parse(savedUsersJson) : [];

      if (!usersList || usersList.length === 0) {
        usersList = DEFAULT_USERS;
        localStorage.setItem('app_users_db', JSON.stringify(DEFAULT_USERS));
      }

      setAllUsers(usersList);

      // Check active user session
      const savedActiveUserJson = localStorage.getItem('app_active_user');
      if (savedActiveUserJson) {
        const activeUser: UserProfile = JSON.parse(savedActiveUserJson);
        // Refresh with latest from database
        const freshUser = usersList.find(u => u.userId === activeUser.userId || u.email.toLowerCase() === activeUser.email.toLowerCase());
        setUserProfile(freshUser || activeUser);
      }
    } catch (err) {
      console.error('Error loading local auth state:', err);
      setAllUsers(DEFAULT_USERS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save users state whenever allUsers changes
  const updateUsersDb = (newUsers: UserProfile[]) => {
    setAllUsers(newUsers);
    localStorage.setItem('app_users_db', JSON.stringify(newUsers));
  };

  const login = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Search in local database
    const matchedUser = allUsers.find(
      u => u.email.toLowerCase() === cleanEmail && (u.password ? u.password === cleanPass : true)
    );

    if (matchedUser) {
      if (matchedUser.status === 'deactivated') {
        setLoading(false);
        const msg = 'તમારું એકાઉન્ટ નિષ્ક્રિય (deactivated) કરવામાં આવ્યું છે.';
        setError(msg);
        throw new Error(msg);
      }

      setUserProfile(matchedUser);
      localStorage.setItem('app_active_user', JSON.stringify(matchedUser));
      setLoading(false);
      return;
    }

    // 2. If no direct match in default users list, check if user exists without password check (for newly registered users)
    const existingUserNoPass = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingUserNoPass) {
      if (existingUserNoPass.password && existingUserNoPass.password !== cleanPass) {
        setLoading(false);
        const msg = 'ઈમેલ અથવા પાસવર્ડ ખોટો છે.';
        setError(msg);
        throw new Error(msg);
      }
      setUserProfile(existingUserNoPass);
      localStorage.setItem('app_active_user', JSON.stringify(existingUserNoPass));
      setLoading(false);
      return;
    }

    // 3. Fallback: Create dynamic local user if logging in for demo
    const dynamicUser: UserProfile = {
      userId: `usr_${Date.now()}`,
      name: cleanEmail.split('@')[0],
      email: cleanEmail,
      password: cleanPass || '123456',
      role: 'user',
      groupIds: [],
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const updatedList = [...allUsers, dynamicUser];
    updateUsersDb(updatedList);
    setUserProfile(dynamicUser);
    localStorage.setItem('app_active_user', JSON.stringify(dynamicUser));
    setLoading(false);
  };

  const signup = async (email: string, pass: string, name: string, groupIds: string[] = []) => {
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];

    // Check if email already registered
    const existing = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      setLoading(false);
      const msg = 'આ ઈમેલ સરનામું પહેલેથી જ નોંધાયેલ છે. લોગિન કરો.';
      setError(msg);
      throw new Error(msg);
    }

    const newUser: UserProfile = {
      userId: `usr_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      password: pass.trim() || '123456',
      role: allUsers.length === 0 ? 'admin' : 'user', // first user is admin
      groupIds: groupIds,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const updatedList = [...allUsers, newUser];
    updateUsersDb(updatedList);

    setUserProfile(newUser);
    localStorage.setItem('app_active_user', JSON.stringify(newUser));
    setLoading(false);
  };

  const logout = async () => {
    setUserProfile(null);
    setSelectedGroupId('all');
    localStorage.removeItem('app_active_user');
  };

  const resetPassword = async (email: string) => {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    const user = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      const msg = 'આ ઈમેલ આઈડી થી કોઈ વિદ્યાર્થી નોંધાયેલ નથી.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const refreshProfile = async () => {
    if (userProfile) {
      const freshUser = allUsers.find(u => u.userId === userProfile.userId);
      if (freshUser) {
        setUserProfile(freshUser);
        localStorage.setItem('app_active_user', JSON.stringify(freshUser));
      }
    }
  };

  const bootstrapFirstAdmin = async (): Promise<{ success: boolean; message: string }> => {
    if (!userProfile) {
      return { success: false, message: 'પહેલા લોગિન કરો.' };
    }
    const updated = { ...userProfile, role: 'admin' as UserRole };
    setUserProfile(updated);
    localStorage.setItem('app_active_user', JSON.stringify(updated));

    const newList = allUsers.map(u => u.userId === userProfile.userId ? updated : u);
    updateUsersDb(newList);

    return {
      success: true,
      message: 'તમે હવે આ એપના એડમિન (Administrator) છો!'
    };
  };

  // --- Admin User & Password Functions ---
  const adminCreateUser = async (userData: Partial<UserProfile> & { email: string; password?: string; name: string }) => {
    const cleanEmail = userData.email.trim().toLowerCase();
    const existing = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('આ ઈમેલ પહેલેથી જ અસ્તિત્વમાં છે.');
    }

    const newUser: UserProfile = {
      userId: `usr_${Date.now()}`,
      name: userData.name.trim(),
      email: cleanEmail,
      password: userData.password || '123456',
      mobileNumber: userData.mobileNumber || '',
      role: userData.role || 'user',
      groupIds: userData.groupIds || [],
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    updateUsersDb([...allUsers, newUser]);
  };

  const adminUpdateUserPassword = async (userId: string, newPass: string) => {
    const newList = allUsers.map(u => {
      if (u.userId === userId) {
        return { ...u, password: newPass.trim() };
      }
      return u;
    });
    updateUsersDb(newList);

    if (userProfile?.userId === userId) {
      const updated = { ...userProfile, password: newPass.trim() };
      setUserProfile(updated);
      localStorage.setItem('app_active_user', JSON.stringify(updated));
    }
  };

  const adminUpdateUser = async (userId: string, updates: Partial<UserProfile>) => {
    const newList = allUsers.map(u => {
      if (u.userId === userId) {
        return { ...u, ...updates };
      }
      return u;
    });
    updateUsersDb(newList);

    if (userProfile?.userId === userId) {
      const updated = { ...userProfile, ...updates };
      setUserProfile(updated);
      localStorage.setItem('app_active_user', JSON.stringify(updated));
    }
  };

  const adminDeleteUser = async (userId: string) => {
    const newList = allUsers.filter(u => u.userId !== userId);
    updateUsersDb(newList);
  };

  return (
    <AuthContext.Provider
      value={{
        userProfile,
        loading,
        error,
        selectedGroupId,
        setSelectedGroupId,
        login,
        signup,
        logout,
        resetPassword,
        refreshProfile,
        bootstrapFirstAdmin,
        clearError: () => setError(null),
        allUsers,
        adminCreateUser,
        adminUpdateUserPassword,
        adminUpdateUser,
        adminDeleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
