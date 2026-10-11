import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import {
  Wrench,
  Search,
  Plus,
  Car,
  User,
  Package,
  Receipt,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';

export default function Jobs() {
  const { user, hasRole } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected job for detail modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetailsLoading, setJobDetailsLoading] = useState(false);

  // New Job Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [mechanicsList, setMechanicsList] = useState([]);
  const [newJobForm, setNewJobForm] = useState({
    vehicle_id: '',
    customer_id: '',
    mechanic_id: '',
  });

  // Adding line items & parts to selected job
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [inventoryParts, setInventoryParts] = useState([]);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQuantity, setPartQuantity] = useState(1);

  // Action status message
  const [actionMessage, setActionMessage] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeFilter === 'active') {
        const data = await api.jobs.getActive();
        setJobs(data);
        return;
      }
      if (activeFilter !== 'all') {
        params.status = activeFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const data = await api.jobs.getAll(params);
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [activeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  // Open job details
  const openJobDetails = async (jobId) => {
    setJobDetailsLoading(true);
    setActionMessage(null);
    try {
      const details = await api.jobs.getById(jobId);
      setSelectedJob(details);
      // Pre-load inventory parts for quick allocation
      if (hasRole('system_admin', 'service_advisor', 'mechanic')) {
        const parts = await api.inventory.getAll();
        setInventoryParts(parts);
      }
    } catch (err) {
      alert(`Could not load job details: ${err.message}`);
    } finally {
      setJobDetailsLoading(false);
    }
  };

  // Status update
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedJob) return;
    try {
      await api.jobs.updateStatus(selectedJob.job_id, { status: newStatus });
      setActionMessage({ type: 'success', text: `Status updated to ${newStatus}` });
      openJobDetails(selectedJob.job_id);
      fetchJobs();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Add Service Item
  const handleAddServiceItem = async (e) => {
    e.preventDefault();
    if (!newItemDesc || !newItemCost) return;
    try {
      await api.jobs.addItem(selectedJob.job_id, {
        description: newItemDesc,
        labor_cost: parseFloat(newItemCost),
      });
      setNewItemDesc('');
      setNewItemCost('');
      setActionMessage({ type: 'success', text: 'Labor service item added successfully.' });
      openJobDetails(selectedJob.job_id);
      fetchJobs();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Add Part Usage (triggers DB trigger for auto inventory stock reduction)
  const handleAddPartUsage = async (e) => {
    e.preventDefault();
    if (!selectedPartId || !partQuantity) return;
    try {
      await api.jobs.addPart(selectedJob.job_id, {
        part_id: parseInt(selectedPartId, 10),
        quantity_used: parseInt(partQuantity, 10),
      });
      setSelectedPartId('');
      setPartQuantity(1);
      setActionMessage({ type: 'success', text: 'Part added! Inventory quantity automatically decremented.' });
      openJobDetails(selectedJob.job_id);
      fetchJobs();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Generate Invoice
  const handleGenerateInvoice = async () => {
    if (!selectedJob) return;
    try {
      await api.invoices.generate(selectedJob.job_id, { tax_rate: 0.05 });
      setActionMessage({ type: 'success', text: 'Invoice generated with 5% tax applied.' });
      openJobDetails(selectedJob.job_id);
      fetchJobs();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  // Pre-load data for Create Job modal
  const handleOpenCreateModal = async () => {
    try {
      const [v, c, m] = await Promise.all([
        api.vehicles.getAll(),
        api.customers.getAll(),
        api.mechanics.getAll({ status: 'active' }),
      ]);
      setVehiclesList(v);
      setCustomersList(c);
      setMechanicsList(m);
      setNewJobForm({ vehicle_id: '', customer_id: '', mechanic_id: '' });
      setIsCreateModalOpen(true);
    } catch (err) {
      alert(`Failed to load form dependencies: ${err.message}`);
    }
  };

  // Create Job submit
  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await api.jobs.create(newJobForm);
      setIsCreateModalOpen(false);
      fetchJobs();
      alert('Service job created successfully via stored procedure!');
    } catch (err) {
      alert(`Error creating job: ${err.message}`);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--metallic-dark)', marginBottom: '4px' }}>
            Service Job Cards
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Track vehicle inspection, mechanic assignments, labor tasks, and spare parts.
          </p>
        </div>

        {hasRole('system_admin', 'service_advisor') && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={16} />
            <span>Open New Job Card</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search */}
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
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Jobs' },
            { id: 'active', label: 'Active Bays (View)' },
            { id: 'pending', label: 'Pending' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className="btn btn-sm"
              style={{
                backgroundColor: activeFilter === tab.id ? 'var(--metallic-dark)' : 'transparent',
                color: activeFilter === tab.id ? '#FFFFFF' : 'var(--text-muted)',
                fontWeight: activeFilter === tab.id ? 700 : 500,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', minWidth: '260px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search license plate, make, owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1 }}
          />
          <button type="submit" className="btn btn-sm btn-secondary">
            <Search size={14} />
          </button>
        </form>
      </div>

      {/* Jobs Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Vehicle</th>
              <th>Owner</th>
              <th>Mechanic</th>
              <th>Labor Cost</th>
              <th>Parts Cost</th>
              <th>Total Cost</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading job records...
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No service job records found matching criteria.
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const total = parseFloat(job.total_labor_cost || 0) + parseFloat(job.total_parts_cost || 0);
                return (
                  <tr key={job.job_id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--metallic-dark)' }}>
                        #{job.job_id}
                      </span>
                    </td>
                    <td>
                      <div>
                        <strong>{job.license_plate}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {job.make} {job.model} ({job.year || ''})
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span>{job.customer_name}</span>
                        {job.customer_phone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {job.customer_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {job.mechanic_name ? (
                        <span>{job.mechanic_name}</span>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td>৳ {parseFloat(job.total_labor_cost || 0).toLocaleString()}</td>
                    <td>৳ {parseFloat(job.total_parts_cost || 0).toLocaleString()}</td>
                    <td>
                      <strong style={{ color: 'var(--metallic-dark)' }}>
                        ৳ {total.toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      <StatusBadge status={job.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => openJobDetails(job.job_id)}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================
          JOB DETAILS & MANAGEMENT MODAL
         ======================================================== */}
      <Modal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title={selectedJob ? `Job Card #${selectedJob.job_id} - ${selectedJob.license_plate}` : 'Job Details'}
        maxWidth="750px"
      >
        {selectedJob && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Action Feedback Banner */}
            {actionMessage && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.825rem',
                  backgroundColor: actionMessage.type === 'success' ? 'var(--status-completed-bg)' : '#FDE8E9',
                  color: actionMessage.type === 'success' ? 'var(--status-completed)' : '#D13438',
                  border: `1px solid ${actionMessage.type === 'success' ? '#108A56' : '#D13438'}`,
                }}
              >
                {actionMessage.text}
              </div>
            )}

            {/* Quick Header Details */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                padding: '14px',
                backgroundColor: 'var(--metallic-silk)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vehicle</span>
                <div style={{ fontWeight: 700, color: 'var(--metallic-dark)' }}>
                  {selectedJob.make} {selectedJob.model} ({selectedJob.year})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--metallic-steel)' }}>
                  VIN: {selectedJob.vin}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Owner</span>
                <div style={{ fontWeight: 600 }}>{selectedJob.customer_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedJob.customer_phone}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mechanic</span>
                <div style={{ fontWeight: 600 }}>
                  {selectedJob.mechanic_name || 'Unassigned'}
                </div>
                {selectedJob.specialization && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--metallic-steel)' }}>
                    {selectedJob.specialization}
                  </div>
                )}
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Status</span>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={selectedJob.status} />
                </div>
              </div>
            </div>

            {/* Status Change Control (Staff Only) */}
            {hasRole('system_admin', 'service_advisor', 'mechanic') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--metallic-dark)' }}>
                  Update Job State:
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['pending', 'in_progress', 'completed', 'cancelled'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className="btn btn-sm"
                      style={{
                        backgroundColor: selectedJob.status === st ? 'var(--metallic-dark)' : 'var(--metallic-silk)',
                        color: selectedJob.status === st ? '#FFFFFF' : 'var(--metallic-dark)',
                        textTransform: 'capitalize',
                      }}
                      onClick={() => handleUpdateStatus(st)}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Section 1: Service Labor Items */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--metallic-dark)' }}>
                  1. Labor & Service Tasks (Total: ৳ {parseFloat(selectedJob.total_labor_cost || 0).toLocaleString()})
                </h4>
              </div>

              {selectedJob.items?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                  {selectedJob.items.map((item) => (
                    <div
                      key={item.item_id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: '#F9FAFD',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span>{item.description}</span>
                      <strong>৳ {parseFloat(item.labor_cost).toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  No labor line items logged yet.
                </p>
              )}

              {/* Add Labor Item Form */}
              {hasRole('system_admin', 'service_advisor', 'mechanic') && selectedJob.status !== 'completed' && (
                <form onSubmit={handleAddServiceItem} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Task description (e.g. Brake pad change)"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    style={{ flex: 2, padding: '7px 10px', fontSize: '0.825rem' }}
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="Labor cost (৳)"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    style={{ flex: 1, padding: '7px 10px', fontSize: '0.825rem' }}
                    required
                  />
                  <button type="submit" className="btn btn-sm btn-secondary">
                    <Plus size={14} /> Add Labor
                  </button>
                </form>
              )}
            </div>

            {/* Section 2: Spare Parts Allocated */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--metallic-dark)' }}>
                  2. Spare Parts Consumed (Total: ৳ {parseFloat(selectedJob.total_parts_cost || 0).toLocaleString()})
                </h4>
              </div>

              {selectedJob.parts?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                  {selectedJob.parts.map((p) => (
                    <div
                      key={p.usage_id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: '#F9FAFD',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div>
                        <strong>{p.part_name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          ({p.part_number}) x {p.quantity_used}
                        </span>
                      </div>
                      <strong>৳ {parseFloat(p.subtotal).toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  No spare parts consumed yet.
                </p>
              )}

              {/* Add Part Form */}
              {hasRole('system_admin', 'service_advisor', 'mechanic') && selectedJob.status !== 'completed' && (
                <form onSubmit={handleAddPartUsage} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <select
                    className="form-select"
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(e.target.value)}
                    style={{ flex: 2, padding: '7px 10px', fontSize: '0.825rem' }}
                    required
                  >
                    <option value="">-- Choose Spare Part from Inventory --</option>
                    {inventoryParts.map((part) => (
                      <option key={part.part_id} value={part.part_id}>
                        {part.part_name} ({part.part_number}) - Stock: {part.quantity_in_stock} (৳{part.unit_price})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="Qty"
                    value={partQuantity}
                    onChange={(e) => setPartQuantity(e.target.value)}
                    style={{ width: '80px', padding: '7px 10px', fontSize: '0.825rem' }}
                    required
                  />

                  <button type="submit" className="btn btn-sm btn-secondary">
                    <Plus size={14} /> Allocate Part
                  </button>
                </form>
              )}
            </div>

            {/* Section 3: Invoicing State */}
            <div 
              style={{
                marginTop: '10px',
                padding: '16px',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--metallic-light)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--metallic-dark)', marginBottom: '2px' }}>
                    Billing & Invoicing
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Total Estimated: ৳ {(parseFloat(selectedJob.total_labor_cost || 0) + parseFloat(selectedJob.total_parts_cost || 0)).toLocaleString()}
                  </p>
                </div>

                {selectedJob.invoice ? (
                  <div style={{ textAlign: 'right' }}>
                    <StatusBadge status={selectedJob.invoice.payment_status} />
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--metallic-dark)', marginTop: '4px' }}>
                      Grand Total: ৳ {parseFloat(selectedJob.invoice.grand_total).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  hasRole('system_admin', 'service_advisor') && (
                    <button className="btn btn-sm btn-primary" onClick={handleGenerateInvoice}>
                      <Receipt size={14} /> Generate Invoice (5% Tax)
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================
          CREATE NEW SERVICE JOB MODAL (Procedure create_service_job)
         ======================================================== */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Open New Service Job Card"
      >
        <form onSubmit={handleCreateJob}>
          <div className="form-group">
            <label className="form-label">Vehicle (Required)</label>
            <select
              className="form-select"
              value={newJobForm.vehicle_id}
              onChange={(e) => {
                const vId = e.target.value;
                const foundV = vehiclesList.find(v => v.vehicle_id === parseInt(vId, 10));
                setNewJobForm((prev) => ({
                  ...prev,
                  vehicle_id: vId,
                  customer_id: foundV ? String(foundV.customer_id) : prev.customer_id,
                }));
              }}
              required
            >
              <option value="">-- Select Vehicle --</option>
              {vehiclesList
                .filter((v) => !newJobForm.customer_id || v.customer_id === parseInt(newJobForm.customer_id, 10))
                .map((v) => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>
                    {v.license_plate} - {v.make} {v.model} ({v.year}) [Owner: {v.customer_name}]
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Customer / Vehicle Owner (Required)</label>
            <select
              className="form-select"
              value={newJobForm.customer_id}
              onChange={(e) => {
                const cId = e.target.value;
                setNewJobForm((prev) => {
                  const currentVehicleBelongs = prev.vehicle_id && vehiclesList.find(v => v.vehicle_id === parseInt(prev.vehicle_id, 10))?.customer_id === parseInt(cId, 10);
                  return {
                    ...prev,
                    customer_id: cId,
                    vehicle_id: currentVehicleBelongs ? prev.vehicle_id : '',
                  };
                });
              }}
              required
            >
              <option value="">-- Select Customer --</option>
              {customersList.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.full_name} ({c.phone || c.email || `ID #${c.customer_id}`})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Assign Mechanic (Optional)</label>
            <select
              className="form-select"
              value={newJobForm.mechanic_id}
              onChange={(e) => setNewJobForm((prev) => ({ ...prev, mechanic_id: e.target.value }))}
            >
              <option value="">-- Auto-assign First Active Mechanic --</option>
              {mechanicsList.map((m) => (
                <option key={m.mechanic_id} value={m.mechanic_id}>
                  {m.full_name} ({m.specialization || 'General'}) - ৳{m.hourly_rate}/hr
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Confirm & Open Job Card
          </button>
        </form>
      </Modal>
    </div>
  );
}
