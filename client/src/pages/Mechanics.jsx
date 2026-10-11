import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { UserCheck, Plus, Phone, Wrench, DollarSign, Briefcase } from 'lucide-react';

export default function Mechanics() {
  const { hasRole } = useAuth();
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Mechanic Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    specialization: '',
    phone: '',
    hourly_rate: '',
    status: 'active',
  });

  const fetchMechanics = async () => {
    setLoading(true);
    try {
      const data = await api.mechanics.getAll();
      setMechanics(data);
    } catch (err) {
      console.error('Failed to load mechanics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMechanics();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.mechanics.update(id, { status: newStatus });
      fetchMechanics();
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleAddMechanic = async (e) => {
    e.preventDefault();
    try {
      await api.mechanics.create(form);
      setIsModalOpen(false);
      setForm({ full_name: '', specialization: '', phone: '', hourly_rate: '', status: 'active' });
      fetchMechanics();
      alert('Mechanic added successfully!');
    } catch (err) {
      alert(`Error creating mechanic: ${err.message}`);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--metallic-dark)', marginBottom: '4px' }}>
            Mechanics Technical Roster
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Monitor technician specializations, hourly wage rates, active bay load, and availability.
          </p>
        </div>

        {hasRole('system_admin', 'service_advisor') && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Add Mechanic</span>
          </button>
        )}
      </div>

      {/* Mechanics Grid */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '18px',
        }}
      >
        {loading ? (
          <div style={{ padding: '36px', color: 'var(--text-muted)' }}>Loading mechanics roster...</div>
        ) : (
          mechanics.map((m) => (
            <div
              key={m.mechanic_id}
              className="bg-metallic-card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--metallic-dark)', margin: 0 }}>
                    {m.full_name}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--metallic-primary)', fontWeight: 600 }}>
                    {m.specialization || 'General Technician'}
                  </span>
                </div>
                <StatusBadge status={m.status} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} color="var(--metallic-steel)" />
                  <span>{m.phone || 'No phone'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={14} color="var(--metallic-steel)" />
                  <span>Hourly Rate: <strong>৳{parseFloat(m.hourly_rate).toFixed(2)}</strong></span>
                </div>
              </div>

              {/* Workload badges */}
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  backgroundColor: 'var(--metallic-silk)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.775rem',
                }}
              >
                <div>
                  Active Bays: <strong style={{ color: 'var(--metallic-dark)' }}>{m.active_jobs_count || 0}</strong>
                </div>
                <div>
                  Completed: <strong style={{ color: '#108A56' }}>{m.completed_jobs_count || 0}</strong>
                </div>
              </div>

              {/* Status Selector */}
              {hasRole('system_admin', 'service_advisor') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Set:</span>
                  {['active', 'on_leave', 'inactive'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className="btn btn-sm"
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        backgroundColor: m.status === st ? 'var(--metallic-dark)' : 'var(--border-subtle)',
                        color: m.status === st ? '#FFFFFF' : 'var(--text-muted)',
                      }}
                      onClick={() => handleStatusChange(m.mechanic_id, st)}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Mechanic Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Mechanic"
      >
        <form onSubmit={handleAddMechanic}>
          <div className="form-group">
            <label className="form-label">Technician Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Delwar Hossain"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Specialization</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Transmission & Engine"
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Contact</label>
            <input
              type="text"
              className="form-input"
              placeholder="+880191..."
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hourly Billing Rate (৳)</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              placeholder="e.g. 500"
              value={form.hourly_rate}
              onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            Save Technician
          </button>
        </form>
      </Modal>
    </div>
  );
}
