import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Modal from '../components/Modal';
import { Users, Car, Plus, Search, Phone, Mail, DollarSign } from 'lucide-react';

export default function Customers() {
  const { hasRole } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
  });

  // Add Vehicle Modal
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    vin: '',
    license_plate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    customer_id: '',
  });

  // Customer Profile View
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.customers.getAll({ search: search.trim() });
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  // Add Customer Submit
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.customers.create(customerForm);
      setIsCustomerModalOpen(false);
      setCustomerForm({ full_name: '', phone: '', email: '', address: '' });
      fetchCustomers();
      alert('Customer created successfully!');
    } catch (err) {
      alert(`Error creating customer: ${err.message}`);
    }
  };

  // Add Vehicle Submit
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      await api.vehicles.create(vehicleForm);
      setIsVehicleModalOpen(false);
      setVehicleForm({ vin: '', license_plate: '', make: '', model: '', year: 2022, customer_id: '' });
      fetchCustomers();
      alert('Vehicle registered and linked to customer!');
    } catch (err) {
      alert(`Error registering vehicle: ${err.message}`);
    }
  };

  // View Customer Profile
  const viewCustomerProfile = async (id) => {
    try {
      const data = await api.customers.getById(id);
      setSelectedCustomer(data);
    } catch (err) {
      alert(`Error loading profile: ${err.message}`);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--metallic-dark)', marginBottom: '4px' }}>
            Customer Directory & Vehicle Fleet
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            View customer contact records, registered vehicle assets, and lifetime spend history.
          </p>
        </div>

        {hasRole('system_admin', 'service_advisor') && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setIsVehicleModalOpen(true)}>
              <Car size={16} />
              <span>Register Vehicle</span>
            </button>
            <button className="btn btn-primary" onClick={() => setIsCustomerModalOpen(true)}>
              <Plus size={16} />
              <span>Add Customer</span>
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '420px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by customer name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '7px 12px', fontSize: '0.825rem', flex: 1 }}
          />
          <button type="submit" className="btn btn-sm btn-secondary">
            <Search size={14} />
          </button>
        </form>
      </div>

      {/* Customers Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Vehicles</th>
              <th>Total Spend</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading customer accounts...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No customer profiles found.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.customer_id}>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--metallic-dark)' }}>
                      #{c.customer_id}
                    </span>
                  </td>
                  <td>
                    <strong>{c.full_name}</strong>
                    {c.address && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.address}</div>
                    )}
                  </td>
                  <td>{c.phone || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td>
                    <span className="badge badge-in_progress">
                      <Car size={12} /> {c.vehicle_count || 0} Vehicles
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#108A56' }}>
                      ৳ {parseFloat(c.total_spent || 0).toLocaleString()}
                    </strong>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => viewCustomerProfile(c.customer_id)}
                    >
                      Profile & Fleet
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Profile Modal */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer ? `Profile: ${selectedCustomer.full_name}` : 'Profile'}
        maxWidth="650px"
      >
        {selectedCustomer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Quick stats */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                padding: '14px',
                backgroundColor: 'var(--metallic-silk)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contact</span>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{selectedCustomer.phone || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Fleet</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--metallic-dark)' }}>
                  {selectedCustomer.vehicles?.length || 0} Cars
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lifetime Spend</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#108A56' }}>
                  ৳ {parseFloat(selectedCustomer.total_spent || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Vehicles */}
            <div>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--metallic-dark)', marginBottom: '8px' }}>
                Registered Vehicles
              </h4>
              {selectedCustomer.vehicles?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedCustomer.vehicles.map((v) => (
                    <div 
                      key={v.vehicle_id}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#F9FAFD',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong>{v.license_plate}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {v.make} {v.model} ({v.year})
                        </div>
                      </div>
                      <code style={{ fontSize: '0.75rem', backgroundColor: 'var(--metallic-silk)', color: 'var(--metallic-dark)' }}>
                        VIN: {v.vin}
                      </code>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No vehicles linked.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Add New Customer"
      >
        <form onSubmit={handleAddCustomer}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Rahim Uddin"
              value={customerForm.full_name}
              onChange={(e) => setCustomerForm({ ...customerForm, full_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="text"
              className="form-input"
              placeholder="+8801711..."
              value={customerForm.phone}
              onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="customer@example.com"
              value={customerForm.email}
              onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-input"
              placeholder="Dhaka, Bangladesh"
              rows="2"
              value={customerForm.address}
              onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }}>
            Save Customer
          </button>
        </form>
      </Modal>

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        title="Register Vehicle Asset"
      >
        <form onSubmit={handleAddVehicle}>
          <div className="form-group">
            <label className="form-label">Assign to Customer</label>
            <select
              className="form-select"
              value={vehicleForm.customer_id}
              onChange={(e) => setVehicleForm({ ...vehicleForm, customer_id: e.target.value })}
              required
            >
              <option value="">-- Select Customer --</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.full_name} (#{c.customer_id})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">License Plate</label>
              <input
                type="text"
                className="form-input"
                placeholder="DHK-0021"
                value={vehicleForm.license_plate}
                onChange={(e) => setVehicleForm({ ...vehicleForm, license_plate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">VIN (17 Characters)</label>
              <input
                type="text"
                className="form-input"
                placeholder="VSC00000000000021"
                value={vehicleForm.vin}
                onChange={(e) => setVehicleForm({ ...vehicleForm, vin: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Make</label>
              <input
                type="text"
                className="form-input"
                placeholder="Toyota"
                value={vehicleForm.make}
                onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Model</label>
              <input
                type="text"
                className="form-input"
                placeholder="Corolla"
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Year</label>
              <input
                type="number"
                className="form-input"
                placeholder="2020"
                value={vehicleForm.year}
                onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }}>
            Register Vehicle
          </button>
        </form>
      </Modal>
    </div>
  );
}
