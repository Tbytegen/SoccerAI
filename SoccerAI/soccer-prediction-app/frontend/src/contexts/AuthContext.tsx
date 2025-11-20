import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, userAPI } from '../services/api';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  preferences: {
    favoriteTeams: string[];
    notifications: boolean;
    theme: 'light' | 'dark';
  };
  subscription: {
    type: 'free' | 'premium';
    expiresAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on app load
  const checkAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Verify token and get user data
      const response = await userAPI.getProfile();
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      
      const { token, user: userData } = response.data;
      
      // Store token
      localStorage.setItem('auth_token', token);
      setUser(userData);
      
      toast.success(`Welcome back, ${userData.firstName}!`);
    } catch (error: any) {
      console.error('Login failed:', error);
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(data);
      
      const { token, user: userData } = response.data;
      
      // Store token
      localStorage.setItem('auth_token', token);
      setUser(userData);
      
      toast.success(`Welcome, ${userData.firstName}! Your account has been created.`);
    } catch (error: any) {
      console.error('Registration failed:', error);
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    try {
      localStorage.removeItem('auth_token');
      setUser(null);
      toast.success('You have been logged out successfully.');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout. Please try again.');
    }
  };

  // Update user data
  const updateUser = async (updates: Partial<User>) => {
    try {
      setLoading(true);
      const response = await userAPI.updateProfile(updates);
      setUser(response.data);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Profile update failed:', error);
      const message = error.response?.data?.message || 'Failed to update profile.';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const response = await authAPI.refreshToken();
      const { token } = response.data;
      localStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000;
      const now = Date.now();
      const timeUntilRefresh = expiresAt - now - 60000; // Refresh 1 minute before expiration

      if (timeUntilRefresh > 0) {
        const timeoutId = setTimeout(() => {
          refreshToken();
        }, timeUntilRefresh);

        return () => clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuthStatus,
    updateUser,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};