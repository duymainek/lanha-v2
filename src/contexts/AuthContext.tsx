import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { User as AppUser } from '../data/types';

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on initial mount
    setIsLoading(true);
    try {
      const storedUser = localStorage.getItem('laNhaUser');
      if (storedUser) {
        const parsedUser: AppUser = JSON.parse(storedUser);
        // Basic validation
        if (parsedUser && parsedUser.id && parsedUser.email) {
          setUser(parsedUser);
        } else {
          localStorage.removeItem('laNhaUser'); // Clear invalid stored user
        }
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage on init:", e);
      localStorage.removeItem('laNhaUser');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock authentication: Replace with your actual auth logic if not using Supabase
    if (email === 'admin@lanha.com' && password === 'password') {
      const mockUser: AppUser = {
        id: 'mock-admin-001',
        email: email,
        name: 'Default Admin',
        role: 'Admin',
      };
      setUser(mockUser);
      localStorage.setItem('laNhaUser', JSON.stringify(mockUser));
      setIsLoading(false);
      return { error: null };
    } else {
      setIsLoading(false);
      return { error: new Error('Invalid email or password.') };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    setUser(null);
    localStorage.removeItem('laNhaUser');
    setIsLoading(false);
  };
  
  const value = useMemo(() => ({ 
    user, 
    isLoading, 
    login, 
    logout,
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};