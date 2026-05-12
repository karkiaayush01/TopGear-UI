import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createReview,
  deleteReview,
  editReview,
  getAppointmentsByCustomer,
  getMySales,
  getReviewsByCustomer,
} from '../../api/api';
import { useUser } from '../../contexts/userContextCore';
import {
  AppointmentStatus,
  ReviewType,
  VehicleType,
  type Appointment,
  type PartSale,
  type Review,
} from '../../models/models';

type ReviewSubject =
  | { kind: 'part'; id: string; label: string }
  | { kind: 'appointment'; id: string; label: string };

type FormState = {
  reviewId: string | null;
  subject: ReviewSubject | null;
  rating: number;
  comment: string;
};

const emptyForm: FormState = {
  reviewId: null,
  subject: null,
  rating: 5,
  comment: '',
};

const RatingStars = ({
  value,
  onChange,
  size = 18,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}) => (
  <span style={{ display: 'inline-flex', gap: 4 }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => !readOnly && onChange?.(n)}
        disabled={readOnly}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: readOnly ? 'default' : 'pointer',
          padding: 0,
          color: n <= value ? '#ffb300' : 'var(--border)',
        }}
        aria-label={`${n} stars`}
      >
        <Star size={size} fill={n <= value ? '#ffb300' : 'none'} />
      </button>
    ))}
  </span>
);

const MyReviewsPage = () => {
  const { user } = useUser();
  const customerId = user?.userId ?? '';

  const [reviews, setReviews] = useState<Review[]>([]);
  const [sales, setSales] = useState<PartSale[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<FormState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const [reviewList, saleList, appointmentList] = await Promise.all([
        getReviewsByCustomer(customerId),
        getMySales(),
        getAppointmentsByCustomer(customerId),
      ]);
      setReviews(reviewList);
      setSales(saleList);
      setAppointments(appointmentList);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const reviewedPartIds = useMemo(
    () => new Set(reviews.filter((r) => r.reviewType === ReviewType.Part && r.partId).map((r) => r.partId!)),
    [reviews],
  );
  const reviewedAppointmentIds = useMemo(
    () =>
      new Set(
        reviews
          .filter((r) => r.reviewType === ReviewType.Service && r.appointmentId)
          .map((r) => r.appointmentId!),
      ),
    [reviews],
  );

  const reviewableSubjects = useMemo<ReviewSubject[]>(() => {
    const purchasedParts = new Map<string, string>();
    for (const sale of sales) {
      for (const item of sale.items) {
        if (!purchasedParts.has(item.partId)) purchasedParts.set(item.partId, item.partName);
      }
    }
    const partSubjects: ReviewSubject[] = [];
    for (const [partId, name] of purchasedParts) {
      if (!reviewedPartIds.has(partId)) {
        partSubjects.push({ kind: 'part', id: partId, label: `Part · ${name}` });
      }
    }
    const apptSubjects: ReviewSubject[] = appointments
      .filter((a) => a.status === AppointmentStatus.Completed && !reviewedAppointmentIds.has(a.appointmentId))
      .map((a) => ({
        kind: 'appointment',
        id: a.appointmentId,
        label: `Service · ${VehicleType[a.vehicleType]} on ${new Date(a.appointmentDate).toLocaleDateString()}`,
      }));
    return [...partSubjects, ...apptSubjects];
  }, [sales, appointments, reviewedPartIds, reviewedAppointmentIds]);

  const openCreate = () => setForm({ ...emptyForm, subject: reviewableSubjects[0] ?? null });

  const openEdit = (r: Review) =>
    setForm({
      reviewId: r.reviewId,
      subject: null, // can't change subject when editing
      rating: r.rating,
      comment: r.comment ?? '',
    });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form) return;
    setSubmitting(true);
    try {
      if (form.reviewId) {
        await editReview(form.reviewId, {
          rating: form.rating,
          comment: form.comment.trim() || null,
        });
        toast.success('Review updated');
      } else {
        if (!form.subject) {
          toast.error('Pick something to review');
          return;
        }
        await createReview({
          reviewType: form.subject.kind === 'part' ? ReviewType.Part : ReviewType.Service,
          partId: form.subject.kind === 'part' ? form.subject.id : null,
          appointmentId: form.subject.kind === 'appointment' ? form.subject.id : null,
          rating: form.rating,
          comment: form.comment.trim() || null,
        });
        toast.success('Review submitted');
      }
      setForm(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (r: Review) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteReview(r.reviewId);
      toast.success('Review deleted');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete review');
    }
  };

  return (
    <div className="page">
      <div className="page-header row-spread">
        <div>
          <h1>My Reviews</h1>
          <p>Share feedback on parts you've bought and services you've completed.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreate}
          disabled={reviewableSubjects.length === 0}
          title={
            reviewableSubjects.length === 0
              ? 'You can review parts you have purchased and services that are completed'
              : 'Write a review'
          }
        >
          <Plus size={16} /> Write review
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="empty-state">You haven't written any reviews yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Posted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.reviewId}>
                  <td>
                    <span className="badge badge-info">
                      {r.reviewType === ReviewType.Part ? 'Part' : 'Service'}
                    </span>
                  </td>
                  <td><RatingStars value={r.rating} readOnly /></td>
                  <td>{r.comment ?? '—'}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(r)}>
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

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{form.reviewId ? 'Edit review' : 'Write review'}</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(null)}>
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {!form.reviewId && (
                  <div className="form-field form-field-full">
                    <label htmlFor="rev-subject">Subject</label>
                    <select
                      id="rev-subject"
                      className="select"
                      value={form.subject ? `${form.subject.kind}:${form.subject.id}` : ''}
                      onChange={(e) => {
                        const [kind, id] = e.target.value.split(':');
                        const subject = reviewableSubjects.find(
                          (s) => s.kind === kind && s.id === id,
                        );
                        setForm((f) => f && ({ ...f, subject: subject ?? null }));
                      }}
                      required
                    >
                      {reviewableSubjects.map((s) => (
                        <option key={`${s.kind}:${s.id}`} value={`${s.kind}:${s.id}`}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-field form-field-full">
                  <label>Rating</label>
                  <RatingStars
                    value={form.rating}
                    onChange={(v) => setForm((f) => f && ({ ...f, rating: v }))}
                    size={24}
                  />
                </div>
                <div className="form-field form-field-full">
                  <label htmlFor="rev-comment">Comment (optional)</label>
                  <textarea
                    id="rev-comment"
                    className="textarea"
                    value={form.comment}
                    onChange={(e) => setForm((f) => f && ({ ...f, comment: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReviewsPage;
