import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getAppointmentsByCustomer, getMySales } from '../../api/api';
import { useUser } from '../../contexts/userContextCore';
import {
  AppointmentStatus,
  VehicleType,
  appointmentStatusLabel,
  type Appointment,
  type PartSale,
} from '../../models/models';

type Tab = 'purchases' | 'services';

const appointmentBadge = (s: AppointmentStatus): string => {
  switch (s) {
    case AppointmentStatus.Pending:
      return 'badge badge-warning';
    case AppointmentStatus.Confirmed:
      return 'badge badge-info';
    case AppointmentStatus.Completed:
      return 'badge badge-success';
    case AppointmentStatus.Cancelled:
      return 'badge badge-neutral';
    default:
      return 'badge badge-neutral';
  }
};

const MyHistoryPage = () => {
  const { user } = useUser();
  const customerId = user?.userId ?? '';
  const [sales, setSales] = useState<PartSale[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('purchases');

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const [s, a] = await Promise.all([getMySales(), getAppointmentsByCustomer(customerId)]);
      setSales(s);
      setAppointments(a);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalSpent = sales.reduce((s, sale) => s + sale.finalAmount, 0);
  const pendingCredit = sales
    .filter((s) => s.isCredit && !s.isPaid)
    .reduce((s, sale) => s + sale.finalAmount, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>My History</h1>
        <p>Everything you've bought and every service you've booked.</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <p className="metric-label">Total spent</p>
          <p className="metric-value">NPR {totalSpent.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Purchases</p>
          <p className="metric-value">{sales.length}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Outstanding credit</p>
          <p className="metric-value">NPR {pendingCredit.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Services</p>
          <p className="metric-value">{appointments.length}</p>
        </div>
      </div>

      <div className="tab-bar">
        <button
          type="button"
          className={`tab${tab === 'purchases' ? ' active' : ''}`}
          onClick={() => setTab('purchases')}
        >
          Purchases
        </button>
        <button
          type="button"
          className={`tab${tab === 'services' ? ' active' : ''}`}
          onClick={() => setTab('services')}
        >
          Services
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading history...</div>
      ) : tab === 'purchases' ? (
        sales.length === 0 ? (
          <div className="empty-state">No purchases yet.</div>
        ) : (
          sales.map((s) => (
            <div key={s.saleId} className="card">
              <div className="row-spread">
                <div>
                  <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                    {new Date(s.saleDate).toLocaleString()}
                  </p>
                  <h3 style={{ margin: '4px 0 0', fontSize: 16 }}>
                    {s.items.length} item{s.items.length !== 1 ? 's' : ''} · NPR {s.finalAmount.toLocaleString()}
                  </h3>
                </div>
                <div>
                  {s.isCredit ? (
                    s.isPaid ? (
                      <span className="badge badge-success">Credit · Paid</span>
                    ) : (
                      <span className="badge badge-warning">Credit · Unpaid</span>
                    )
                  ) : (
                    <span className="badge badge-info">Paid</span>
                  )}
                </div>
              </div>
              <div className="table-wrap" style={{ marginTop: 12 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Part</th>
                      <th>Qty</th>
                      <th>Unit (NPR)</th>
                      <th>Total (NPR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.items.map((it) => (
                      <tr key={it.saleItemId}>
                        <td>{it.partName}</td>
                        <td>{it.quantity}</td>
                        <td>{it.unitPrice.toLocaleString()}</td>
                        <td>{it.totalPrice.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {s.discountAmount > 0 && (
                <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                  Loyalty discount applied: NPR {s.discountAmount.toLocaleString()}
                </p>
              )}
            </div>
          ))
        )
      ) : appointments.length === 0 ? (
        <div className="empty-state">No service bookings yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Vehicle type</th>
                <th>Notes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.appointmentId}>
                  <td>{new Date(a.appointmentDate).toLocaleString()}</td>
                  <td>{VehicleType[a.vehicleType]}</td>
                  <td>{a.notes ?? '—'}</td>
                  <td>
                    <span className={appointmentBadge(a.status)}>{appointmentStatusLabel(a.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyHistoryPage;
