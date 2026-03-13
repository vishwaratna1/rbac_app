import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api, { setTokenGetter } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTokenGetter(() => token);
  }, [token]);

  // restore session on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('token');
    if (!saved) {
      setLoading(false);
      return;
    }
    api.get('/api/auth/me', { headers: { Authorization: `Bearer ${saved}` } })
      .then(res => {
        setToken(saved);
        setUser(res.data);
        setPermissions(res.data.permissions);
      })
      .catch(() => {
        sessionStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (userId, password) => {
    const res = await api.post('/api/auth/login', { user_id: userId, password });
    const accessToken = res.data.access_token;
    sessionStorage.setItem('token', accessToken);
    setToken(accessToken);

    const meRes = await api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    setUser(meRes.data);
    setPermissions(meRes.data.permissions);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setPermissions([]);
  }, []);

  const hasPermission = useCallback((resource, action) => {
    return permissions.some(p => p.resource === resource && p.action === action);
  }, [permissions]);

  const getScope = useCallback((resource, action) => {
    const p = permissions.find(p => p.resource === resource && p.action === action);
    return p ? p.scope : null;
  }, [permissions]);

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ token, user, login, logout, hasPermission, getScope }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
