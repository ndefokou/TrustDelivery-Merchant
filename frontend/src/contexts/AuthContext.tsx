import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Merchant, RegisterRequest, LoginRequest } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  user: Merchant | null;
  isAuthenticated: boolean;
  isActive: boolean;
  loading: boolean;
  register: (data: RegisterRequest) => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if there's a stored token and validate it
  useEffect(() => {
    const initAuth = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const merchant = await api.getCurrentUser();
          api.setMerchantId(merchant.id);
          setUser(merchant);
        } catch {
          // Token is invalid or expired
          api.removeToken();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const register = async (data: RegisterRequest) => {
    const response = await api.register(data);
    api.setToken(response.token);
    api.setMerchantId(response.merchant.id);
    setUser(response.merchant);
  };

  const login = async (data: LoginRequest) => {
    const response = await api.login(data);
    api.setToken(response.token);
    api.setMerchantId(response.merchant.id);
    setUser(response.merchant);
  };

  const logout = () => {
    api.removeToken();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const merchant = await api.getCurrentUser();
      api.setMerchantId(merchant.id);
      setUser(merchant);
    } catch {
      // Token is invalid or expired
      api.removeToken();
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isActive: !!user && user.status === 'active',
    loading,
    register,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
