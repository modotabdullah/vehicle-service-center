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
  AlertCircle,
  XCircle,
  ChevronRight,
} from 'lucide-react';

export default function Jobs() {
  const { user, hasRole } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetailsLoading, setJobDetailsLoading] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [mechanicsList, setMechanicsList] = useState([]);
  const [newJobForm, setNewJobForm] = useState({ vehicle_id: '', customer_id: '', mechanic_id: '' });

  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [inventoryParts, setInventoryParts] = useState([]);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQuantity, setPartQuantity] = useState(1);

  const [actionMessage, setActionMessage] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      if (activeFilter === 'active') {
        const data = await api.jobs.getActive();
        setJobs(data);
        return;
      }
      const params = {};
      if (activeFilter !== 'all') params.status = activeFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const data = await api.jobs.getAll(params);
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [activeFilter]);

  const handleSearch = (e) => { e.preventDefault(); fetchJobs(); };

  const openJobDetails = async (jobId) => {
    setJobDetailsLoading(true);
    setActionMessage(null);
    try {
      const details = await api.jobs.getById(jobId);
      setSelectedJob(details);
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

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedJob) return;
    try {
      await api.jobs.updateStatus(selectedJob.job_id, { status: newStatus });
      setActionMessage({ type: 'success', text: `Status updated to "${newStatus.replace('_', ' ')}"` });
      openJobDetails(selectedJob.job_id);
      fetchJobs();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

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
      setActionMessage({ type: 'success', text: 'Part allocated! Inventory auto-decremented.' });
      openJobDetails(selectedJob.job_id);
      fetchJobs();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

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

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await api.jobs.create(newJobForm);
      setIsCreateModalOpen(false);
      fetchJobs();
      setActionMessage({ type: 'success', text: 'Service job created successfully!' });
    } catch (err) {
      alert(`Error creating job: ${err.message}`);
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All Jobs', icon: null },
    { id: 'active', label: 'Active Bays', icon: null },
    { id: 'pending', label: 'Pending', icon: null },
    { id: 'in_progress', label: 'In Progress', icon: null },
    { id: 'completed', label: 'Completed', icon: null },
    { id: 'cancelled', label: 'Cancelled', icon: null },
  ];

  const statusColors = {
    pending: '#D97706',
    in_progress: '#3D52A0',
    completed: '#059669',
    cancelled: '#DC2626',
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Service Job Cards</h2>
          <p className="section-subtitle">Track vehicle inspection, mechanic assignments, labor tasks &amp; spare parts.</p>
        </div>
        {hasRole('system_admin', 'service_advisor') && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={16} />
            <span>Open New Job Card</span>
          </button>
        )}
      </div>

      {/* Action message at top level */}
      {actionMessage && !selectedJob && (
        <div className={`alert alert-${actionMessage.type}`}>
          {actionMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`tab-btn ${activeFilter === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', minWidth: '240px' }}>
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
              placeholder="Search plate, make, owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', padding: '7px 12px 7px 32px', fontSize: '0.8rem' }}
            />
          </div>
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
              <th>Total</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j}>
                      <div className="skeleton" style={{ height: '16px', borderRadius: '6px', width: j === 8 ? '70px' : '100%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan="9">
                  <div className="empty-state">
                    <div className="empty-state-icon"><Wrench size={28} /></div>
                    <h4>No service jobs found</h4>
                    <p>No records match your current filter. Try a different status or search term.</p>
                  </div>
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const total = parseFloat(job.total_labor_cost || 0) + parseFloat(job.total_parts_cost || 0);
                return (
                  <tr key={job.job_id}>
                    <td>
                      <span
                        style={{
                          fontWeight: 800,
                          color: 'var(--metallic-dark)',
                          fontFamily: 'var(--font-heading)',
                          fontSize: '0.95rem',
                        }}
                      >
                        #{job.job_id}
                      </span>
                    </td>
                    <td>
                      <div>
                        <strong>{job.license_plate}</strong>
                        <div className="text-small text-muted">{job.make} {job.model} {job.year ? `(${job.year})` : ''}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span style={{ fontWeight: 600 }}>{job.customer_name}</span>
                        {job.customer_phone && (
                          <div className="text-small text-muted">{job.customer_phone}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      {job.mechanic_name ? (
                        <span style={{ fontWeight: 500 }}>{job.mechanic_name}</span>
                      ) : (
                        <em style={{ color: 'var(--text-light)', fontSize: '0.82rem' }}>Unassigned</em>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>৳ {parseFloat(job.total_labor_cost || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>৳ {parseFloat(job.total_parts_cost || 0).toLocaleString()}</td>
                    <td>
                      <strong style={{ color: 'var(--metallic-dark)', fontFamily: 'var(--font-heading)' }}>
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
                        <span>Manage</span>
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ===== JOB DETAILS MODAL ===== */}
      <Modal
        isOpen={!!selectedJob}
        onClose={() => { setSelectedJob(null); setActionMessage(null); }}
        title={selectedJob ? `Job Card #${selectedJob.job_id} — ${selectedJob.license_plate}` : 'Job Details'}
        maxWidth="780px"
      >
        {selectedJob && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Action Feedback */}
            {actionMessage && (
              <div className={`alert alert-${actionMessage.type}`}>
                {actionMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{actionMessage.text}</span>
              </div>
            )}

            {/* Quick Info Grid */}
            <div className="info-grid">
              <div className="info-cell">
                <label>Vehicle</label>
                <div className="info-value">{selectedJob.make} {selectedJob.model} ({selectedJob.year})</div>
                <div className="info-sub"><code>{selectedJob.license_plate}</code></div>
              </div>
              <div className="info-cell">
                <label>Owner</label>
                <div className="info-value">{selectedJob.customer_name}</div>
                <div className="info-sub">{selectedJob.customer_phone}</div>
              </div>
              <div className="info-cell">
                <label>Mechanic</label>
                <div className="info-value">{selectedJob.mechanic_name || 'Unassigned'}</div>
                {selectedJob.specialization && (
                  <div className="info-sub">{selectedJob.specialization}</div>
                )}
              </div>
              <div className="info-cell">
                <label>Status</label>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={selectedJob.status} />
                </div>
              </div>
            </div>

            {/* Status Control */}
            {hasRole('system_admin', 'service_advisor', 'mechanic') && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  backgroundColor: 'var(--metallic-light)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--metallic-dark)', whiteSpace: 'nowrap' }}>
                  Update Status:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['pending', 'in_progress', 'completed', 'cancelled'].map((st) => {
                    const isActive = selectedJob.status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        className="btn btn-sm"
                        style={{
                          backgroundColor: isActive ? (statusColors[st] || 'var(--metallic-dark)') : 'transparent',
                          color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                          border: `1.5px solid ${isActive ? (statusColors[st] || 'var(--metallic-dark)') : 'var(--border-subtle)'}`,
                          fontWeight: isActive ? 700 : 500,
                          textTransform: 'capitalize',
                          boxShadow: isActive ? `0 3px 10px ${statusColors[st] || 'rgba(61,82,160,0.3)'}30` : 'none',
                        }}
                        onClick={() => handleUpdateStatus(st)}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 1: Labor Items */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--metallic-dark)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3D52A0, #7091E6)',
                      color: '#FFF',
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}
                  >
                    1
                  </span>
                  Labor &amp; Service Tasks
                </h4>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--metallic-dark)' }}>
                  ৳ {parseFloat(selectedJob.total_labor_cost || 0).toLocaleString()}
                </span>
              </div>

              {selectedJob.items?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                  {selectedJob.items.map((item) => (
                    <div key={item.item_id} className="line-item">
                      <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{item.description}</span>
                      <strong style={{ color: 'var(--metallic-dark)', fontFamily: 'var(--font-heading)' }}>
                        ৳ {parseFloat(item.labor_cost).toLocaleString()}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info" style={{ marginBottom: '10px', fontSize: '0.82rem' }}>
                  No labor tasks logged yet. Add one below.
                </div>
              )}

              {hasRole('system_admin', 'service_advisor', 'mechanic') && selectedJob.status !== 'completed' && (
                <form onSubmit={handleAddServiceItem} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Task description (e.g. Brake pad replacement)"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    style={{ flex: 2, padding: '8px 12px', fontSize: '0.825rem' }}
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="Labor cost (৳)"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.825rem' }}
                    required
                  />
                  <button type="submit" className="btn btn-sm btn-secondary" style={{ flexShrink: 0 }}>
                    <Plus size={14} /> Add
                  </button>
                </form>
              )}
            </div>

            <hr className="divider" />

            {/* Section 2: Spare Parts */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--metallic-dark)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3D52A0, #7091E6)',
                      color: '#FFF',
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}
                  >
                    2
                  </span>
                  Spare Parts Consumed
                </h4>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--metallic-dark)' }}>
                  ৳ {parseFloat(selectedJob.total_parts_cost || 0).toLocaleString()}
                </span>
              </div>

              {selectedJob.parts?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                  {selectedJob.parts.map((p) => (
                    <div key={p.usage_id} className="line-item">
                      <div>
                        <strong style={{ fontWeight: 700 }}>{p.part_name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          <code>{p.part_number}</code> × {p.quantity_used}
                        </span>
                      </div>
                      <strong style={{ color: 'var(--metallic-dark)', fontFamily: 'var(--font-heading)' }}>
                        ৳ {parseFloat(p.subtotal).toLocaleString()}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info" style={{ marginBottom: '10px', fontSize: '0.82rem' }}>
                  No spare parts allocated yet. Use the form below.
                </div>
              )}

              {hasRole('system_admin', 'service_advisor', 'mechanic') && selectedJob.status !== 'completed' && (
                <form onSubmit={handleAddPartUsage} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <select
                    className="form-select"
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(e.target.value)}
                    style={{ flex: 2, minWidth: '200px', padding: '8px 36px 8px 12px', fontSize: '0.825rem' }}
                    required
                  >
                    <option value="">— Select part from inventory —</option>
                    {inventoryParts.map((part) => (
                      <option key={part.part_id} value={part.part_id}>
                        {part.part_name} ({part.part_number}) — Stock: {part.quantity_in_stock} @ ৳{part.unit_price}
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
                    style={{ width: '80px', padding: '8px 10px', fontSize: '0.825rem' }}
                    required
                  />
                  <button type="submit" className="btn btn-sm btn-secondary" style={{ flexShrink: 0 }}>
                    <Plus size={14} /> Allocate
                  </button>
                </form>
              )}
            </div>

            <hr className="divider" />

            {/* Section 3: Invoice */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--border-subtle)',
                background: 'linear-gradient(135deg, var(--metallic-light) 0%, #FAFBFF 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--metallic-dark)', fontWeight: 800, marginBottom: '3px' }}>
                    Billing &amp; Invoice
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Estimated Total: <strong style={{ color: 'var(--text-main)' }}>
                      ৳ {(parseFloat(selectedJob.total_labor_cost || 0) + parseFloat(selectedJob.total_parts_cost || 0)).toLocaleString()}
                    </strong>
                  </p>
                </div>

                {selectedJob.invoice ? (
                  <div style={{ textAlign: 'right' }}>
                    <StatusBadge status={selectedJob.invoice.payment_status} />
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--metallic-dark)', marginTop: '5px', fontFamily: 'var(--font-heading)' }}>
                      Grand Total: ৳ {parseFloat(selectedJob.invoice.grand_total).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  hasRole('system_admin', 'service_advisor') && (
                    <button className="btn btn-sm btn-primary" onClick={handleGenerateInvoice}>
                      <Receipt size={14} />
                      Generate Invoice (5% Tax)
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== CREATE JOB MODAL ===== */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Open New Service Job Card"
      >
        <form onSubmit={handleCreateJob}>
          <div className="form-group">
            <label className="form-label">
              <Car size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Vehicle (Required)
            </label>
            <select
              className="form-select"
              value={newJobForm.vehicle_id}
              onChange={(e) => {
                const vId = e.target.value;
                const foundV = vehiclesList.find((v) => v.vehicle_id === parseInt(vId, 10));
                setNewJobForm((prev) => ({
                  ...prev,
                  vehicle_id: vId,
                  customer_id: foundV ? String(foundV.customer_id) : prev.customer_id,
                }));
              }}
              required
            >
              <option value="">— Select a vehicle —</option>
              {vehiclesList
                .filter((v) => !newJobForm.customer_id || v.customer_id === parseInt(newJobForm.customer_id, 10))
                .map((v) => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>
                    {v.license_plate} — {v.make} {v.model} ({v.year}) [Owner: {v.customer_name}]
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <User size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Customer / Vehicle Owner (Required)
            </label>
            <select
              className="form-select"
              value={newJobForm.customer_id}
              onChange={(e) => {
                const cId = e.target.value;
                setNewJobForm((prev) => {
                  const currentVehicleBelongs =
                    prev.vehicle_id &&
                    vehiclesList.find((v) => v.vehicle_id === parseInt(prev.vehicle_id, 10))?.customer_id === parseInt(cId, 10);
                  return {
                    ...prev,
                    customer_id: cId,
                    vehicle_id: currentVehicleBelongs ? prev.vehicle_id : '',
                  };
                });
              }}
              required
            >
              <option value="">— Select customer —</option>
              {customersList.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.full_name} ({c.phone || c.email || `ID #${c.customer_id}`})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label">
              <Wrench size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Assign Mechanic (Optional)
            </label>
            <select
              className="form-select"
              value={newJobForm.mechanic_id}
              onChange={(e) => setNewJobForm((prev) => ({ ...prev, mechanic_id: e.target.value }))}
            >
              <option value="">— Auto-assign first available mechanic —</option>
              {mechanicsList.map((m) => (
                <option key={m.mechanic_id} value={m.mechanic_id}>
                  {m.full_name} ({m.specialization || 'General'}) — ৳{m.hourly_rate}/hr
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--status-progress-bg)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--metallic-mist)',
              fontSize: '0.82rem',
              color: 'var(--metallic-dark)',
              marginBottom: '20px',
            }}
          >
            💡 This will call the <code>create_service_job</code> stored procedure and automatically create an audit log entry.
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '13px', fontSize: '0.95rem' }}>
            <Wrench size={16} />
            Confirm &amp; Open Job Card
          </button>
        </form>
      </Modal>
    </div>
  );
}
