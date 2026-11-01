import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.user);
    return data.user;
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('yb_token')) {
      setLoading(false);
      return;
    }
    refreshUser()
      .catch(() => localStorage.removeItem('yb_token'))
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('yb_token', data.token);
    setUser(data.user);
  };

  const register = async (form) => {
    const { data } = await api.post('/auth/register', form);
    localStorage.setItem('yb_token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('yb_token');
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, setUser, loading, login, register, logout, refreshUser, toast }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'error' ? '⚠️' : '✅'} {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
