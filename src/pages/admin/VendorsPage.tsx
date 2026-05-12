import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createVendor,
  deleteVendor,
  getAllVendors,
  updateVendor,
} from '../../api/api';
import type { Vendor } from '../../models/models';

type FormState = {
  vendorName: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  vendorName: '',
  companyName: '',
  email: '',
  phone: '',
  address: '',
  contactPerson: '',
  isActive: true,
};

const VendorsPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllVendors();
      setVendors(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVendors();
  }, [loadVendors]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (v: Vendor) => {
    setEditingId(v.vendorId);
    setForm({
      vendorName: v.vendorName,
      companyName: v.companyName ?? '',
      email: v.email ?? '',
      phone: v.phone ?? '',
      address: v.address ?? '',
      contactPerson: v.contactPerson ?? '',
      isActive: v.isActive,
    });
    setShowForm(true);
  };

  const handleField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        vendorName: form.vendorName.trim(),
        companyName: form.companyName.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        contactPerson: form.contactPerson.trim() || null,
      };

      if (editingId) {
        await updateVendor(editingId, { ...payload, vendorId: editingId, isActive: form.isActive });
        toast.success('Vendor updated');
      } else {
        await createVendor(payload);
        toast.success('Vendor created');
      }
      setShowForm(false);
      await loadVendors();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this vendor?')) return;
    try {
      await deleteVendor(id);
      toast.success('Vendor deleted');
      await loadVendors();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete vendor');
    }
  };

  return (
    <div className="page">
      <div className="page-header row-spread">
        <div>
          <h1>Vendors</h1>
          <p>Manage suppliers that provide your inventory.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add vendor
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading vendors...</div>
      ) : vendors.length === 0 ? (
        <div className="empty-state">No vendors yet. Add your first one.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Parts</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.vendorId}>
                  <td>{v.vendorName}</td>
                  <td>{v.companyName ?? '—'}</td>
                  <td>{v.contactPerson ?? '—'}</td>
                  <td>{v.email ?? '—'}</td>
                  <td>{v.phone ?? '—'}</td>
                  <td>{v.totalPartsSupplied}</td>
                  <td>
                    <span className={`badge ${v.isActive ? 'badge-success' : 'badge-neutral'}`}>
                      {v.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(v)}>
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(v.vendorId)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Edit vendor' : 'Add vendor'}</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="vendorName">Vendor name *</label>
                  <input
                    id="vendorName"
                    className="input"
                    value={form.vendorName}
                    onChange={(e) => handleField('vendorName', e.target.value)}
                    required
                    maxLength={100}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="companyName">Company name</label>
                  <input
                    id="companyName"
                    className="input"
                    value={form.companyName}
                    onChange={(e) => handleField('companyName', e.target.value)}
                    maxLength={150}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={(e) => handleField('email', e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    className="input"
                    value={form.phone}
                    onChange={(e) => handleField('phone', e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="contactPerson">Contact person</label>
                  <input
                    id="contactPerson"
                    className="input"
                    value={form.contactPerson}
                    onChange={(e) => handleField('contactPerson', e.target.value)}
                  />
                </div>
                <div className="form-field form-field-full">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    className="textarea"
                    value={form.address}
                    onChange={(e) => handleField('address', e.target.value)}
                    maxLength={250}
                  />
                </div>
                {editingId && (
                  <div className="form-field">
                    <label htmlFor="isActive">Status</label>
                    <select
                      id="isActive"
                      className="select"
                      value={form.isActive ? 'true' : 'false'}
                      onChange={(e) => handleField('isActive', e.target.value === 'true')}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Save changes' : 'Create vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorsPage;
