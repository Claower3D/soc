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
  jwtToken: string | null;
  allAccounts: RegisteredAccount[];
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (emailOrUsername: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: {
    name: string;
    username: string;
    emailOrPhone: string;
    password?: string;
    role: UserRole;
    beliefType: string;
    beliefPrivacy: BeliefPrivacy;
    avatar?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const STORAGE_KEY_USER = 'new_age_current_user';
const STORAGE_KEY_ACCOUNTS = 'new_age_registered_accounts';
const STORAGE_KEY_TOKEN = 'new_age_jwt_token';

export const GUEST_USER: User = {
  id: 'guest',
  name: 'Гость',
  username: 'guest',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
  coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  bio: 'Гостевой просмотр New Age. Войдите или зарегистрируйтесь, чтобы создать профиль, публиковать контент и общаться.',
  website: '',
  location: 'Планета Земля',
  online: false,
  followersCount: 0,
  followingCount: 0,
  criticsCount: 0,
  postsCount: 0,
  role: 'user',
  beliefType: 'Не указано',
  beliefPrivacy: 'private',
  verified: false,
};

const defaultDemoAccount: RegisteredAccount = {
  id: 'me',
  name: defaultCurrentUser.name,
  username: defaultCurrentUser.username,
  emailOrPhone: 'alex@newage.com',
  password: 'password123',
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
  createdAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const [jwtToken, setJwtToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem(STORAGE_KEY_TOKEN) || localStorage.getItem('new_age_is_auth') === 'true';
  });

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

  const [activeUser, setActiveUser] = useState<User>(() => {
    const isAuth = !!localStorage.getItem(STORAGE_KEY_TOKEN) || localStorage.getItem('new_age_is_auth') === 'true';
    if (!isAuth) {
      return GUEST_USER;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id !== 'guest') {
          Object.assign(defaultCurrentUser, parsed);
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return defaultDemoAccount;
  });

  // Verify JWT session with Go backend on mount
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (!token) return;

    fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Token expired or invalid');
        }
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setActiveUser(data.user);
          setIsAuthenticated(true);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
          localStorage.setItem('new_age_is_auth', 'true');
        }
      })
      .catch((err) => {
        console.warn('Backend session verification note:', err.message);
        // If server is not responding, keep local user state if valid
      });
  }, []);

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(allAccounts));
  }, [allAccounts]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(activeUser));
      localStorage.setItem('new_age_is_auth', 'true');
      if (jwtToken) {
        localStorage.setItem(STORAGE_KEY_TOKEN, jwtToken);
      }
      Object.assign(defaultCurrentUser, activeUser);
    } else {
      localStorage.setItem('new_age_is_auth', 'false');
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  }, [activeUser, isAuthenticated, jwtToken]);

  // Real Register with Go JWT backend & local fallback
  const register = async (data: {
    name: string;
    username: string;
    emailOrPhone: string;
    password?: string;
    role: UserRole;
    beliefType: string;
    beliefPrivacy: BeliefPrivacy;
    avatar?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const cleanUsername = data.username.replace(/^@/, '').trim().toLowerCase();

    // Try Go Backend registration
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          username: cleanUsername,
          emailOrPhone: data.emailOrPhone.trim(),
          password: data.password || '',
          role: data.role,
          beliefType: data.beliefType,
          beliefPrivacy: data.beliefPrivacy,
          avatar: data.avatar || '',
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        return { success: false, message: resData.error || 'Ошибка при регистрации' };
      }

      const user: User = resData.user;
      const token: string = resData.token;

      setJwtToken(token);
      setActiveUser(user);
      setIsAuthenticated(true);
      setAllAccounts((prev) => [
        {
          ...user,
          emailOrPhone: data.emailOrPhone.trim(),
          password: data.password,
          createdAt: new Date().toISOString(),
        } as RegisteredAccount,
        ...prev,
      ]);

      return { success: true };
    } catch (err) {
      console.warn('Backend offline, proceeding with secure local registration fallback', err);

      // Local Fallback
      const exists = allAccounts.some(
        (a) =>
          a.username.toLowerCase() === cleanUsername ||
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
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
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
        createdAt: new Date().toISOString(),
      };

      setAllAccounts((prev) => [newAccount, ...prev]);
      setActiveUser(newAccount);
      setIsAuthenticated(true);
      return { success: true };
    }
  };

  // Real Login with Go JWT backend & local fallback
  const login = async (
    emailOrUsername: string,
    password?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const query = emailOrUsername.trim().toLowerCase().replace(/^@/, '');

    // Try Go Backend login
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: query,
          password: password || '',
        }),
      });

      const resData = await response.json();

      if (response.ok && resData.token) {
        setJwtToken(resData.token);
        setActiveUser(resData.user);
        setIsAuthenticated(true);
        return { success: true };
      }

      if (!response.ok && resData.error && !resData.error.includes('Failed to fetch')) {
        return { success: false, message: resData.error };
      }
    } catch (err) {
      console.warn('Backend login fallback to local credentials', err);
    }

    // Local Fallback
    const account = allAccounts.find(
      (a) => a.username.toLowerCase() === query || a.emailOrPhone.toLowerCase() === query
    );

    if (!account) {
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
    setJwtToken(null);
    setActiveUser(GUEST_USER);
    setIsAuthenticated(false);
  };

  const updateProfile = (data: Partial<User>) => {
    setActiveUser((prev) => {
      const updated = { ...prev, ...data };
      setAllAccounts((accounts) =>
        accounts.map((acc) => (acc.id === updated.id ? { ...acc, ...data } : acc))
      );
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser: activeUser,
        isAuthenticated,
        jwtToken,
        allAccounts,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        updateProfile,
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
