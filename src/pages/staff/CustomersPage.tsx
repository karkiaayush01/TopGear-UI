import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { addVehicle, createCustomer, searchCustomers } from '../../api/api';
import type { Customer } from '../../models/models';
import { VehicleType } from '../../models/models';

const initialCustomerForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
};

const initialVehicleForm = {
  enabled: false,
  make: '',
  model: '',
  year: new Date().getFullYear(),
  plateNumber: '',
  vehicleType: VehicleType.Car,
};

const vehicleOptions = [
  { value: VehicleType.Bike, label: 'Bike' },
  { value: VehicleType.Scooter, label: 'Scooter' },
  { value: VehicleType.Car, label: 'Car' },
  { value: VehicleType.Truck, label: 'Truck' },
];

const CustomersPage = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [plate, setPlate] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState(initialCustomerForm);
  const [vehicleForm, setVehicleForm] = useState(initialVehicleForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await searchCustomers({
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        vehiclePlateNumber: plate.trim() || undefined,
        customerId: customerId.trim() || undefined,
        page,
        pageSize,
      });
      setCustomers(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [name, phone, plate, customerId, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    void load();
  };

  const onRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const customer = await createCustomer({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });

      if (vehicleForm.enabled) {
        try {
          await addVehicle(customer.id, {
            make: vehicleForm.make.trim(),
            model: vehicleForm.model.trim(),
            year: Number(vehicleForm.year),
            plateNumber: vehicleForm.plateNumber.trim(),
            vehicleType: vehicleForm.vehicleType,
          });
          toast.success('Customer and vehicle registered');
        } catch (vehicleErr) {
          toast.error(
            'Customer registered but vehicle failed: ' +
              (vehicleErr instanceof Error ? vehicleErr.message : 'unknown error'),
          );
        }
      } else {
        toast.success('Customer registered');
      }

      setShowRegister(false);
      setForm(initialCustomerForm);
      setVehicleForm(initialVehicleForm);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to register customer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header row-spread">
        <div>
          <h1>Customers</h1>
          <p>Search and manage customer accounts. Register new walk-ins with their vehicle.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowRegister(true)}>
          <Plus size={16} /> Register customer
        </button>
      </div>

      <form className="card" onSubmit={onSearch}>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="search-name">Name</label>
            <input
              id="search-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First or last name"
            />
          </div>
          <div className="form-field">
            <label htmlFor="search-phone">Phone</label>
            <input
              id="search-phone"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="search-plate">Vehicle plate</label>
            <input
              id="search-plate"
              className="input"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="search-id">Customer ID</label>
            <input
              id="search-id"
              className="input"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="GUID"
            />
          </div>
        </div>
        <div className="modal-actions">
          <button type="submit" className="btn btn-primary">
            <Search size={16} /> Search
          </button>
        </div>
      </form>

      {loading ? (
        <div className="loading">Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="empty-state">No customers match your filters.</div>
      ) : (
        <>
          <div className="table-wrap">
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
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.firstName} {c.lastName}</td>
                    <td>{c.email}</td>
                    <td>{c.phoneNumber ?? '—'}</td>
                    <td>
                      <Link to={`/home/customers/${c.id}`} className="btn btn-ghost btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row-spread" style={{ marginTop: 14 }}>
            <span className="muted">{totalCount} total · Page {page} of {totalPages}</span>
            <div className="table-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {showRegister && (
        <div className="modal-overlay" onClick={() => setShowRegister(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Register customer</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowRegister(false)}>
                Close
              </button>
            </div>
            <form onSubmit={onRegister}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="r-firstName">First name</label>
                  <input
                    id="r-firstName"
                    className="input"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="r-lastName">Last name</label>
                  <input
                    id="r-lastName"
                    className="input"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="r-email">Email</label>
                  <input
                    id="r-email"
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="r-phone">Phone</label>
                  <input
                    id="r-phone"
                    className="input"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-field form-field-full">
                  <label htmlFor="r-password">Temporary password (min 8)</label>
                  <input
                    id="r-password"
                    type="password"
                    className="input"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    minLength={8}
                    required
                  />
                </div>
              </div>

              <div className="card" style={{ marginTop: 12 }}>
                <label className="row-spread" style={{ marginBottom: 8 }}>
                  <strong>Initial vehicle (optional)</strong>
                  <input
                    type="checkbox"
                    checked={vehicleForm.enabled}
                    onChange={(e) => setVehicleForm((v) => ({ ...v, enabled: e.target.checked }))}
                  />
                </label>
                {vehicleForm.enabled && (
                  <div className="form-grid">
                    <div className="form-field">
                      <label htmlFor="v-make">Make</label>
                      <input
                        id="v-make"
                        className="input"
                        value={vehicleForm.make}
                        onChange={(e) => setVehicleForm((v) => ({ ...v, make: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="v-model">Model</label>
                      <input
                        id="v-model"
                        className="input"
                        value={vehicleForm.model}
                        onChange={(e) => setVehicleForm((v) => ({ ...v, model: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="v-year">Year</label>
                      <input
                        id="v-year"
                        type="number"
                        min="1900"
                        max="2100"
                        className="input"
                        value={vehicleForm.year}
                        onChange={(e) => setVehicleForm((v) => ({ ...v, year: Number(e.target.value) }))}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="v-plate">Plate number</label>
                      <input
                        id="v-plate"
                        className="input"
                        value={vehicleForm.plateNumber}
                        onChange={(e) => setVehicleForm((v) => ({ ...v, plateNumber: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-field form-field-full">
                      <label htmlFor="v-type">Vehicle type</label>
                      <select
                        id="v-type"
                        className="select"
                        value={vehicleForm.vehicleType}
                        onChange={(e) =>
                          setVehicleForm((v) => ({ ...v, vehicleType: Number(e.target.value) as VehicleType }))
                        }
                      >
                        {vehicleOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowRegister(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
