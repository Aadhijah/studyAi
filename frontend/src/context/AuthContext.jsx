import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// ✅ Set base URL once (IMPORTANT FIX)
axios.defaults.baseURL = 'http://localhost:5000';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // ✅ Attach token
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // ✅ This will now call: http://localhost:5000/api/auth/me
      axios.get('/api/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setLoading(false));

    } else {
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
    }
  }, [token]);

  const login = (token, userData) => {
    localStorage.setItem('token', token);

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');

    delete axios.defaults.headers.common['Authorization'];

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isLoggedIn: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}