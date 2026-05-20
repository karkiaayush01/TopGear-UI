import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Pause, Play, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { activateStaff, deactivateStaff, deleteStaff, getAllStaff, registerStaff } from '../../api/api';
import { UserAccountStatus, type Staff } from '../../models/models';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phoneNumber: '',
};

const statusLabel = (s: UserAccountStatus) => UserAccountStatus[s] ?? 'Unknown';

const statusBadgeClass = (s: UserAccountStatus): string => {
  switch (s) {
    case UserAccountStatus.Active:
      return 'badge badge-success';
    case UserAccountStatus.Inactive:
      return 'badge badge-warning';
    case UserAccountStatus.Deactivated:
      return 'badge badge-neutral';
    case UserAccountStatus.Deleted:
      return 'badge badge-danger';
    default:
      return 'badge badge-neutral';
  }
};

const StaffPage = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllStaff();
      setStaff(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleChange = (field: keyof typeof initialForm) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await registerStaff({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        phoneNumber: form.phoneNumber.trim() || null,
      });
      toast.success('Staff registered');
      setForm(initialForm);
      setShowRegister(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to register staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (s: Staff) => {
    if (!window.confirm(`Deactivate ${s.fullName}?`)) return;
    setBusyId(s.userId);
    try {
      await deactivateStaff(s.userId);
      toast.success('Staff deactivated');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to deactivate staff');
    } finally {
      setBusyId(null);
    }
  };

  const handleActivate = async (s: Staff) => {
    if (!window.confirm(`Activate ${s.fullName}?`)) return;
    setBusyId(s.userId);
    try {
      await activateStaff(s.userId);
      toast.success('Staff activated');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to activate staff');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (s: Staff) => {
    if (!window.confirm(`Delete ${s.fullName}? This soft-deletes the account.`)) return;
    setBusyId(s.userId);
    try {
      await deleteStaff(s.userId);
      toast.success('Staff deleted');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete staff');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header row-spread">
        <div>
          <h1>Staff Management</h1>
          <p>Register staff accounts and manage existing ones.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowRegister(true)}>
          <Plus size={16} /> Register staff
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading staff...</div>
      ) : staff.length === 0 ? (
        <div className="empty-state">No staff registered yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => {
                const isActive = s.status === UserAccountStatus.Active;
                const canToggle = s.status !== UserAccountStatus.Deleted;
                const canDelete = s.status !== UserAccountStatus.Deleted;
                const isBusy = busyId === s.userId;
                return (
                  <tr key={s.userId}>
                    <td>{s.fullName}</td>
                    <td>{s.email}</td>
                    <td>{s.phoneNumber ?? '—'}</td>
                    <td>
                      <span className={statusBadgeClass(s.status)}>{statusLabel(s.status)}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {isActive ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDeactivate(s)}
                            disabled={isBusy}
                            title="Deactivate account"
                          >
                            <Pause size={14} /> Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleActivate(s)}
                            disabled={!canToggle || isBusy}
                            title="Activate account"
                          >
                            <Play size={14} /> Activate
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(s)}
                          disabled={!canDelete || isBusy}
                          title={canDelete ? 'Soft-delete account' : 'Already deleted'}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showRegister && (
        <div className="modal-overlay" onClick={() => setShowRegister(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Register new staff</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowRegister(false)}>
                Close
              </button>
            </div>
            <form onSubmit={handleRegister}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="firstName">First name</label>
                  <input
                    id="firstName"
                    className="input"
                    value={form.firstName}
                    onChange={handleChange('firstName')}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="lastName">Last name</label>
                  <input
                    id="lastName"
                    className="input"
                    value={form.lastName}
                    onChange={handleChange('lastName')}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={handleChange('email')}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="phoneNumber">Phone</label>
                  <input
                    id="phoneNumber"
                    className="input"
                    value={form.phoneNumber}
                    onChange={handleChange('phoneNumber')}
                  />
                </div>
                <div className="form-field form-field-full">
                  <label htmlFor="password">Temporary password</label>
                  <input
                    id="password"
                    type="password"
                    className="input"
                    value={form.password}
                    onChange={handleChange('password')}
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowRegister(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;
