import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cancelAppointment, getAllAppointments, updateAppointment } from '../../api/api';
import {
  AppointmentStatus,
  VehicleType,
  appointmentStatusLabel,
  type Appointment,
} from '../../models/models';

const statusBadge = (s: AppointmentStatus): string => {
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

type FilterMode = 'upcoming' | 'all' | 'pending' | 'completed';

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('upcoming');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllAppointments();
      setAppointments(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return appointments.filter((a) => {
      if (filter === 'upcoming') {
        return new Date(a.appointmentDate).getTime() >= now && a.status !== AppointmentStatus.Cancelled;
      }
      if (filter === 'pending') return a.status === AppointmentStatus.Pending;
      if (filter === 'completed') return a.status === AppointmentStatus.Completed;
      return true;
    });
  }, [appointments, filter]);

  const changeStatus = async (a: Appointment, status: AppointmentStatus) => {
    setBusyId(a.appointmentId);
    try {
      await updateAppointment(a.appointmentId, { status });
      toast.success('Appointment updated');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update appointment');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (a: Appointment) => {
    if (!window.confirm('Cancel this appointment?')) return;
    setBusyId(a.appointmentId);
    try {
      await cancelAppointment(a.appointmentId);
      toast.success('Appointment cancelled');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Appointments</h1>
        <p>Confirm, complete, or cancel customer service appointments.</p>
      </div>

      <div className="tab-bar">
        {(['upcoming', 'pending', 'completed', 'all'] as FilterMode[]).map((f) => (
          <button
            key={f}
            type="button"
            className={`tab${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading appointments...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No appointments to show.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Vehicle type</th>
                <th>Notes</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const isBusy = busyId === a.appointmentId;
                const isActive =
                  a.status !== AppointmentStatus.Completed && a.status !== AppointmentStatus.Cancelled;
                return (
                  <tr key={a.appointmentId}>
                    <td>{new Date(a.appointmentDate).toLocaleString()}</td>
                    <td>
                      <Link to={`/home/customers/${a.customerId}`}>{a.customerName}</Link>
                    </td>
                    <td>{VehicleType[a.vehicleType]}</td>
                    <td>{a.notes ?? '—'}</td>
                    <td>
                      <span className={statusBadge(a.status)}>{appointmentStatusLabel(a.status)}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {a.status === AppointmentStatus.Pending && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => changeStatus(a, AppointmentStatus.Confirmed)}
                            disabled={isBusy}
                          >
                            Confirm
                          </button>
                        )}
                        {(a.status === AppointmentStatus.Pending ||
                          a.status === AppointmentStatus.Confirmed) && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => changeStatus(a, AppointmentStatus.Completed)}
                            disabled={isBusy}
                          >
                            Complete
                          </button>
                        )}
                        {isActive && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancel(a)}
                            disabled={isBusy}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
