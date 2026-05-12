import type { ReactNode } from 'react';
import type { User } from '../models/models';
import { useUser } from '../contexts/userContextCore';
import { useTheme } from '../contexts/themeContextCore';
import Sidebar from './Sidebar';

type DashboardShellProps = {
  user: User;
  children: ReactNode;
};

const DashboardShell = ({ user, children }: DashboardShellProps) => {
  const { logout } = useUser();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="dashboard-shell">
      <Sidebar user={user} currentTheme={theme} onThemeToggle={toggleTheme} onLogout={logout} />
      <main className="dashboard-main">
        <section className="dashboard-content">{children}</section>
      </main>
    </div>
  );
};

export default DashboardShell;
