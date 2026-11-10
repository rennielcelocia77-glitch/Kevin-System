import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('broom_token')));

  useEffect(() => {
    let active = true;
    const clearSession = () => {
      localStorage.removeItem('broom_token');
      localStorage.removeItem('broom_user');
      if (active) setUser(null);
    };
    window.addEventListener('broom:unauthorized', clearSession);

    if (!localStorage.getItem('broom_token')) {
      setLoading(false);
    } else {
      api.me()
        .then(({ data }) => {
          if (!active) return;
          localStorage.setItem('broom_user', JSON.stringify(data));
          setUser(data);
        })
        .catch(clearSession)
        .finally(() => { if (active) setLoading(false); });
    }

    return () => {
      active = false;
      window.removeEventListener('broom:unauthorized', clearSession);
    };
  }, []);

  async function login(credentials) {
    const { data } = await api.login(credentials);
    localStorage.setItem('broom_token', data.token);
    localStorage.setItem('broom_user', JSON.stringify(data.user));
    setUser(data.user);
  }
  function logout() {
    if (localStorage.getItem('broom_token')) api.logout().catch(() => {});
    localStorage.removeItem('broom_token');
    localStorage.removeItem('broom_user');
    setUser(null);
  }
  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
