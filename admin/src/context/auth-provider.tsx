import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role?: 'admin' | 'owner';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  role: 'admin' | 'owner' | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const role = localStorage.getItem('user_role');
      const endpoint = role === 'owner' ? '/api/owners/me' : '/api/auth/me';
      
      api.get(endpoint)
        .then((response) => {
          setUser({ ...response.data, role: role || 'admin' });
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user_role', newUser.role || 'admin');
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    setToken(null);
    setUser(null);
  };

  const role = user?.role || (token ? (localStorage.getItem('user_role') as any) : null);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
