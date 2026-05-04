import { createContext, useContext } from 'react';
import type { User } from '../models/models';

export type UserContextValue = {
  user: User | null;
  loading: boolean;
  fetched: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
};

export const UserContext = createContext<UserContextValue | undefined>(undefined);

export const useUser = (): UserContextValue => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
};
