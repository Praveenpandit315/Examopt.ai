// client/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('examopt_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('examopt_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.auth.getMe()
        .then(res => {
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('examopt_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password, role) => {
    const res = await api.auth.login({ email, password, role });
    localStorage.setItem('examopt_token', res.token);
    localStorage.setItem('examopt_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const loginWithFirebase = async (idToken, role) => {
    const res = await api.auth.firebaseLogin({ idToken, role });
    localStorage.setItem('examopt_token', res.token);
    localStorage.setItem('examopt_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('examopt_token');
    localStorage.removeItem('examopt_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      loginWithFirebase, 
      logout, 
      loading, 
      isAuthenticated: !!user, 
      isAdmin: user?.role === 'admin', 
      isStudent: user?.role === 'student' 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
