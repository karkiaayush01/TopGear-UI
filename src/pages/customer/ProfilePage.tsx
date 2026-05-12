import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { getCustomerById, updateCustomer } from '../../api/api';
import { useUser } from '../../contexts/userContextCore';

const ProfilePage = () => {
  const { user, refreshUser } = useUser();
  const customerId = user?.userId ?? '';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const data = await getCustomerById(customerId);
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setEmail(data.email);
      setPhone(data.phoneNumber ?? '');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customerId) return;
    setSaving(true);
    try {
      await updateCustomer(customerId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      toast.success('Profile updated');
      await refreshUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Update your contact details. Contact support if you need to change your email.</p>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="p-firstName">First name</label>
            <input
              id="p-firstName"
              className="input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="p-lastName">Last name</label>
            <input
              id="p-lastName"
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="p-email">Email</label>
            <input
              id="p-email"
              type="email"
              className="input"
              value={email}
              readOnly
              disabled
              title="Email cannot be changed"
            />
          </div>
          <div className="form-field">
            <label htmlFor="p-phone">Phone</label>
            <input
              id="p-phone"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="modal-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
