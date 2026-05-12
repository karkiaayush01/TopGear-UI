import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  cancelAppointment,
  createAppointment,
  getAppointmentsByCustomer,
} from '../../api/api';
import { useUser } from '../../contexts/userContextCore';
import {
  AppointmentStatus,
  VehicleType,
  appointmentStatusLabel,
  type Appointment,
} from '../../models/models';

const vehicleOptions = [
  { value: VehicleType.Bike, label: 'Bike' },
  { value: VehicleType.Scooter, label: 'Scooter' },
  { value: VehicleType.Car, label: 'Car' },
  { value: VehicleType.Truck, label: 'Truck' },
];

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

const MyAppointmentsPage = () => {
  const { user } = useUser();
  const customerId = user?.userId ?? '';
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.Car);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const data = await getAppointmentsByCustomer(customerId);
      setAppointments(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openForm = () => {
    setVehicleType(VehicleType.Car);
    setAppointmentDate('');
    setNotes('');
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customerId) return;
    setSubmitting(true);
    try {
      await createAppointment({
        customerId,
        vehicleType,
        appointmentDate: new Date(appointmentDate).toISOString(),
        notes: notes.trim() || null,
      });
      toast.success('Appointment booked — we will confirm shortly');
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to book appointment');
    } finally {
      setSubmitting(false);
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
      <div className="page-header row-spread">
        <div>
          <h1>My Appointments</h1>
          <p>Book service appointments and track their status.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openForm}>
          <Plus size={16} /> Book appointment
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">You haven't booked any appointments yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Vehicle type</th>
                <th>Notes</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => {
                const isActive =
                  a.status !== AppointmentStatus.Completed && a.status !== AppointmentStatus.Cancelled;
                return (
                  <tr key={a.appointmentId}>
                    <td>{new Date(a.appointmentDate).toLocaleString()}</td>
                    <td>{VehicleType[a.vehicleType]}</td>
                    <td>{a.notes ?? '—'}</td>
                    <td>
                      <span className={statusBadge(a.status)}>{appointmentStatusLabel(a.status)}</span>
                    </td>
                    <td>
                      {isActive && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancel(a)}
                          disabled={busyId === a.appointmentId}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Book appointment</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field form-field-full">
                  <label htmlFor="appt-date">Preferred date & time</label>
                  <input
                    id="appt-date"
                    type="datetime-local"
                    className="input"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-field form-field-full">
                  <label htmlFor="appt-type">Vehicle type</label>
                  <select
                    id="appt-type"
                    className="select"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(Number(e.target.value) as VehicleType)}
                  >
                    {vehicleOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field form-field-full">
                  <label htmlFor="appt-notes">Notes (optional)</label>
                  <textarea
                    id="appt-notes"
                    className="textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What needs servicing?"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Booking...' : 'Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointmentsPage;
