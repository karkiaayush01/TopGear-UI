import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getAllAppointments,
  getAllPartRequests,
  getAllSales,
  getAppointmentsByCustomer,
  getFinancialReport,
  getMyPartRequests,
  getMySales,
  getPendingCredits,
  getPurchaseInvoiceReport,
  searchParts,
} from '../api/api';
import type { User } from '../models/models';
import { AppointmentStatus, PartRequestStatus } from '../models/models';

type HomePageProps = {
  user: User;
};

type AdminStats = {
  revenue: number;
  totalSales: number;
  totalPurchases: number;
  lowStockCount: number;
  pendingPartRequests: number;
  pendingCreditsCount: number;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [financial, purchase, parts, requests, credits] = await Promise.all([
          getFinancialReport({ period: 'monthly' }),
          getPurchaseInvoiceReport({}),
          searchParts({ maxQuantity: 9, limit: 200 }),
          getAllPartRequests(),
          getPendingCredits(),
        ]);
        setStats({
          revenue: financial.totalRevenue,
          totalSales: financial.totalSales,
          totalPurchases: purchase.totalAmountSpent,
          lowStockCount: parts.items.length,
          pendingPartRequests: requests.filter((r) => r.status === PartRequestStatus.Pending).length,
          pendingCreditsCount: credits.length,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!stats) return <div className="empty-state">Dashboard unavailable.</div>;

  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <p className="metric-label">Revenue</p>
        <p className="metric-value">NPR {stats.revenue.toLocaleString()}</p>
        <p className="metric-sub">All time</p>
      </div>
      <div className="metric-card">
        <p className="metric-label">Sales</p>
        <p className="metric-value">{stats.totalSales}</p>
        <p className="metric-sub">Total transactions</p>
      </div>
      <div className="metric-card">
        <p className="metric-label">Purchases spend</p>
        <p className="metric-value">NPR {stats.totalPurchases.toLocaleString()}</p>
        <p className="metric-sub">Vendor invoices</p>
      </div>
      <div className="metric-card">
        <p className="metric-label">Low stock parts</p>
        <p className="metric-value">{stats.lowStockCount}</p>
        <p className="metric-sub">Stock &lt; 10</p>
      </div>
      <div className="metric-card">
        <p className="metric-label">Pending part requests</p>
        <p className="metric-value">{stats.pendingPartRequests}</p>
      </div>
      <div className="metric-card">
        <p className="metric-label">Pending credits</p>
        <p className="metric-value">{stats.pendingCreditsCount}</p>
        <p className="metric-sub">Customers owing</p>
      </div>
    </div>
  );
};

type StaffStats = {
  todaySales: number;
  todayRevenue: number;
  unpaidCredits: number;
  unpaidCreditAmount: number;
  upcomingAppointments: number;
};

const StaffDashboard = () => {
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sales, appointments] = await Promise.all([
          getAllSales(),
          getAllAppointments(),
        ]);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySales = sales.filter((s) => new Date(s.saleDate) >= today);
        const unpaid = sales.filter((s) => s.isCredit && !s.isPaid);
        const upcoming = appointments.filter(
          (a) =>
            new Date(a.appointmentDate).getTime() >= Date.now() &&
            a.status !== AppointmentStatus.Cancelled,
        );
        setStats({
          todaySales: todaySales.length,
          todayRevenue: todaySales.reduce((s, sale) => s + sale.finalAmount, 0),
          unpaidCredits: unpaid.length,
          unpaidCreditAmount: unpaid.reduce((s, sale) => s + sale.finalAmount, 0),
          upcomingAppointments: upcoming.length,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!stats) return <div className="empty-state">Dashboard unavailable.</div>;

  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <p className="metric-label">Sales today</p>
        <p className="metric-value">{stats.todaySales}</p>
      </div>
      <div className="metric-card">
        <p className="metric-label">Revenue today</p>
        <p className="metric-value">NPR {stats.todayRevenue.toLocaleString()}</p>
      </div>
      <div className="metric-card">
        <p className="metric-label">Unpaid credits</p>
        <p className="metric-value">{stats.unpaidCredits}</p>
        <p className="metric-sub">NPR {stats.unpaidCreditAmount.toLocaleString()} outstanding</p>
      </div>
      <div className="metric-card">
        <p className="metric-label">Upcoming appointments</p>
        <p className="metric-value">{stats.upcomingAppointments}</p>
      </div>
    </div>
  );
};

type CustomerStats = {
  purchases: number;
  totalSpent: number;
  upcomingAppointments: number;
  pendingPartRequests: number;
  outstandingCredit: number;
};

const CustomerDashboard = ({ customerId }: { customerId: string }) => {
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;
    const load = async () => {
      try {
        const [sales, appointments, requests] = await Promise.all([
          getMySales(),
          getAppointmentsByCustomer(customerId),
          getMyPartRequests(),
        ]);
        const upcoming = appointments.filter(
          (a) =>
            new Date(a.appointmentDate).getTime() >= Date.now() &&
            a.status !== AppointmentStatus.Cancelled,
        );
        setStats({
          purchases: sales.length,
          totalSpent: sales.reduce((s, sale) => s + sale.finalAmount, 0),
          upcomingAppointments: upcoming.length,
          pendingPartRequests: requests.filter(
            (r) => r.status === PartRequestStatus.Pending || r.status === PartRequestStatus.Reviewed,
          ).length,
          outstandingCredit: sales
            .filter((s) => s.isCredit && !s.isPaid)
            .reduce((s, sale) => s + sale.finalAmount, 0),
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [customerId]);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!stats) return <div className="empty-state">Dashboard unavailable.</div>;

  return (
    <>
      <div className="metrics-grid">
        <div className="metric-card">
          <p className="metric-label">Total spent</p>
          <p className="metric-value">NPR {stats.totalSpent.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Purchases</p>
          <p className="metric-value">{stats.purchases}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Upcoming appointments</p>
          <p className="metric-value">{stats.upcomingAppointments}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Open part requests</p>
          <p className="metric-value">{stats.pendingPartRequests}</p>
        </div>
        {stats.outstandingCredit > 0 && (
          <div className="metric-card">
            <p className="metric-label">Outstanding credit</p>
            <p className="metric-value">NPR {stats.outstandingCredit.toLocaleString()}</p>
            <p className="metric-sub">Please settle to avoid reminders</p>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="card-title">Quick actions</h2>
        <div className="table-actions" style={{ flexWrap: 'wrap' }}>
          <Link to="/home/parts" className="btn btn-primary">Browse parts</Link>
          <Link to="/home/appointments" className="btn btn-ghost">Book service</Link>
          <Link to="/home/part-requests" className="btn btn-ghost">Request a part</Link>
          <Link to="/home/vehicles" className="btn btn-ghost">My vehicles</Link>
        </div>
      </div>
    </>
  );
};

const HomePage = ({ user }: HomePageProps) => {
  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Dashboard</p>
        <h1>Welcome, {user.fullName}</h1>
        <p>{user.role === 'Admin'
          ? 'Operational overview across inventory, sales, and customers.'
          : user.role === 'Staff'
            ? 'Manage customers, sales, and appointments.'
            : 'Browse parts, book services, and track your purchases.'}</p>
      </div>

      {user.role === 'Admin' && <AdminDashboard />}
      {user.role === 'Staff' && <StaffDashboard />}
      {user.role === 'Customer' && <CustomerDashboard customerId={user.userId} />}
    </div>
  );
};

export default HomePage;
