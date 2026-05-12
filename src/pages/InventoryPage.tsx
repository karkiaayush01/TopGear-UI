import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createPart,
  deletePart,
  getAllVendors,
  searchParts,
  updatePart,
} from '../api/api';
import type { Part, User, Vendor } from '../models/models';
import { VehicleType } from '../models/models';

type InventoryPageProps = {
  user: User;
};

type FormState = {
  partName: string;
  partPrice: string;
  sellingPrice: string;
  quantity: string;
  vendorId: string;
  description: string;
  vehicleType: VehicleType;
  partImage: File | null;
};

const emptyForm: FormState = {
  partName: '',
  partPrice: '',
  sellingPrice: '',
  quantity: '',
  vendorId: '',
  description: '',
  vehicleType: VehicleType.Car,
  partImage: null,
};

const vehicleOptions = [
  { value: VehicleType.Bike, label: 'Bike' },
  { value: VehicleType.Scooter, label: 'Scooter' },
  { value: VehicleType.Car, label: 'Car' },
  { value: VehicleType.Truck, label: 'Truck' },
];

const InventoryPage = ({ user }: InventoryPageProps) => {
  const canEdit = user.role === 'Admin';
  const [parts, setParts] = useState<Part[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<VehicleType | ''>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadParts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await searchParts({
        search: searchQuery || undefined,
        vehicleType: vehicleTypeFilter ? Number(vehicleTypeFilter) : undefined,
        minSellingPrice: minPrice ? Number(minPrice) : undefined,
        maxSellingPrice: maxPrice ? Number(maxPrice) : undefined,
        limit: 60,
      });
      setParts(response.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load parts');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, vehicleTypeFilter, minPrice, maxPrice]);

  useEffect(() => {
    void loadParts();
  }, [loadParts]);

  useEffect(() => {
    if (!canEdit) return;
    getAllVendors()
      .then(setVendors)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load vendors'));
  }, [canEdit]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, vendorId: vendors[0]?.vendorId ?? '' });
    setShowForm(true);
  };

  const openEdit = (p: Part) => {
    setEditingId(p.partId);
    setForm({
      partName: p.partName ?? p.description,
      partPrice: String(p.partPrice ?? ''),
      sellingPrice: String(p.sellingPrice ?? ''),
      quantity: String(p.quantity ?? ''),
      vendorId: p.vendorId,
      description: p.description,
      vehicleType: p.vehicleType,
      partImage: null,
    });
    setShowForm(true);
  };

  const handleField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updatePart(editingId, {
          partName: form.partName.trim(),
          partPrice: form.partPrice ? Number(form.partPrice) : undefined,
          sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : undefined,
          vendorId: form.vendorId,
          description: form.description.trim(),
          vehicleType: form.vehicleType,
        });
        toast.success('Part updated');
      } else {
        if (!form.partImage) {
          toast.error('Please select an image for the part');
          setSubmitting(false);
          return;
        }
        await createPart({
          partName: form.partName.trim(),
          partPrice: Number(form.partPrice),
          sellingPrice: Number(form.sellingPrice),
          quantity: Number(form.quantity),
          vendorId: form.vendorId,
          description: form.description.trim(),
          vehicleType: form.vehicleType,
          partImage: form.partImage,
        });
        toast.success('Part created');
      }
      setShowForm(false);
      await loadParts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save part');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this part?')) return;
    try {
      await deletePart(id);
      toast.success('Part deleted');
      await loadParts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete part');
    }
  };

  return (
    <div className="page">
      <div className="page-header row-spread">
        <div>
          <h1>Inventory</h1>
          <p>{canEdit ? 'Manage parts across your inventory.' : 'Browse the parts catalogue.'}</p>
        </div>
        {canEdit && (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add part
          </button>
        )}
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search parts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <select
            value={vehicleTypeFilter}
            onChange={(e) => setVehicleTypeFilter(e.target.value as VehicleType | '')}
            className="filter-select"
          >
            <option value="">All vehicle types</option>
            {vehicleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <input
            type="number"
            placeholder="Min price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="price-input"
          />
          <input
            type="number"
            placeholder="Max price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="price-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading parts...</div>
      ) : parts.length === 0 ? (
        <div className="empty-state">No parts found.</div>
      ) : (
        <div className="parts-grid">
          {parts.map((part) => {
            const lowStock = part.quantity < 10;
            return (
              <div key={part.partId} className="part-card">
                {part.imageUrl && (
                  <img src={part.imageUrl} alt={part.partName ?? part.description} className="part-image" />
                )}
                <div className="part-info">
                  <h3>{part.partName ?? part.description}</h3>
                  <p className="muted">{part.description}</p>
                  <p>Vendor: {part.vendorName}</p>
                  <p>Type: {VehicleType[part.vehicleType]}</p>
                  <p>
                    Stock: <span className={lowStock ? 'badge badge-danger' : 'badge badge-success'}>{part.quantity}</span>
                  </p>
                  <p>Price: NPR {Number(part.sellingPrice).toLocaleString()}</p>
                  {canEdit && (
                    <div className="table-actions" style={{ marginTop: 8 }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(part)}>
                        <Pencil size={14} /> Edit
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(part.partId)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && canEdit && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Edit part' : 'Add part'}</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field form-field-full">
                  <label htmlFor="partName">Part name *</label>
                  <input
                    id="partName"
                    className="input"
                    value={form.partName}
                    onChange={(e) => handleField('partName', e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="partPrice">Purchase price (NPR)</label>
                  <input
                    id="partPrice"
                    type="number"
                    step="0.01"
                    className="input"
                    value={form.partPrice}
                    onChange={(e) => handleField('partPrice', e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="sellingPrice">Selling price (NPR)</label>
                  <input
                    id="sellingPrice"
                    type="number"
                    step="0.01"
                    className="input"
                    value={form.sellingPrice}
                    onChange={(e) => handleField('sellingPrice', e.target.value)}
                    required
                  />
                </div>
                {!editingId && (
                  <div className="form-field">
                    <label htmlFor="quantity">Initial quantity</label>
                    <input
                      id="quantity"
                      type="number"
                      min="0"
                      className="input"
                      value={form.quantity}
                      onChange={(e) => handleField('quantity', e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="form-field">
                  <label htmlFor="vehicleType">Vehicle type</label>
                  <select
                    id="vehicleType"
                    className="select"
                    value={form.vehicleType}
                    onChange={(e) => handleField('vehicleType', Number(e.target.value) as VehicleType)}
                  >
                    {vehicleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field form-field-full">
                  <label htmlFor="vendorId">Vendor *</label>
                  <select
                    id="vendorId"
                    className="select"
                    value={form.vendorId}
                    onChange={(e) => handleField('vendorId', e.target.value)}
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
                <div className="form-field form-field-full">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    className="textarea"
                    value={form.description}
                    onChange={(e) => handleField('description', e.target.value)}
                    required
                  />
                </div>
                {!editingId && (
                  <div className="form-field form-field-full">
                    <label htmlFor="partImage">Image *</label>
                    <input
                      id="partImage"
                      type="file"
                      accept="image/*"
                      className="input"
                      onChange={(e) => handleField('partImage', e.target.files?.[0] ?? null)}
                      required
                    />
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Save changes' : 'Create part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
