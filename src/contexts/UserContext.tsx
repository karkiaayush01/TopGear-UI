import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../models/models';
import { fetchMe } from '../api/api';
import { hasValidAccessToken } from '../api/authToken';
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
      const currentUser = await fetchMe();
      setUser(currentUser);
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err.message : 'Unable to load user');
    } finally {
      setFetched(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetched || !hasValidAccessToken()) return;

    const timeoutId = window.setTimeout(() => {
      void refreshUser();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetched, refreshUser]);

  return (
    <UserContext.Provider value={{ user, loading, fetched, error, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};
