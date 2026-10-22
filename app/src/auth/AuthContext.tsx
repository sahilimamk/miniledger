import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { setAuthToken } from '../api/client';
import type { User } from '../api/types';
import { clearSession, loadSession, saveSession } from './storage';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  /** True while the stored session is being restored on launch. */
  restoring: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadSession()
      .then((session) => {
        if (cancelled) return;
        if (session) {
          setAuthToken(session.token);
          setToken(session.token);
          setUser(session.user);
        }
      })
      .catch(() => {
        // A storage failure just means the user signs in again.
      })
      .finally(() => {
        if (!cancelled) setRestoring(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (newToken: string, newUser: User) => {
    setAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
    await saveSession(newToken, newUser);
  }, []);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await clearSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, restoring, login, logout }),
    [token, user, restoring, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
