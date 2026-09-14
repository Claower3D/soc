import React, { createContext, useContext, useState, useEffect } from 'react';
import { currentUser as defaultCurrentUser, type User, type UserRole, type BeliefPrivacy } from '../data/mock';

export interface RegisteredAccount {
  id: string;
  name: string;
  username: string;
  emailOrPhone: string;
  password?: string;
  avatar: string;
  coverImage?: string;
  bio?: string;
  website?: string;
  location?: string;
  role: UserRole;
  beliefType: string;
  beliefPrivacy: BeliefPrivacy;
  verified?: boolean;
  followersCount: number;
  followingCount: number;
  criticsCount: number;
  postsCount: number;
  createdAt: string;
}

interface AuthContextType {
  currentUser: User;
  isAuthenticated: boolean;
  allAccounts: RegisteredAccount[];
  login: (emailOrUsername: string, password?: string) => { success: boolean; message?: string };
  register: (data: {
    name: string;
    username: string;
    emailOrPhone: string;
    password?: string;
    role: UserRole;
    beliefType: string;
    beliefPrivacy: BeliefPrivacy;
    avatar?: string;
  }) => { success: boolean; message?: string };
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const STORAGE_KEY_USER = 'new_age_current_user';
const STORAGE_KEY_ACCOUNTS = 'new_age_registered_accounts';

const defaultDemoAccount: RegisteredAccount = {
  id: 'me',
  name: defaultCurrentUser.name,
  username: defaultCurrentUser.username,
  emailOrPhone: 'alex@newage.com',
  avatar: defaultCurrentUser.avatar,
  coverImage: defaultCurrentUser.coverImage,
  bio: defaultCurrentUser.bio,
  website: defaultCurrentUser.website,
  location: defaultCurrentUser.location,
  role: defaultCurrentUser.role || 'creator',
  beliefType: defaultCurrentUser.beliefType || 'Агностицизм',
  beliefPrivacy: defaultCurrentUser.beliefPrivacy || 'public',
  verified: defaultCurrentUser.verified,
  followersCount: defaultCurrentUser.followersCount,
  followingCount: defaultCurrentUser.followingCount,
  criticsCount: defaultCurrentUser.criticsCount || 148,
  postsCount: defaultCurrentUser.postsCount,
  createdAt: new Date().toISOString()
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Load registered accounts from localStorage or seed with default
  const [allAccounts, setAllAccounts] = useState<RegisteredAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [defaultDemoAccount];
  });

  // 2. Load active user
  const [activeUser, setActiveUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(defaultCurrentUser, parsed);
        return parsed;
      }
    } catch {
      // ignore
    }
    return defaultCurrentUser;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('new_age_is_auth') !== 'false';
  });

  // Keep localStorage and mock defaultCurrentUser in sync
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(allAccounts));
  }, [allAccounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(activeUser));
    localStorage.setItem('new_age_is_auth', isAuthenticated ? 'true' : 'false');
    Object.assign(defaultCurrentUser, activeUser);
  }, [activeUser, isAuthenticated]);

  const register = (data: {
    name: string;
    username: string;
    emailOrPhone: string;
    password?: string;
    role: UserRole;
    beliefType: string;
    beliefPrivacy: BeliefPrivacy;
    avatar?: string;
  }) => {
    const cleanUsername = data.username.replace(/^@/, '').trim().toLowerCase();
    
    // Check if username already exists
    const exists = allAccounts.some(
      a => a.username.toLowerCase() === cleanUsername || 
           a.emailOrPhone.toLowerCase() === data.emailOrPhone.trim().toLowerCase()
    );

    if (exists) {
      return { success: false, message: 'Пользователь с таким никнеймом или email/телефоном уже существует' };
    }

    const newId = 'user_' + Date.now();
    const defaultAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
    ];
    const avatar = data.avatar || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const newAccount: RegisteredAccount = {
      id: newId,
      name: data.name.trim(),
      username: cleanUsername,
      emailOrPhone: data.emailOrPhone.trim(),
      password: data.password,
      avatar,
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      bio: 'Новый участник экосистемы New Age ✨',
      role: data.role,
      beliefType: data.beliefType,
      beliefPrivacy: data.beliefPrivacy,
      verified: false,
      followersCount: 1,
      followingCount: 0,
      criticsCount: 0,
      postsCount: 0,
      createdAt: new Date().toISOString()
    };

    setAllAccounts(prev => [newAccount, ...prev]);
    setActiveUser(newAccount);
    setIsAuthenticated(true);

    return { success: true };
  };

  const login = (emailOrUsername: string, password?: string) => {
    const query = emailOrUsername.trim().toLowerCase().replace(/^@/, '');
    const account = allAccounts.find(
      a => a.username.toLowerCase() === query || a.emailOrPhone.toLowerCase() === query
    );

    if (!account) {
      // If not found, log into current active user for demo flexibility or create session
      return { success: false, message: 'Пользователь не найден. Проверьте логин или зарегистрируйтесь.' };
    }

    if (account.password && password && account.password !== password) {
      return { success: false, message: 'Неверный пароль' };
    }

    setActiveUser(account);
    setIsAuthenticated(true);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const updateProfile = (data: Partial<User>) => {
    setActiveUser(prev => {
      const updated = { ...prev, ...data };
      setAllAccounts(accounts => 
        accounts.map(acc => acc.id === updated.id ? { ...acc, ...data } : acc)
      );
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{
      currentUser: activeUser,
      isAuthenticated,
      allAccounts,
      login,
      register,
      logout,
      updateProfile
    }}>
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
