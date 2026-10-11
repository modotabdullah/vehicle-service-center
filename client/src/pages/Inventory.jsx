import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Modal from '../components/Modal';
import { Package, Plus, Search, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export default function Inventory() {
  const { hasRole } = useAuth();
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Add Part Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPartForm, setNewPartForm] = useState({
    part_name: '',
    part_number: '',
    unit_price: '',
    quantity_in_stock: '',
    reorder_level: '',
  });

  // Restock Modal
  const [selectedPart, setSelectedPart] = useState(null);
  const [restockAmount, setRestockAmount] = useState('');

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

  useEffect(() => {
    fetchInventory();
  }, [onlyLowStock]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInventory();
  };

  // Add Part Submit
  const handleAddPart = async (e) => {
    e.preventDefault();
    try {
      await api.inventory.create(newPartForm);
      setIsAddModalOpen(false);
      setNewPartForm({ part_name: '', part_number: '', unit_price: '', quantity_in_stock: '', reorder_level: '' });
      fetchInventory();
      alert('Spare part added to catalog!');
    } catch (err) {
      alert(`Error creating part: ${err.message}`);
    }
  };

  // Restock Submit
  const handleRestock = async (e) => {
    e.preventDefault();
    if (!selectedPart || !restockAmount) return;
    try {
      const newStock = parseInt(selectedPart.quantity_in_stock, 10) + parseInt(restockAmount, 10);
      await api.inventory.update(selectedPart.part_id, { quantity_in_stock: newStock });
      setSelectedPart(null);
      setRestockAmount('');
      fetchInventory();
      alert(`Stock updated! New quantity: ${newStock}`);
    } catch (err) {
      alert(`Error updating stock: ${err.message}`);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--metallic-dark)', marginBottom: '4px' }}>
            Spare Parts & Inventory
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage warehouse parts stock, reorder thresholds, and unit costs.
          </p>
        </div>

        {hasRole('system_admin', 'service_advisor') && (
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            <span>Add New Part</span>
          </button>
        )}
      </div>

      {/* Action & Filter Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#FFFFFF',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${!onlyLowStock ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setOnlyLowStock(false)}
          >
            All Parts
          </button>
          <button
            className={`btn btn-sm ${onlyLowStock ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setOnlyLowStock(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <AlertTriangle size={14} />
            <span>Low Stock (View)</span>
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', minWidth: '260px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search part name or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1 }}
          />
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
              <th>Part Number</th>
              <th>Unit Price</th>
              <th>Current Stock</th>
              <th>Reorder Threshold</th>
              <th>Status</th>
              {hasRole('system_admin', 'service_advisor') && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading spare parts catalog...
                </td>
              </tr>
            ) : parts.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No spare parts found.
                </td>
              </tr>
            ) : (
              parts.map((p) => {
                const isLow = parseInt(p.quantity_in_stock, 10) <= parseInt(p.reorder_level, 10);
                return (
                  <tr key={p.part_id}>
                    <td>
                      <strong style={{ color: 'var(--metallic-dark)' }}>{p.part_name}</strong>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.75rem', backgroundColor: 'var(--metallic-silk)', color: 'var(--metallic-dark)' }}>
                        {p.part_number}
                      </code>
                    </td>
                    <td>৳ {parseFloat(p.unit_price).toLocaleString()}</td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isLow ? '#D13438' : 'var(--text-main)' }}>
                        {p.quantity_in_stock}
                      </span>
                    </td>
                    <td>{p.reorder_level}</td>
                    <td>
                      {isLow ? (
                        <span className="badge badge-cancelled" style={{ gap: '4px' }}>
                          <AlertTriangle size={11} /> Reorder Needed
                        </span>
                      ) : (
                        <span className="badge badge-completed" style={{ gap: '4px' }}>
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
        title="Add New Inventory Spare Part"
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
            <label className="form-label">Part Number (Unique SKU)</label>
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
              placeholder="e.g. 1500"
              value={newPartForm.unit_price}
              onChange={(e) => setNewPartForm({ ...newPartForm, unit_price: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Initial Stock</label>
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
              <label className="form-label">Reorder Alert Level</label>
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            Save Spare Part
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
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Current Stock in Warehouse: <strong>{selectedPart.quantity_in_stock}</strong> units.
            </p>

            <div className="form-group">
              <label className="form-label">Quantity to Add</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Confirm Restock (+{restockAmount} units)
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
