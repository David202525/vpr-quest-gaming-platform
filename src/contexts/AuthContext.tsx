import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, clearToken, getToken, setToken, Child, Parent } from '@/lib/api';

type Role = 'parent' | 'child' | null;

type AuthState = {
  role: Role;
  parent: Parent | null;
  child: Child | null;
  loading: boolean;
  loginParent: (email: string, password: string) => Promise<void>;
  registerParent: (name: string, email: string, password: string) => Promise<void>;
  loginChild: (code: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>(null);
  const [parent, setParent] = useState<Parent | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!getToken()) {
      setRole(null);
      setParent(null);
      setChild(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.me();
      if (data.authorized) {
        setRole(data.role);
        if (data.role === 'parent') {
          setParent(data.user);
          setChild(null);
        } else {
          setChild(data.user);
          setParent(null);
        }
      } else {
        clearToken();
        setRole(null);
      }
    } catch {
      clearToken();
      setRole(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const apply = (data: { token: string; role: Role; user: Parent & Child }) => {
    setToken(data.token);
    setRole(data.role);
    if (data.role === 'parent') {
      setParent(data.user);
      setChild(null);
    } else {
      setChild(data.user);
      setParent(null);
    }
  };

  const loginParent = async (email: string, password: string) => {
    apply(await api.login({ email, password }));
  };

  const registerParent = async (name: string, email: string, password: string) => {
    apply(await api.register({ name, email, password }));
  };

  const loginChild = async (code: string, pin: string) => {
    apply(await api.childLogin({ code, pin }));
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      /* no-op */
    }
    clearToken();
    setRole(null);
    setParent(null);
    setChild(null);
  };

  return (
    <AuthContext.Provider
      value={{ role, parent, child, loading, loginParent, registerParent, loginChild, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
