import { createContext, useState, useContext, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User { id: number; name: string; email: string; role: string; customer_id: number; }

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (name: string) => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));
  const navigate = useNavigate();

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    navigate('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const updateUser = (name: string) => {
    if (user) {
      const updated = { ...user, name };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  };

  return <AuthContext.Provider value={{ token, user, login, logout, updateUser }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);