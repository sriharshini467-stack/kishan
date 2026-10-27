import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { User, PrimaryRole, SubRole } from '../types';
import { SupportedLanguage } from '../i18n/translations';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (formData: {
    name: string;
    phone: string;
    password: string;
    confirmPassword?: string;
    location: string;
    preferredLanguage: SupportedLanguage;
  }) => Promise<{ success: boolean; error?: string }>;
  selectRole: (primaryRole: PrimaryRole, subRole?: SubRole) => Promise<{ success: boolean; error?: string }>;
  switchRole: (role: PrimaryRole) => Promise<void>;
  updateLanguage: (lang: SupportedLanguage) => Promise<void>;
  logout: () => void;
  quickDemoLogin: (roleType: 'farmer' | 'restaurant' | 'wholesale') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('kisansetu_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('kisansetu_token');
  });

  const [isLoading, setIsLoading] = useState(true);

  // Setup Axios Authorization header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('kisansetu_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('kisansetu_token');
    }
  }, [token]);

  // Sync user with backend profile on mount
  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await axios.get('/api/auth/me');
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('kisansetu_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.warn('Session verification failed, resetting token:', err);
        setUser(null);
        setToken(null);
        localStorage.removeItem('kisansetu_token');
        localStorage.removeItem('kisansetu_user');
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [token]);

  const login = async (phone: string, password: string) => {
    try {
      const res = await axios.post('/api/auth/login', { phone, password });
      const { user: loggedInUser, token: authToken } = res.data;

      setUser(loggedInUser);
      setToken(authToken);
      localStorage.setItem('kisansetu_user', JSON.stringify(loggedInUser));
      localStorage.setItem('kisansetu_token', authToken);

      return { success: true };
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, error: msg };
    }
  };

  const signup = async (formData: {
    name: string;
    phone: string;
    password: string;
    confirmPassword?: string;
    location: string;
    preferredLanguage: SupportedLanguage;
  }) => {
    try {
      const res = await axios.post('/api/auth/signup', formData);
      const { user: newUser, token: authToken } = res.data;

      setUser(newUser);
      setToken(authToken);
      localStorage.setItem('kisansetu_user', JSON.stringify(newUser));
      localStorage.setItem('kisansetu_token', authToken);

      return { success: true };
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Signup failed. Please try again.';
      return { success: false, error: msg };
    }
  };

  const selectRole = async (primaryRole: PrimaryRole, subRole?: SubRole) => {
    try {
      const res = await axios.patch('/api/auth/select-role', { primaryRole, subRole });
      const { user: updatedUser, token: updatedToken } = res.data;

      setUser(updatedUser);
      if (updatedToken) {
        setToken(updatedToken);
        localStorage.setItem('kisansetu_token', updatedToken);
      }
      localStorage.setItem('kisansetu_user', JSON.stringify(updatedUser));

      return { success: true };
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update role';
      return { success: false, error: msg };
    }
  };

  // Switch role for quick testing without logging out
  const switchRole = async (role: PrimaryRole) => {
    if (!user) return;
    const defaultSub = role === 'supplier' ? 'farmer' : 'grocer';
    await selectRole(role, defaultSub);
  };

  const updateLanguage = async (lang: SupportedLanguage) => {
    if (!user) return;
    try {
      const res = await axios.patch('/api/auth/language', { language: lang });
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('kisansetu_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Failed to sync language on server', err);
    }
  };

  const quickDemoLogin = async (roleType: 'farmer' | 'restaurant' | 'wholesale') => {
    let phone = '9876543210'; // Ramesh Patel (Farmer)
    if (roleType === 'restaurant') {
      phone = '9123456780'; // Anita Sharma (Dakshin Bistro)
    } else if (roleType === 'wholesale') {
      phone = '9123456781'; // GreenGrocers Supermarkets
    }
    await login(phone, 'demo123');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('kisansetu_token');
    localStorage.removeItem('kisansetu_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        signup,
        selectRole,
        switchRole,
        updateLanguage,
        logout,
        quickDemoLogin,
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
