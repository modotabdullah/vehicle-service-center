import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Modal from '../components/Modal';
import { Package, Plus, Search, AlertTriangle, CheckCircle, RefreshCw, TrendingDown } from 'lucide-react';

export default function Inventory() {
  const { hasRole } = useAuth();
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPartForm, setNewPartForm] = useState({
    part_name: '',
    part_number: '',
    unit_price: '',
    quantity_in_stock: '',
    reorder_level: '',
  });

  const [selectedPart, setSelectedPart] = useState(null);
  const [restockAmount, setRestockAmount] = useState('10');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      if (onlyLowStock) {
        const data = await api.inventory.getLowStock();
        setParts(data);
      } else {
        const data = await api.inventory.getAll({ search: search.trim() });
        setParts(data);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, [onlyLowStock]);

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchInventory(); };

  const handleAddPart = async (e) => {
    e.preventDefault();
    try {
      await api.inventory.create(newPartForm);
      setIsAddModalOpen(false);
      setNewPartForm({ part_name: '', part_number: '', unit_price: '', quantity_in_stock: '', reorder_level: '' });
      fetchInventory();
    } catch (err) {
      alert(`Error creating part: ${err.message}`);
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!selectedPart || !restockAmount) return;
    try {
      const newStock = parseInt(selectedPart.quantity_in_stock, 10) + parseInt(restockAmount, 10);
      await api.inventory.update(selectedPart.part_id, { quantity_in_stock: newStock });
      setSelectedPart(null);
      setRestockAmount('10');
      fetchInventory();
    } catch (err) {
      alert(`Error updating stock: ${err.message}`);
    }
  };

  const lowStockCount = parts.filter(p => parseInt(p.quantity_in_stock, 10) <= parseInt(p.reorder_level, 10)).length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Parts &amp; Inventory</h2>
          <p className="section-subtitle">Manage warehouse parts stock, reorder thresholds &amp; unit costs.</p>
        </div>
        {hasRole('system_admin', 'service_advisor') && (
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            <span>Add New Part</span>
          </button>
        )}
      </div>

      {/* Summary Pills */}
      {!loading && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', animation: 'fadeIn 0.4s 0.1s var(--ease-spring) both' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--status-completed-bg)',
              border: '1.5px solid rgba(5,150,105,0.2)',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--status-completed)',
            }}
          >
            <CheckCircle size={14} />
            {parts.length - lowStockCount} healthy parts
          </div>
          {lowStockCount > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--status-cancelled-bg)',
                border: '1.5px solid rgba(220,38,38,0.2)',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--status-cancelled)',
              }}
            >
              <TrendingDown size={14} />
              {lowStockCount} parts need reorder
            </div>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--metallic-silk)',
              border: '1.5px solid var(--metallic-mist)',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--metallic-dark)',
            }}
          >
            <Package size={14} />
            {parts.length} total SKUs
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className={`tab-btn ${!onlyLowStock ? 'active' : ''}`}
            onClick={() => setOnlyLowStock(false)}
          >
            All Parts
          </button>
          <button
            className={`tab-btn ${onlyLowStock ? 'active' : ''}`}
            onClick={() => setOnlyLowStock(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <AlertTriangle size={13} />
            Low Stock
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', minWidth: '240px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '11px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Search part name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '32px', padding: '7px 12px 7px 32px', fontSize: '0.8rem' }}
            />
          </div>
          <button type="submit" className="btn btn-sm btn-secondary">
            <Search size={14} />
          </button>
        </form>
      </div>

      {/* Parts Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Part Name</th>
              <th>Part SKU</th>
              <th>Unit Price</th>
              <th>Current Stock</th>
              <th>Reorder Level</th>
              <th>Status</th>
              {hasRole('system_admin', 'service_advisor') && <th style={{ textAlign: 'right' }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: hasRole('system_admin', 'service_advisor') ? 7 : 6 }).map((_, j) => (
                    <td key={j}>
                      <div className="skeleton" style={{ height: '16px', borderRadius: '6px' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : parts.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    <div className="empty-state-icon"><Package size={28} /></div>
                    <h4>No parts found</h4>
                    <p>Your inventory catalog is empty or no results match your search.</p>
                  </div>
                </td>
              </tr>
            ) : (
              parts.map((p) => {
                const isLow = parseInt(p.quantity_in_stock, 10) <= parseInt(p.reorder_level, 10);
                return (
                  <tr key={p.part_id} style={isLow ? { backgroundColor: 'rgba(254,242,242,0.4)' } : {}}>
                    <td>
                      <strong style={{ color: 'var(--metallic-dark)', fontWeight: 700 }}>{p.part_name}</strong>
                    </td>
                    <td>
                      <code>{p.part_number}</code>
                    </td>
                    <td style={{ fontWeight: 600 }}>৳ {parseFloat(p.unit_price).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '1rem',
                            color: isLow ? '#DC2626' : 'var(--text-main)',
                            fontFamily: 'var(--font-heading)',
                          }}
                        >
                          {p.quantity_in_stock}
                        </span>
                        {isLow && (
                          <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0 }} />
                        )}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{p.reorder_level}</td>
                    <td>
                      {isLow ? (
                        <span className="badge badge-cancelled" style={{ gap: '5px' }}>
                          <AlertTriangle size={11} /> Reorder Needed
                        </span>
                      ) : (
                        <span className="badge badge-completed" style={{ gap: '5px' }}>
                          <CheckCircle size={11} /> Healthy
                        </span>
                      )}
                    </td>
                    {hasRole('system_admin', 'service_advisor') && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setSelectedPart(p);
                            setRestockAmount('10');
                          }}
                        >
                          <RefreshCw size={13} />
                          <span>Restock</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Part Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Inventory Part"
      >
        <form onSubmit={handleAddPart}>
          <div className="form-group">
            <label className="form-label">Part Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Front Ceramic Brake Pads"
              value={newPartForm.part_name}
              onChange={(e) => setNewPartForm({ ...newPartForm, part_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Part SKU / Number (Unique)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. PN-BRK-099"
              value={newPartForm.part_number}
              onChange={(e) => setNewPartForm({ ...newPartForm, part_number: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Unit Price (৳)</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              placeholder="e.g. 1500.00"
              value={newPartForm.unit_price}
              onChange={(e) => setNewPartForm({ ...newPartForm, unit_price: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Initial Stock Quantity</label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="0"
                value={newPartForm.quantity_in_stock}
                onChange={(e) => setNewPartForm({ ...newPartForm, quantity_in_stock: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reorder Alert Threshold</label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="5"
                value={newPartForm.reorder_level}
                onChange={(e) => setNewPartForm({ ...newPartForm, reorder_level: e.target.value })}
                required
              />
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--status-progress-bg)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--metallic-mist)',
              fontSize: '0.82rem',
              color: 'var(--metallic-dark)',
              marginBottom: '20px',
            }}
          >
            💡 Once parts are added, they appear in the job card&apos;s parts allocation dropdown for mechanics to use.
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '13px' }}>
            <Package size={16} />
            Save Part to Catalog
          </button>
        </form>
      </Modal>

      {/* Restock Modal */}
      <Modal
        isOpen={!!selectedPart}
        onClose={() => setSelectedPart(null)}
        title={selectedPart ? `Restock: ${selectedPart.part_name}` : 'Restock Part'}
      >
        {selectedPart && (
          <form onSubmit={handleRestock}>
            <div className="info-grid" style={{ marginBottom: '20px' }}>
              <div className="info-cell">
                <label>Part</label>
                <div className="info-value">{selectedPart.part_name}</div>
                <div className="info-sub"><code>{selectedPart.part_number}</code></div>
              </div>
              <div className="info-cell">
                <label>Current Stock</label>
                <div
                  className="info-value"
                  style={{
                    color: parseInt(selectedPart.quantity_in_stock, 10) <= parseInt(selectedPart.reorder_level, 10)
                      ? '#DC2626'
                      : 'var(--status-completed)',
                  }}
                >
                  {selectedPart.quantity_in_stock} units
                </div>
                <div className="info-sub">Reorder at: {selectedPart.reorder_level}</div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Quantity to Add</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                required
              />
              {restockAmount && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  New total will be: <strong style={{ color: 'var(--status-completed)' }}>
                    {parseInt(selectedPart.quantity_in_stock, 10) + parseInt(restockAmount || 0, 10)} units
                  </strong>
                </span>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '13px' }}>
              <RefreshCw size={16} />
              Confirm Restock (+{restockAmount} units)
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
