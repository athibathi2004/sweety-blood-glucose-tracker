import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient, getApiErrorMessage } from '@/services/api';
import { User, ApiResponse, AuthResponseData, LoginFormData, RegisterFormData } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: Omit<RegisterFormData, 'confirmPassword'>) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Verifies current authentication status with backend
  const checkAuth = useCallback(async () => {
    try {
      const response = await apiClient.get<ApiResponse<AuthResponseData>>('/auth/me');
      if (response.data.success && response.data.data?.user) {
        setUser(response.data.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (data: LoginFormData) => {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', data);
      if (response.data.success && response.data.data?.user) {
        setUser(response.data.data.user);
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  };

  const register = async (data: Omit<RegisterFormData, 'confirmPassword'>) => {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/register', data);
      if (response.data.success && response.data.data?.user) {
        setUser(response.data.data.user);
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Clear local state even if logout request encounters network error
    } finally {
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
    refetchUser: checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
