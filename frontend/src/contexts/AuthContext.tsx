import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, type UserInfo } from '../lib/api';

interface AuthContextType {
  user: UserInfo | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
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
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const userInfo = await apiClient.getUserInfo();
      setUser(userInfo);
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    window.location.href = '/auth/login';
  };

  const logout = () => {
    // Get session hint from cookie if available
    const sessionHint = document.cookie
      .split('; ')
      .find(row => row.startsWith('session_hint='))
      ?.split('=')[1];
    
    const logoutUrl = sessionHint 
      ? `/auth/logout?session_hint=${sessionHint}`
      : '/auth/logout';
    
    window.location.href = logoutUrl;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">MenuGen</h1>
            <p className="text-gray-600 mb-6">AI-Powered Menu Visualization</p>
            <p className="text-gray-700 mb-6">Please sign in to continue</p>
            <button
              onClick={login}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
