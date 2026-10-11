import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('apex_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('apex_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyUser() {
      const storedToken = localStorage.getItem('apex_token');
      if (storedToken) {
        try {
          const res = await api.auth.getMe();
          setUser(res.user);
          localStorage.setItem('apex_user', JSON.stringify(res.user));
        } catch (err) {
          console.warn('Session expired or invalid token:', err.message);
          logout();
        }
      }
      setLoading(false);
    }
    verifyUser();
  }, []);

  const login = async (username, password) => {
    const res = await api.auth.login(username, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('apex_token', res.token);
    localStorage.setItem('apex_user', JSON.stringify(res.user));
    return res.user;
  };

  const quickDemoLogin = async (username) => {
    return login(username, 'password123');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('apex_token');
    localStorage.removeItem('apex_user');
  };

  const hasRole = (...allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, quickDemoLogin, logout, hasRole }}>
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
