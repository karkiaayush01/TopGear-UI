import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  addVehicle,
  deleteVehicle,
  getCustomerById,
  getCustomerVehicles,
  getSalesByCustomer,
  markSaleAsPaid,
  sendSaleInvoiceEmail,
  updateCustomer,
  updateVehicle,
} from '../../api/api';
import type { Customer, PartSale, Vehicle } from '../../models/models';
import { VehicleType } from '../../models/models';

const vehicleOptions = [
  { value: VehicleType.Bike, label: 'Bike' },
  { value: VehicleType.Scooter, label: 'Scooter' },
  { value: VehicleType.Car, label: 'Car' },
  { value: VehicleType.Truck, label: 'Truck' },
];

type VehicleFormState = {
  vehicleId: string | null;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  vehicleType: VehicleType;
};

const emptyVehicleForm: VehicleFormState = {
  vehicleId: null,
  make: '',
  model: '',
  year: new Date().getFullYear(),
  plateNumber: '',
  vehicleType: VehicleType.Car,
};

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sales, setSales] = useState<PartSale[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [savingCustomer, setSavingCustomer] = useState(false);

  const [vehicleForm, setVehicleForm] = useState<VehicleFormState | null>(null);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [busySaleId, setBusySaleId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [cust, vs, ss] = await Promise.all([
        getCustomerById(id),
        getCustomerVehicles(id),
        getSalesByCustomer(id),
      ]);
      setCustomer(cust);
      setVehicles(vs);
      setSales(ss);
      setCustomerForm({
        firstName: cust.firstName,
        lastName: cust.lastName,
        email: cust.email,
        phone: cust.phoneNumber ?? '',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCustomerSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    setSavingCustomer(true);
    try {
      await updateCustomer(id, {
        firstName: customerForm.firstName.trim(),
        lastName: customerForm.lastName.trim(),
        email: customerForm.email.trim(),
        phone: customerForm.phone.trim(),
      });
      toast.success('Customer updated');
      setEditingCustomer(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update customer');
    } finally {
      setSavingCustomer(false);
    }
  };

  const openVehicleForm = (v?: Vehicle) => {
    if (v) {
      setVehicleForm({
        vehicleId: v.vehicleId,
        make: v.make,
        model: v.model,
        year: v.year,
        plateNumber: v.plateNumber,
        vehicleType: v.vehicleType,
      });
    } else {
      setVehicleForm(emptyVehicleForm);
    }
  };

  const handleVehicleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id || !vehicleForm) return;
    setSavingVehicle(true);
    try {
      const payload = {
        make: vehicleForm.make.trim(),
        model: vehicleForm.model.trim(),
        year: Number(vehicleForm.year),
        plateNumber: vehicleForm.plateNumber.trim(),
        vehicleType: vehicleForm.vehicleType,
      };
      if (vehicleForm.vehicleId) {
        await updateVehicle(id, vehicleForm.vehicleId, payload);
        toast.success('Vehicle updated');
      } else {
        await addVehicle(id, payload);
        toast.success('Vehicle added');
      }
      setVehicleForm(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save vehicle');
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleVehicleDelete = async (v: Vehicle) => {
    if (!id) return;
    if (!window.confirm(`Delete vehicle ${v.plateNumber}?`)) return;
    try {
      await deleteVehicle(id, v.vehicleId);
      toast.success('Vehicle deleted');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete vehicle');
    }
  };

  const handleMarkPaid = async (sale: PartSale) => {
    setBusySaleId(sale.saleId);
    try {
      await markSaleAsPaid(sale.saleId);
      toast.success('Sale marked as paid');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark as paid');
    } finally {
      setBusySaleId(null);
    }
  };

  const handleSendInvoice = async (sale: PartSale) => {
    setBusySaleId(sale.saleId);
    try {
      await sendSaleInvoiceEmail(sale.saleId);
      toast.success('Invoice email sent');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invoice email');
    } finally {
      setBusySaleId(null);
    }
  };

  if (loading) return <div className="loading">Loading customer...</div>;
  if (!customer) return <div className="empty-state">Customer not found.</div>;

  const totalSpent = sales.reduce((s, sale) => s + sale.finalAmount, 0);
  const pendingCredit = sales
    .filter((s) => s.isCredit && !s.isPaid)
    .reduce((s, sale) => s + sale.finalAmount, 0);

  return (
    <div className="page">
      <div className="page-header row-spread">
        <div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Back
          </button>
          <h1 style={{ marginTop: 8 }}>{customer.firstName} {customer.lastName}</h1>
          <p>{customer.email} · {customer.phoneNumber ?? 'no phone'}</p>
        </div>
        <div className="table-actions">
          <Link
            to={`/home/sales/new?customerId=${customer.id}`}
            className="btn btn-primary btn-sm"
          >
            <Plus size={14} /> New sale
          </Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingCustomer(true)}>
            <Pencil size={14} /> Edit profile
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <p className="metric-label">Total spent</p>
          <p className="metric-value">NPR {totalSpent.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Total sales</p>
          <p className="metric-value">{sales.length}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Pending credit</p>
          <p className="metric-value">NPR {pendingCredit.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Vehicles on record</p>
          <p className="metric-value">{vehicles.length}</p>
        </div>
      </div>

      <div className="card">
        <div className="row-spread" style={{ marginBottom: 12 }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>Vehicles</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => openVehicleForm()}>
            <Plus size={14} /> Add vehicle
          </button>
        </div>
        {vehicles.length === 0 ? (
          <p className="muted">No vehicles on record.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Plate</th>
                  <th>Make</th>
                  <th>Model</th>
                  <th>Year</th>
                  <th>Type</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.vehicleId}>
                    <td><strong>{v.plateNumber}</strong></td>
                    <td>{v.make}</td>
                    <td>{v.model}</td>
                    <td>{v.year}</td>
                    <td>{VehicleType[v.vehicleType]}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openVehicleForm(v)}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => handleVehicleDelete(v)}>
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
      </div>

      <div className="card">
        <h2 className="card-title">Sales history</h2>
        {sales.length === 0 ? (
          <p className="muted">No purchases yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Subtotal</th>
                  <th>Discount</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => {
                  const isBusy = busySaleId === s.saleId;
                  return (
                    <tr key={s.saleId}>
                      <td>{new Date(s.saleDate).toLocaleDateString()}</td>
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

      {editingCustomer && (
        <div className="modal-overlay" onClick={() => setEditingCustomer(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit profile</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingCustomer(false)}>
                Close
              </button>
            </div>
            <form onSubmit={handleCustomerSave}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="e-firstName">First name</label>
                  <input
                    id="e-firstName"
                    className="input"
                    value={customerForm.firstName}
                    onChange={(e) => setCustomerForm((f) => ({ ...f, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="e-lastName">Last name</label>
                  <input
                    id="e-lastName"
                    className="input"
                    value={customerForm.lastName}
                    onChange={(e) => setCustomerForm((f) => ({ ...f, lastName: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="e-email">Email</label>
                  <input
                    id="e-email"
                    type="email"
                    className="input"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm((f) => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="e-phone">Phone</label>
                  <input
                    id="e-phone"
                    className="input"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm((f) => ({ ...f, phone: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditingCustomer(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingCustomer}>
                  {savingCustomer ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {vehicleForm && (
        <div className="modal-overlay" onClick={() => setVehicleForm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{vehicleForm.vehicleId ? 'Edit vehicle' : 'Add vehicle'}</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setVehicleForm(null)}>
                Close
              </button>
            </div>
            <form onSubmit={handleVehicleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="vf-make">Make</label>
                  <input
                    id="vf-make"
                    className="input"
                    value={vehicleForm.make}
                    onChange={(e) => setVehicleForm((v) => v && ({ ...v, make: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="vf-model">Model</label>
                  <input
                    id="vf-model"
                    className="input"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm((v) => v && ({ ...v, model: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="vf-year">Year</label>
                  <input
                    id="vf-year"
                    type="number"
                    min="1900"
                    max="2100"
                    className="input"
                    value={vehicleForm.year}
                    onChange={(e) => setVehicleForm((v) => v && ({ ...v, year: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="vf-plate">Plate number</label>
                  <input
                    id="vf-plate"
                    className="input"
                    value={vehicleForm.plateNumber}
                    onChange={(e) => setVehicleForm((v) => v && ({ ...v, plateNumber: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-field form-field-full">
                  <label htmlFor="vf-type">Vehicle type</label>
                  <select
                    id="vf-type"
                    className="select"
                    value={vehicleForm.vehicleType}
                    onChange={(e) =>
                      setVehicleForm((v) => v && ({ ...v, vehicleType: Number(e.target.value) as VehicleType }))
                    }
                  >
                    {vehicleOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setVehicleForm(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingVehicle}>
                  {savingVehicle ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetailPage;
