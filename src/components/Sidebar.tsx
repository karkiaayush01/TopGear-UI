import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Box,
  Calendar,
  ClipboardList,
  FileText,
  History,
  Home,
  LogOut,
  Moon,
  ShoppingCart,
  Star,
  Sun,
  Truck,
  User as UserIcon,
  Users,
  UsersRound,
  Wrench,
} from 'lucide-react';
import type { User, UserRole } from '../models/models';

type SidebarProps = {
  user: User;
  currentTheme: 'light' | 'dark';
  onThemeToggle: () => void;
  onLogout: () => Promise<void>;
};

type NavItem = { label: string; path: string; icon: LucideIcon };

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  Admin: [
    { label: 'Dashboard', path: '/home', icon: Home },
    { label: 'Inventory', path: '/home/inventory', icon: Box },
    { label: 'Vendors', path: '/home/vendors', icon: Truck },
    { label: 'Purchase Invoices', path: '/home/purchase-invoices', icon: FileText },
    { label: 'Staff', path: '/home/staff', icon: UsersRound },
    { label: 'Part Requests', path: '/home/part-requests', icon: ClipboardList },
    { label: 'Reports', path: '/home/reports', icon: BarChart3 },
  ],
  Staff: [
    { label: 'Dashboard', path: '/home', icon: Home },
    { label: 'Customers', path: '/home/customers', icon: Users },
    { label: 'Inventory', path: '/home/inventory', icon: Box },
    { label: 'New Sale', path: '/home/sales/new', icon: ShoppingCart },
    { label: 'Sales', path: '/home/sales', icon: ClipboardList },
    { label: 'Appointments', path: '/home/appointments', icon: Calendar },
    { label: 'Reports', path: '/home/reports', icon: BarChart3 },
  ],
  Customer: [
    { label: 'Dashboard', path: '/home', icon: Home },
    { label: 'Browse Parts', path: '/home/parts', icon: Box },
    { label: 'My Vehicles', path: '/home/vehicles', icon: Wrench },
    { label: 'Appointments', path: '/home/appointments', icon: Calendar },
    { label: 'Part Requests', path: '/home/part-requests', icon: ClipboardList },
    { label: 'Reviews', path: '/home/reviews', icon: Star },
    { label: 'History', path: '/home/history', icon: History },
    { label: 'Profile', path: '/home/profile', icon: UserIcon },
  ],
};

const Sidebar = ({ user, currentTheme, onThemeToggle, onLogout }: SidebarProps) => {
  const location = useLocation();
  const navItems = NAV_BY_ROLE[user.role] ?? [];

  const isActivePath = (path: string): boolean => {
    if (path === '/home') return location.pathname === '/home' || location.pathname === '/home/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar-brand">
        <img src="/logo/TopGearInitials.png" alt="TopGear" />
        <div>
          <p className="sidebar-brand-label">TopGear</p>
          <p className="sidebar-brand-copy">{user.role}</p>
        </div>
      </div>

      <div className="sidebar-block">
        <p className="sidebar-section-label">Navigation</p>
        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          {navItems.map((item) => {
            const isActive = isActivePath(item.path);
            const linkClass = `sidebar-nav-link${isActive ? ' active' : ''}`;
            return (
              <Link key={item.path} to={item.path} className={linkClass} aria-current={isActive ? 'page' : undefined}>
                <span className="nav-icon" aria-hidden="true">
                  <item.icon size={18} />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-block sidebar-footer">
        <button type="button" className="sidebar-toggle" onClick={onThemeToggle}>
          <span aria-hidden="true">
            {currentTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </span>
          <span>{currentTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>

        <div className="sidebar-user-panel">
          <div className="sidebar-avatar" aria-hidden="true">{user.fullName.charAt(0)}</div>
          <div>
            <p className="sidebar-user-name">{user.fullName}</p>
            <p className="sidebar-user-email">{user.email}</p>
          </div>
        </div>

        <button type="button" className="sidebar-logout" onClick={onLogout}>
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
