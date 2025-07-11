import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import LoadingScreen from '../components/LoadingScreen';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const userData = await authService.getCurrentUser();
        if (userData && typeof userData === 'object' && !Array.isArray(userData)) {
          setUser(userData);
          console.log('AuthContext setUser (getCurrentUser):', userData);
        } else {
          setUser(null);
          console.log('AuthContext: No valid user found, setting user to null');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const { token, user: userData } = await authService.login(email, password);
      if (userData && typeof userData === 'object' && !Array.isArray(userData)) {
        setUser(userData);
        console.log('AuthContext setUser (login):', userData);
      } else {
        setUser(null);
        console.log('AuthContext: No valid user data from login, setting user to null');
      }
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password, fullName) => {
    try {
      const { token, user: userData } = await authService.register(email, password, fullName);
      if (userData && typeof userData === 'object' && !Array.isArray(userData)) {
        setUser(userData);
      } else {
        setUser(null);
      }
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null); // Still set user to null even if logout fails
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      if (userData && typeof userData === 'object' && !Array.isArray(userData)) {
        setUser(userData);
        console.log('AuthContext refreshUser:', userData);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    refreshUser,
    loading
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 