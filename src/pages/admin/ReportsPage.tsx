import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getFinancialReport,
  getHighSpenders,
  getPendingCredits,
  getPurchaseInvoiceReport,
  getRegularCustomers,
} from '../../api/api';
import type {
  FinancialReport,
  HighSpender,
  PendingCredit,
  PurchaseInvoiceReport,
  RegularCustomer,
  User,
} from '../../models/models';

type Tab = 'financial' | 'purchase' | 'regulars' | 'spenders' | 'credits';
type Period = 'daily' | 'monthly' | 'yearly';

type ReportsPageProps = {
  user: User;
};

const ReportsPage = ({ user }: ReportsPageProps) => {
  const isAdmin = user.role === 'Admin';
  const initialTab: Tab = isAdmin ? 'financial' : 'regulars';
  const [tab, setTab] = useState<Tab>(initialTab);

  const [period, setPeriod] = useState<Period>('daily');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [financial, setFinancial] = useState<FinancialReport | null>(null);
  const [purchase, setPurchase] = useState<PurchaseInvoiceReport | null>(null);
  const [regulars, setRegulars] = useState<RegularCustomer[]>([]);
  const [spenders, setSpenders] = useState<HighSpender[]>([]);
  const [credits, setCredits] = useState<PendingCredit[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'financial') {
        setFinancial(await getFinancialReport({ period, from: from || undefined, to: to || undefined }));
      } else if (tab === 'purchase') {
        setPurchase(await getPurchaseInvoiceReport({ from: from || undefined, to: to || undefined }));
      } else if (tab === 'regulars') {
        setRegulars(await getRegularCustomers(2));
      } else if (tab === 'spenders') {
        setSpenders(await getHighSpenders(10));
      } else if (tab === 'credits') {
        setCredits(await getPendingCredits());
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [tab, period, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const tabs: { id: Tab; label: string; adminOnly?: boolean }[] = [
    { id: 'financial', label: 'Financial', adminOnly: true },
    { id: 'purchase', label: 'Purchases', adminOnly: true },
    { id: 'regulars', label: 'Regulars' },
    { id: 'spenders', label: 'High spenders' },
    { id: 'credits', label: 'Pending credits' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Reports</h1>
        <p>Insights into sales, purchases, and customer behavior.</p>
      </div>

      <div className="tab-bar">
        {tabs.filter((t) => !t.adminOnly || isAdmin).map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'financial' || tab === 'purchase') && (
        <div className="card">
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            {tab === 'financial' && (
              <div className="form-field">
                <label>Period</label>
                <select className="select" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}
            <div className="form-field">
              <label>From</label>
              <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="form-field">
              <label>To</label>
              <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {loading && <div className="loading">Loading report...</div>}

      {!loading && tab === 'financial' && financial && (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <p className="metric-label">Total sales</p>
              <p className="metric-value">{financial.totalSales}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Revenue</p>
              <p className="metric-value">NPR {financial.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Discount</p>
              <p className="metric-value">NPR {financial.totalDiscount.toLocaleString()}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Cash / Credit</p>
              <p className="metric-value" style={{ fontSize: 18 }}>
                NPR {financial.cashRevenue.toLocaleString()} / {financial.creditRevenue.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">By period</h2>
            {financial.byPeriod.length === 0 ? (
              <p className="muted">No data for the selected range.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Sales</th>
                      <th>Revenue (NPR)</th>
                      <th>Discount (NPR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financial.byPeriod.map((p) => (
                      <tr key={p.label}>
                        <td>{p.label}</td>
                        <td>{p.saleCount}</td>
                        <td>{p.revenue.toLocaleString()}</td>
                        <td>{p.discount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="card-title">Top selling parts</h2>
            {financial.topSellingParts.length === 0 ? (
              <p className="muted">No sales recorded.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Part</th>
                      <th>Quantity</th>
                      <th>Revenue (NPR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financial.topSellingParts.map((p) => (
                      <tr key={p.partId}>
                        <td>{p.partName}</td>
                        <td>{p.totalQuantity}</td>
                        <td>{p.totalRevenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {!loading && tab === 'purchase' && purchase && (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <p className="metric-label">Invoices</p>
              <p className="metric-value">{purchase.totalInvoices}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Total spent</p>
              <p className="metric-value">NPR {purchase.totalAmountSpent.toLocaleString()}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Units purchased</p>
              <p className="metric-value">{purchase.totalUnitsPurchased}</p>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">By vendor</h2>
            {purchase.byVendor.length === 0 ? (
              <p className="muted">No purchases yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Invoices</th>
                      <th>Total (NPR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchase.byVendor.map((v) => (
                      <tr key={v.vendorId}>
                        <td>{v.vendorName}</td>
                        <td>{v.invoiceCount}</td>
                        <td>{v.totalAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {!loading && tab === 'regulars' && (
        <div className="card">
          <h2 className="card-title">Regular customers (2+ purchases)</h2>
          {regulars.length === 0 ? (
            <p className="muted">No regulars yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Purchases</th>
                    <th>Total spent (NPR)</th>
                    <th>Last purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {regulars.map((r) => (
                    <tr key={r.customerId}>
                      <td>{r.customerName}</td>
                      <td>{r.email}</td>
                      <td>{r.purchaseCount}</td>
                      <td>{r.totalSpent.toLocaleString()}</td>
                      <td>{new Date(r.lastPurchaseDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && tab === 'spenders' && (
        <div className="card">
          <h2 className="card-title">Top 10 high spenders</h2>
          {spenders.length === 0 ? (
            <p className="muted">No customer sales yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Purchases</th>
                    <th>Total spent (NPR)</th>
                  </tr>
                </thead>
                <tbody>
                  {spenders.map((s) => (
                    <tr key={s.customerId}>
                      <td>{s.rank}</td>
                      <td>{s.customerName}</td>
                      <td>{s.email}</td>
                      <td>{s.purchaseCount}</td>
                      <td>{s.totalSpent.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && tab === 'credits' && (
        <div className="card">
          <h2 className="card-title">Pending credits</h2>
          {credits.length === 0 ? (
            <p className="muted">All credit sales are settled.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Unpaid invoices</th>
                    <th>Due (NPR)</th>
                    <th>Oldest unpaid</th>
                  </tr>
                </thead>
                <tbody>
                  {credits.map((c) => (
                    <tr key={c.customerId}>
                      <td>{c.customerName}</td>
                      <td>{c.email}</td>
                      <td>{c.phone}</td>
                      <td>{c.unpaidInvoiceCount}</td>
                      <td>{c.totalAmountDue.toLocaleString()}</td>
                      <td>{new Date(c.oldestUnpaidDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
