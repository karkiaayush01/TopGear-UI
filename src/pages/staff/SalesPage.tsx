import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getAllSales, markSaleAsPaid, sendSaleInvoiceEmail } from '../../api/api';
import type { PartSale } from '../../models/models';

type FilterMode = 'all' | 'cash' | 'credit-paid' | 'credit-unpaid';

const SalesPage = () => {
  const [sales, setSales] = useState<PartSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllSales();
      setSales(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sales.filter((s) => {
      if (q && !s.customerName.toLowerCase().includes(q) && !s.customerEmail.toLowerCase().includes(q)) {
        return false;
      }
      if (filter === 'cash') return !s.isCredit;
      if (filter === 'credit-paid') return s.isCredit && s.isPaid;
      if (filter === 'credit-unpaid') return s.isCredit && !s.isPaid;
      return true;
    });
  }, [sales, filter, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, s) => {
        acc.count += 1;
        acc.revenue += s.finalAmount;
        if (s.isCredit && !s.isPaid) acc.unpaid += s.finalAmount;
        return acc;
      },
      { count: 0, revenue: 0, unpaid: 0 },
    );
  }, [filtered]);

  const handleMarkPaid = async (sale: PartSale) => {
    setBusyId(sale.saleId);
    try {
      await markSaleAsPaid(sale.saleId);
      toast.success('Marked as paid');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark as paid');
    } finally {
      setBusyId(null);
    }
  };

  const handleSendInvoice = async (sale: PartSale) => {
    setBusyId(sale.saleId);
    try {
      await sendSaleInvoiceEmail(sale.saleId);
      toast.success('Invoice email sent');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invoice');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header row-spread">
        <div>
          <h1>Sales</h1>
          <p>All sales invoices. Mark credit sales as paid and email invoices to customers.</p>
        </div>
        <Link to="/home/sales/new" className="btn btn-primary">
          <Plus size={16} /> New sale
        </Link>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <p className="metric-label">Sales (filtered)</p>
          <p className="metric-value">{totals.count}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Revenue (filtered)</p>
          <p className="metric-value">NPR {totals.revenue.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Unpaid credit</p>
          <p className="metric-value">NPR {totals.unpaid.toLocaleString()}</p>
        </div>
      </div>

      <div className="card">
        <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <div className="form-field">
            <label htmlFor="sale-search">Search customer</label>
            <input
              id="sale-search"
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or email"
            />
          </div>
          <div className="form-field">
            <label htmlFor="sale-filter">Show</label>
            <select
              id="sale-filter"
              className="select"
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterMode)}
            >
              <option value="all">All sales</option>
              <option value="cash">Cash only</option>
              <option value="credit-paid">Credit (paid)</option>
              <option value="credit-unpaid">Credit (unpaid)</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading sales...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No sales match your filters.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Discount</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Created by</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const isBusy = busyId === s.saleId;
                return (
                  <tr key={s.saleId}>
                    <td>{new Date(s.saleDate).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/home/customers/${s.customerId}`}>{s.customerName}</Link>
                    </td>
                    <td>{s.items.length}</td>
                    <td>{s.subTotal.toLocaleString()}</td>
                    <td>{s.discountAmount.toLocaleString()}</td>
                    <td><strong>NPR {s.finalAmount.toLocaleString()}</strong></td>
                    <td>
                      {s.isCredit ? (
                        s.isPaid ? (
                          <span className="badge badge-success">Credit · Paid</span>
                        ) : (
                          <span className="badge badge-warning">Credit · Unpaid</span>
                        )
                      ) : (
                        <span className="badge badge-info">Cash</span>
                      )}
                    </td>
                    <td>{s.createdByName}</td>
                    <td>
                      <div className="table-actions">
                        {s.isCredit && !s.isPaid && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleMarkPaid(s)}
                            disabled={isBusy}
                          >
                            Mark paid
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleSendInvoice(s)}
                          disabled={isBusy}
                          title="Email invoice"
                        >
                          <Mail size={14} />
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
    </div>
  );
};

export default SalesPage;
