import { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('broom_user') || 'null'));
  async function login(credentials) {
    const { data } = await api.login(credentials);
    localStorage.setItem('broom_token', data.token);
    localStorage.setItem('broom_user', JSON.stringify(data.user));
    setUser(data.user);
  }
  function logout() {
    localStorage.removeItem('broom_token');
    localStorage.removeItem('broom_user');
    setUser(null);
  }
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
