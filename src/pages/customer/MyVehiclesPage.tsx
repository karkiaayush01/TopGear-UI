import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { addVehicle, deleteVehicle, getCustomerVehicles, updateVehicle } from '../../api/api';
import { useUser } from '../../contexts/userContextCore';
import type { Vehicle } from '../../models/models';
import { VehicleType } from '../../models/models';

const vehicleOptions = [
  { value: VehicleType.Bike, label: 'Bike' },
  { value: VehicleType.Scooter, label: 'Scooter' },
  { value: VehicleType.Car, label: 'Car' },
  { value: VehicleType.Truck, label: 'Truck' },
];

type FormState = {
  vehicleId: string | null;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  vehicleType: VehicleType;
};

const emptyForm: FormState = {
  vehicleId: null,
  make: '',
  model: '',
  year: new Date().getFullYear(),
  plateNumber: '',
  vehicleType: VehicleType.Car,
};

const MyVehiclesPage = () => {
  const { user } = useUser();
  const customerId = user?.userId ?? '';
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const data = await getCustomerVehicles(customerId);
      setVehicles(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => setForm(emptyForm);
  const openEdit = (v: Vehicle) =>
    setForm({
      vehicleId: v.vehicleId,
      make: v.make,
      model: v.model,
      year: v.year,
      plateNumber: v.plateNumber,
      vehicleType: v.vehicleType,
    });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form || !customerId) return;
    setSubmitting(true);
    try {
      const payload = {
        make: form.make.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        plateNumber: form.plateNumber.trim(),
        vehicleType: form.vehicleType,
      };
      if (form.vehicleId) {
        await updateVehicle(customerId, form.vehicleId, payload);
        toast.success('Vehicle updated');
      } else {
        await addVehicle(customerId, payload);
        toast.success('Vehicle added');
      }
      setForm(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (v: Vehicle) => {
    if (!customerId) return;
    if (!window.confirm(`Remove ${v.plateNumber} from your vehicles?`)) return;
    try {
      await deleteVehicle(customerId, v.vehicleId);
      toast.success('Vehicle removed');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove vehicle');
    }
  };

  return (
    <div className="page">
      <div className="page-header row-spread">
        <div>
          <h1>My Vehicles</h1>
          <p>Manage the vehicles tied to your account. We use these to recommend parts and services.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add vehicle
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading vehicles...</div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state">You haven't added any vehicles yet.</div>
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
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(v)}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(v)}>
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
              <h2 className="modal-title">{form.vehicleId ? 'Edit vehicle' : 'Add vehicle'}</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(null)}>
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="v-make">Make</label>
                  <input
                    id="v-make"
                    className="input"
                    value={form.make}
                    onChange={(e) => setForm((f) => f && ({ ...f, make: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="v-model">Model</label>
                  <input
                    id="v-model"
                    className="input"
                    value={form.model}
                    onChange={(e) => setForm((f) => f && ({ ...f, model: e.target.value }))}
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
                    value={form.year}
                    onChange={(e) => setForm((f) => f && ({ ...f, year: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="v-plate">Plate number</label>
                  <input
                    id="v-plate"
                    className="input"
                    value={form.plateNumber}
                    onChange={(e) => setForm((f) => f && ({ ...f, plateNumber: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-field form-field-full">
                  <label htmlFor="v-type">Vehicle type</label>
                  <select
                    id="v-type"
                    className="select"
                    value={form.vehicleType}
                    onChange={(e) =>
                      setForm((f) => f && ({ ...f, vehicleType: Number(e.target.value) as VehicleType }))
                    }
                  >
                    {vehicleOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
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

export default MyVehiclesPage;
