import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { getAllPartRequests, reviewPartRequest } from '../../api/api';
import {
  PartRequestStatus,
  partRequestStatusLabel,
  type PartRequest,
} from '../../models/models';

const statusBadge = (status: PartRequestStatus) => {
  switch (status) {
    case PartRequestStatus.Pending:
      return 'badge badge-warning';
    case PartRequestStatus.Reviewed:
      return 'badge badge-info';
    case PartRequestStatus.Approved:
      return 'badge badge-success';
    case PartRequestStatus.Rejected:
      return 'badge badge-danger';
    default:
      return 'badge badge-neutral';
  }
};

const PartRequestsAdminPage = () => {
  const [requests, setRequests] = useState<PartRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PartRequest | null>(null);
  const [status, setStatus] = useState<PartRequestStatus>(PartRequestStatus.Reviewed);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPartRequests();
      setRequests(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load part requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openReview = (r: PartRequest) => {
    setSelected(r);
    setStatus(r.status === PartRequestStatus.Pending ? PartRequestStatus.Reviewed : r.status);
    setAdminNotes(r.adminNotes ?? '');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      await reviewPartRequest(selected.partRequestId, {
        status,
        adminNotes: adminNotes.trim() || null,
      });
      toast.success('Request updated');
      setSelected(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Part Requests</h1>
        <p>Review customer requests for unavailable parts.</p>
      </div>

      {loading ? (
        <div className="loading">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">No part requests yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Customer</th>
                <th>Part</th>
                <th>Qty</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.partRequestId}>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>{r.customerName}</td>
                  <td>{r.partName}</td>
                  <td>{r.quantity}</td>
                  <td>{r.vehicleDetails ?? '—'}</td>
                  <td>
                    <span className={statusBadge(r.status)}>{partRequestStatusLabel(r.status)}</span>
                  </td>
                  <td>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openReview(r)}>
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Review request</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
            <div className="muted" style={{ marginBottom: 12 }}>
              <p><strong>Customer:</strong> {selected.customerName}</p>
              <p><strong>Part:</strong> {selected.partName}</p>
              <p><strong>Quantity:</strong> {selected.quantity}</p>
              {selected.vehicleDetails && <p><strong>Vehicle:</strong> {selected.vehicleDetails}</p>}
              {selected.notes && <p><strong>Notes:</strong> {selected.notes}</p>}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field form-field-full">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    className="select"
                    value={status}
                    onChange={(e) => setStatus(Number(e.target.value) as PartRequestStatus)}
                  >
                    <option value={PartRequestStatus.Reviewed}>Reviewed</option>
                    <option value={PartRequestStatus.Approved}>Approved</option>
                    <option value={PartRequestStatus.Rejected}>Rejected</option>
                  </select>
                </div>
                <div className="form-field form-field-full">
                  <label htmlFor="adminNotes">Admin notes</label>
                  <textarea
                    id="adminNotes"
                    className="textarea"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Optional notes to share with the customer"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartRequestsAdminPage;
