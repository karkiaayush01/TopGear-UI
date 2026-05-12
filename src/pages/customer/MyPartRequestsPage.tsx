import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createPartRequest, getMyPartRequests } from '../../api/api';
import {
  PartRequestStatus,
  partRequestStatusLabel,
  type PartRequest,
} from '../../models/models';

const statusBadge = (status: PartRequestStatus): string => {
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

const MyPartRequestsPage = () => {
  const [requests, setRequests] = useState<PartRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [partName, setPartName] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyPartRequests();
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

  const openForm = () => {
    setPartName('');
    setVehicleDetails('');
    setQuantity('1');
    setNotes('');
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createPartRequest({
        partName: partName.trim(),
        vehicleDetails: vehicleDetails.trim() || null,
        quantity: Number(quantity),
        notes: notes.trim() || null,
      });
      toast.success('Request submitted — we will get back to you soon');
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header row-spread">
        <div>
          <h1>My Part Requests</h1>
          <p>Can't find a part you need? Request it and we'll look into it for you.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openForm}>
          <Plus size={16} /> New request
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">You haven't requested any parts yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Part</th>
                <th>Qty</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Admin notes</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.partRequestId}>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>{r.partName}</td>
                  <td>{r.quantity}</td>
                  <td>{r.vehicleDetails ?? '—'}</td>
                  <td>
                    <span className={statusBadge(r.status)}>{partRequestStatusLabel(r.status)}</span>
                  </td>
                  <td>{r.adminNotes ?? '—'}</td>
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
              <h2 className="modal-title">Request a part</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field form-field-full">
                  <label htmlFor="pr-partName">Part name</label>
                  <input
                    id="pr-partName"
                    className="input"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    maxLength={150}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="pr-qty">Quantity</label>
                  <input
                    id="pr-qty"
                    type="number"
                    min="1"
                    className="input"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="pr-vehicle">Vehicle details (optional)</label>
                  <input
                    id="pr-vehicle"
                    className="input"
                    value={vehicleDetails}
                    onChange={(e) => setVehicleDetails(e.target.value)}
                    maxLength={250}
                    placeholder="Make / model / year"
                  />
                </div>
                <div className="form-field form-field-full">
                  <label htmlFor="pr-notes">Additional notes (optional)</label>
                  <textarea
                    id="pr-notes"
                    className="textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPartRequestsPage;
