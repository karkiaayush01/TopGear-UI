import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Plus, Trash2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  createPartSale,
  getCustomerById,
  searchCustomers,
  searchParts,
  sendSaleInvoiceEmail,
} from '../../api/api';
import type { Customer, Part, PartSale } from '../../models/models';

type LineItem = {
  partId: string;
  quantity: string;
};

const blankLine = (): LineItem => ({ partId: '', quantity: '1' });

const LOYALTY_THRESHOLD = 5000;
const LOYALTY_RATE = 0.1;

const NewSalePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialCustomerId = searchParams.get('customerId');

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  const [parts, setParts] = useState<Part[]>([]);
  const [partsLoading, setPartsLoading] = useState(true);

  const [items, setItems] = useState<LineItem[]>([blankLine()]);
  const [isCredit, setIsCredit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [lastSale, setLastSale] = useState<PartSale | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPartsLoading(true);
    searchParts({ limit: 200 })
      .then((r) => { if (!cancelled) setParts(r.items.filter((p) => p.quantity > 0)); })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load parts'))
      .finally(() => { if (!cancelled) setPartsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!initialCustomerId) return;
    getCustomerById(initialCustomerId)
      .then(setCustomer)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load customer'));
  }, [initialCustomerId]);

  const runCustomerSearch = useCallback(async () => {
    if (!customerQuery.trim()) return;
    setSearchingCustomer(true);
    try {
      const isPhone = /^[\d+()\-\s]+$/.test(customerQuery.trim());
      const data = await searchCustomers({
        name: isPhone ? undefined : customerQuery.trim(),
        phone: isPhone ? customerQuery.trim() : undefined,
        page: 1,
        pageSize: 10,
      });
      setCustomerResults(data.items);
      if (data.items.length === 0) toast.info('No matching customers');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearchingCustomer(false);
    }
  }, [customerQuery]);

  const partById = useMemo(() => {
    const map = new Map<string, Part>();
    parts.forEach((p) => map.set(p.partId, p));
    return map;
  }, [parts]);

  const subTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const part = partById.get(item.partId);
      const qty = Number(item.quantity) || 0;
      if (!part) return sum;
      return sum + qty * Number(part.sellingPrice);
    }, 0);
  }, [items, partById]);

  const willGetLoyaltyDiscount = subTotal > LOYALTY_THRESHOLD;
  const previewDiscount = willGetLoyaltyDiscount ? subTotal * LOYALTY_RATE : 0;
  const previewTotal = subTotal - previewDiscount;

  const updateItem = (index: number, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const addLine = () => setItems((prev) => [...prev, blankLine()]);
  const removeLine = (index: number) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const resetForm = () => {
    setItems([blankLine()]);
    setIsCredit(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customer) {
      toast.error('Select a customer first');
      return;
    }
    const valid = items
      .filter((i) => i.partId && Number(i.quantity) > 0)
      .map((i) => ({ partId: i.partId, quantity: Number(i.quantity) }));
    if (valid.length === 0) {
      toast.error('Add at least one line item');
      return;
    }
    for (const item of valid) {
      const part = partById.get(item.partId);
      if (!part) continue;
      if (item.quantity > part.quantity) {
        toast.error(`Only ${part.quantity} units of ${part.partName ?? part.description} available`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const sale = await createPartSale({
        customerId: customer.id,
        isCredit,
        items: valid,
      });
      toast.success(
        sale.discountAmount > 0
          ? `Sale created · NPR ${sale.discountAmount.toLocaleString()} loyalty discount applied`
          : 'Sale created',
      );
      setLastSale(sale);
      resetForm();
      const refreshed = await searchParts({ limit: 200 });
      setParts(refreshed.items.filter((p) => p.quantity > 0));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create sale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!lastSale) return;
    setSendingInvoice(true);
    try {
      await sendSaleInvoiceEmail(lastSale.saleId);
      toast.success('Invoice email sent');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invoice');
    } finally {
      setSendingInvoice(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>New Sale</h1>
        <p>Pick a customer, add line items, and create a sales invoice. Loyalty discount of 10% applies automatically on totals over NPR {LOYALTY_THRESHOLD.toLocaleString()}.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h2 className="card-title">Customer</h2>
          {customer ? (
            <div className="row-spread">
              <div>
                <p style={{ margin: 0 }}><strong>{customer.firstName} {customer.lastName}</strong></p>
                <p className="muted" style={{ margin: '4px 0 0' }}>{customer.email} · {customer.phoneNumber ?? 'no phone'}</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setCustomer(null); setCustomerResults([]); setCustomerQuery(''); }}
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr auto' }}>
                <div className="form-field">
                  <label htmlFor="cust-query">Search by name or phone</label>
                  <input
                    id="cust-query"
                    className="input"
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void runCustomerSearch();
                      }
                    }}
                  />
                </div>
                <div className="form-field">
                  <label>&nbsp;</label>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => void runCustomerSearch()}
                    disabled={searchingCustomer}
                  >
                    {searchingCustomer ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
              {customerResults.length > 0 && (
                <div className="table-wrap" style={{ marginTop: 12 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerResults.map((c) => (
                        <tr key={c.id}>
                          <td>{c.firstName} {c.lastName}</td>
                          <td>{c.email}</td>
                          <td>{c.phoneNumber ?? '—'}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => { setCustomer(c); setCustomerResults([]); }}
                            >
                              <UserCheck size={14} /> Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">Items</h2>
          {partsLoading ? (
            <p className="muted">Loading parts...</p>
          ) : (
            <>
              {items.map((item, idx) => {
                const part = partById.get(item.partId);
                return (
                  <div
                    key={idx}
                    className="form-grid"
                    style={{ gridTemplateColumns: '2fr 1fr 1fr auto', alignItems: 'end' }}
                  >
                    <div className="form-field">
                      <label>Part</label>
                      <select
                        className="select"
                        value={item.partId}
                        onChange={(e) => updateItem(idx, { partId: e.target.value })}
                        required
                      >
                        <option value="">Select a part</option>
                        {parts.map((p) => (
                          <option key={p.partId} value={p.partId}>
                            {(p.partName ?? p.description)} — NPR {Number(p.sellingPrice).toLocaleString()} · stock {p.quantity}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Quantity</label>
                      <input
                        type="number"
                        min="1"
                        max={part?.quantity ?? undefined}
                        className="input"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label>Line total</label>
                      <input
                        className="input"
                        readOnly
                        value={
                          part
                            ? `NPR ${(Number(item.quantity) * Number(part.sellingPrice)).toLocaleString()}`
                            : '—'
                        }
                      />
                    </div>
                    <div className="form-field">
                      <label>&nbsp;</label>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeLine(idx)}
                        disabled={items.length === 1}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              <button type="button" className="btn btn-ghost btn-sm" onClick={addLine}>
                <Plus size={14} /> Add line
              </button>
            </>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">Payment</h2>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="payment-type">Payment type</label>
              <select
                id="payment-type"
                className="select"
                value={isCredit ? 'credit' : 'cash'}
                onChange={(e) => setIsCredit(e.target.value === 'credit')}
              >
                <option value="cash">Cash (paid now)</option>
                <option value="credit">Credit (mark unpaid)</option>
              </select>
            </div>
          </div>
          <div className="row-spread" style={{ marginTop: 12 }}>
            <span className="muted">Subtotal</span>
            <strong>NPR {subTotal.toLocaleString()}</strong>
          </div>
          <div className="row-spread">
            <span className="muted">
              Loyalty discount {willGetLoyaltyDiscount ? '(applied)' : '(NPR 5000+ to qualify)'}
            </span>
            <strong>− NPR {previewDiscount.toLocaleString()}</strong>
          </div>
          <div className="row-spread" style={{ marginTop: 8, fontSize: 16 }}>
            <strong>Total</strong>
            <strong>NPR {previewTotal.toLocaleString()}</strong>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/home/sales')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting || !customer}>
            {submitting ? 'Creating...' : 'Create sale'}
          </button>
        </div>
      </form>

      {lastSale && (
        <div className="modal-overlay" onClick={() => setLastSale(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Sale created</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLastSale(null)}>
                Close
              </button>
            </div>
            <p className="muted">Sale ID</p>
            <p><code>{lastSale.saleId}</code></p>
            <div className="metrics-grid" style={{ marginTop: 12 }}>
              <div className="metric-card">
                <p className="metric-label">Subtotal</p>
                <p className="metric-value" style={{ fontSize: 18 }}>NPR {lastSale.subTotal.toLocaleString()}</p>
              </div>
              <div className="metric-card">
                <p className="metric-label">Discount</p>
                <p className="metric-value" style={{ fontSize: 18 }}>NPR {lastSale.discountAmount.toLocaleString()}</p>
              </div>
              <div className="metric-card">
                <p className="metric-label">Total</p>
                <p className="metric-value" style={{ fontSize: 18 }}>NPR {lastSale.finalAmount.toLocaleString()}</p>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setLastSale(null)}>
                Done
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSendInvoice}
                disabled={sendingInvoice}
              >
                <Mail size={14} /> {sendingInvoice ? 'Sending...' : 'Email invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSalePage;
