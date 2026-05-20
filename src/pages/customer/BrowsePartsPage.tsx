import { useCallback, useEffect, useMemo, useState } from 'react';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { customerSelfPurchase, searchParts } from '../../api/api';
import type { Part } from '../../models/models';
import { VehicleType } from '../../models/models';

const LOYALTY_THRESHOLD = 5000;
const LOYALTY_RATE = 0.1;

type CartLine = { part: Part; quantity: number };

const vehicleOptions = [
  { value: '', label: 'All vehicle types' },
  { value: VehicleType.Bike, label: 'Bike' },
  { value: VehicleType.Scooter, label: 'Scooter' },
  { value: VehicleType.Car, label: 'Car' },
  { value: VehicleType.Truck, label: 'Truck' },
];

const BrowsePartsPage = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<VehicleType | ''>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [cart, setCart] = useState<CartLine[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await searchParts({
        search: search.trim() || undefined,
        vehicleType: vehicleFilter ? Number(vehicleFilter) : undefined,
        minSellingPrice: minPrice ? Number(minPrice) : undefined,
        maxSellingPrice: maxPrice ? Number(maxPrice) : undefined,
        limit: 60,
      });
      setParts(r.items.filter((p) => p.quantity > 0));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load parts');
    } finally {
      setLoading(false);
    }
  }, [search, vehicleFilter, minPrice, maxPrice]);

  useEffect(() => {
    void load();
  }, [load]);

  const addToCart = (part: Part) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.part.partId === part.partId);
      if (existing) {
        if (existing.quantity >= part.quantity) {
          toast.error(`Only ${part.quantity} in stock`);
          return prev;
        }
        return prev.map((c) =>
          c.part.partId === part.partId ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { part, quantity: 1 }];
    });
    toast.success('Added to cart');
  };

  const updateQty = (partId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.part.partId !== partId) return c;
          const next = c.quantity + delta;
          if (next < 1) return c;
          if (next > c.part.quantity) {
            toast.error(`Only ${c.part.quantity} in stock`);
            return c;
          }
          return { ...c, quantity: next };
        })
        .filter(Boolean),
    );
  };

  const removeLine = (partId: string) =>
    setCart((prev) => prev.filter((c) => c.part.partId !== partId));

  const subTotal = useMemo(
    () => cart.reduce((s, c) => s + c.quantity * Number(c.part.sellingPrice), 0),
    [cart],
  );
  const willDiscount = subTotal > LOYALTY_THRESHOLD;
  const discount = willDiscount ? subTotal * LOYALTY_RATE : 0;
  const total = subTotal - discount;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    try {
      const sale = await customerSelfPurchase({
        items: cart.map((c) => ({ partId: c.part.partId, quantity: c.quantity })),
      });
      if (sale.discountAmount > 0) {
        toast.success(`Purchase complete · NPR ${sale.discountAmount.toLocaleString()} loyalty discount applied`);
      } else {
        toast.success('Purchase complete!');
      }
      setCart([]);
      setShowCart(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="page">
      <div className="page-header row-spread">
        <div>
          <h1>Browse Parts</h1>
          <p>Order vehicle parts online. 10% loyalty discount on orders over NPR {LOYALTY_THRESHOLD.toLocaleString()}.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowCart(true)}>
          <ShoppingCart size={16} /> Cart {cartCount > 0 && `(${cartCount})`}
        </button>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            className="search-input"
            placeholder="Search parts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select
            className="filter-select"
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value as VehicleType | '')}
          >
            {vehicleOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <input
            type="number"
            className="price-input"
            placeholder="Min NPR"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            type="number"
            className="price-input"
            placeholder="Max NPR"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading parts...</div>
      ) : parts.length === 0 ? (
        <div className="empty-state">No parts match your filters.</div>
      ) : (
        <div className="parts-grid">
          {parts.map((p) => (
            <div key={p.partId} className="part-card">
              <img
                src={p.imageUrl || '/logo/TopGearInitials.png'}
                alt={p.partName ?? p.description}
                className={`part-image${!p.imageUrl ? ' part-image-placeholder' : ''}`}
              />
              <div className="part-info">
                <h3>{p.partName ?? p.description}</h3>
                <p className="muted">{p.description}</p>
                <p>Type: {VehicleType[p.vehicleType]}</p>
                <p>Vendor: {p.vendorName}</p>
                <p>
                  Stock: <span className="badge badge-success">{p.quantity}</span>
                </p>
                <p style={{ marginTop: 8, fontSize: 18, fontWeight: 700 }}>
                  NPR {Number(p.sellingPrice).toLocaleString()}
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 8 }}
                  onClick={() => addToCart(p)}
                >
                  <Plus size={14} /> Add to cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCart && (
        <div className="modal-overlay" onClick={() => setShowCart(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Your cart</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCart(false)}>
                Close
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="muted">Your cart is empty.</p>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Part</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((c) => (
                        <tr key={c.part.partId}>
                          <td>{c.part.partName ?? c.part.description}</td>
                          <td>NPR {Number(c.part.sellingPrice).toLocaleString()}</td>
                          <td>
                            <div className="table-actions">
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => updateQty(c.part.partId, -1)}
                              >
                                <Minus size={12} />
                              </button>
                              <span style={{ minWidth: 28, textAlign: 'center' }}>{c.quantity}</span>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => updateQty(c.part.partId, 1)}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </td>
                          <td>
                            <strong>NPR {(c.quantity * Number(c.part.sellingPrice)).toLocaleString()}</strong>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => removeLine(c.part.partId)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="row-spread" style={{ marginTop: 12 }}>
                  <span className="muted">Subtotal</span>
                  <strong>NPR {subTotal.toLocaleString()}</strong>
                </div>
                <div className="row-spread">
                  <span className="muted">
                    Loyalty discount {willDiscount ? '(10% applied)' : `(spend NPR ${LOYALTY_THRESHOLD - subTotal > 0 ? (LOYALTY_THRESHOLD - subTotal).toLocaleString() : '0'} more to qualify)`}
                  </span>
                  <strong>− NPR {discount.toLocaleString()}</strong>
                </div>
                <div className="row-spread" style={{ marginTop: 8, fontSize: 16 }}>
                  <strong>Total</strong>
                  <strong>NPR {total.toLocaleString()}</strong>
                </div>

                <p className="muted" style={{ marginTop: 14, fontSize: 12 }}>
                  Online purchases are cash equivalents — settled immediately. An invoice will be available in your purchase history.
                </p>

                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowCart(false)}>
                    Keep shopping
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCheckout}
                    disabled={checkingOut}
                  >
                    {checkingOut ? 'Processing...' : 'Checkout'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowsePartsPage;
