import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../models/models';
import { fetchMe, logout as apiLogout } from '../api/api';
import { getTokenRole, hasValidAccessToken } from '../api/authToken';
import { UserContext } from './userContextCore';

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => hasValidAccessToken());
  const [fetched, setFetched] = useState(() => !hasValidAccessToken());
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    if (!hasValidAccessToken()) {
      setUser(null);
      setFetched(true);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const me = await fetchMe();
      const role = getTokenRole() ?? 'Customer';
      setUser({ ...me, role });
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err.message : 'Unable to load user');
    } finally {
      setFetched(true);
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    apiLogout();
    setUser(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (fetched || !hasValidAccessToken()) return;

    const timeoutId = window.setTimeout(() => {
      void refreshUser();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetched, refreshUser]);

  return (
    <UserContext.Provider value={{ user, loading, fetched, error, refreshUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};
