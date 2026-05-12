import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createPurchaseInvoice,
  deletePurchaseInvoice,
  getAllPurchaseInvoices,
  getAllVendors,
  searchParts,
} from '../../api/api';
import type { Part, PurchaseInvoice, Vendor } from '../../models/models';

type LineItem = {
  partId: string;
  quantity: string;
  unitPrice: string;
};

const blankLine = (): LineItem => ({ partId: '', quantity: '1', unitPrice: '' });

const PurchaseInvoicesPage = () => {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [vendorId, setVendorId] = useState('');
  const [items, setItems] = useState<LineItem[]>([blankLine()]);
  const [submitting, setSubmitting] = useState(false);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPurchaseInvoices();
      setInvoices(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const openForm = async () => {
    try {
      const [vendorList, partsResp] = await Promise.all([
        getAllVendors(),
        searchParts({ limit: 200 }),
      ]);
      setVendors(vendorList);
      setParts(partsResp.items);
      setVendorId(vendorList[0]?.vendorId ?? '');
      setItems([blankLine()]);
      setShowForm(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open form');
    }
  };

  const updateItem = (index: number, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const addLine = () => setItems((prev) => [...prev, blankLine()]);
  const removeLine = (index: number) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const unit = Number(item.unitPrice) || 0;
        return sum + qty * unit;
      }, 0),
    [items],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!vendorId) {
      toast.error('Select a vendor');
      return;
    }
    const validItems = items
      .filter((i) => i.partId && Number(i.quantity) > 0 && Number(i.unitPrice) >= 0)
      .map((i) => ({
        partId: i.partId,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
      }));
    if (validItems.length === 0) {
      toast.error('Add at least one valid line item');
      return;
    }

    setSubmitting(true);
    try {
      await createPurchaseInvoice({ vendorId, items: validItems });
      toast.success('Purchase invoice created');
      setShowForm(false);
      await loadInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this purchase invoice?')) return;
    try {
      await deletePurchaseInvoice(id);
      toast.success('Invoice deleted');
      await loadInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete invoice');
    }
  };

  const invoiceTotal = (inv: PurchaseInvoice) =>
    inv.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

  return (
    <div className="page">
      <div className="page-header row-spread">
        <div>
          <h1>Purchase Invoices</h1>
          <p>Record stock purchases from vendors. Quantities are added to inventory automatically.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openForm}>
          <Plus size={16} /> New invoice
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div className="empty-state">No purchase invoices yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Vendor</th>
                <th>Items</th>
                <th>Total (NPR)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.purchaseInvoiceId}>
                  <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                  <td>{inv.vendorName}</td>
                  <td>{inv.items.length}</td>
                  <td>{invoiceTotal(inv).toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(inv.purchaseInvoiceId)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New purchase invoice</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field form-field-full">
                  <label htmlFor="vendor">Vendor *</label>
                  <select
                    id="vendor"
                    className="select"
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    required
                  >
                    <option value="">Select a vendor</option>
                    {vendors.map((v) => (
                      <option key={v.vendorId} value={v.vendorId}>
                        {v.vendorName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <h3 className="card-title" style={{ marginTop: 8 }}>Line items</h3>
              {items.map((item, idx) => (
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
                          {(p.partName ?? p.description) + ` — stock ${p.quantity}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      className="input"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Unit price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, { unitPrice: e.target.value })}
                      required
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
              ))}

              <button type="button" className="btn btn-ghost btn-sm" onClick={addLine}>
                <Plus size={14} /> Add line
              </button>

              <div className="row-spread" style={{ marginTop: 18 }}>
                <span className="muted">Total</span>
                <strong>NPR {total.toLocaleString()}</strong>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Create invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseInvoicesPage;
