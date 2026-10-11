import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  Wrench,
  AlertTriangle,
  Receipt,
  DollarSign,
  Car,
  Users,
  PlusCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await api.dashboard.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading dashboard metrics...
      </div>
    );
  }

  const isCustomer = user?.role === 'customer';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header Banner */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.75rem', color: 'var(--metallic-dark)', marginBottom: '4px' }}>
            Welcome back, {user?.full_name || user?.username}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isCustomer 
              ? 'Here is an overview of your registered vehicles and active service tickets.' 
              : 'Real-time overview of vehicle service throughput, parts inventory, and financials.'}
          </p>
        </div>

        {!isCustomer && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setActiveTab('jobs')}
            >
              <PlusCircle size={16} />
              <span>New Job Card</span>
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setActiveTab('invoices')}
            >
              <Receipt size={16} />
              <span>Billing</span>
            </button>
          </div>
        )}
      </div>

      {/* Low Stock Warning Alert Banner (if applicable for staff) */}
      {!isCustomer && stats?.lowStockParts > 0 && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            backgroundColor: '#FFF4E5',
            border: '1px solid #FFE082',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#FFE082',
                color: '#B78103',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <strong style={{ color: '#B78103', fontSize: '0.9rem' }}>
                Inventory Alert: {stats.lowStockParts} spare parts have hit reorder levels!
              </strong>
              <p style={{ color: '#8F6602', fontSize: '0.8rem' }}>
                Automated stock monitoring detected critical part quantities.
              </p>
            </div>
          </div>
          <button 
            className="btn btn-sm btn-secondary"
            onClick={() => setActiveTab('inventory')}
          >
            <span>View Low Stock</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Metric Stat Cards */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
        }}
      >
        {isCustomer ? (
          <>
            <StatCard
              title="Registered Vehicles"
              value={stats?.totalVehicles || 0}
              icon={Car}
              subtitle="Linked to your account"
            />
            <StatCard
              title="Active Repair Jobs"
              value={stats?.activeJobs || 0}
              icon={Wrench}
              highlight={true}
              subtitle="Vehicles in bay or inspection"
            />
            <StatCard
              title="Pending Invoices"
              value={stats?.pendingInvoices || 0}
              icon={Receipt}
              subtitle="Unsettled bills"
            />
            <StatCard
              title="Lifetime Spend"
              value={`৳ ${(stats?.totalSpent || 0).toLocaleString()}`}
              icon={DollarSign}
              subtitle="Total service payments"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Active Service Jobs"
              value={stats?.activeJobs || 0}
              icon={Wrench}
              highlight={true}
              subtitle="Pending & in-progress bays"
              onClick={() => setActiveTab('jobs')}
            />
            <StatCard
              title="Low Stock Alert"
              value={stats?.lowStockParts || 0}
              icon={AlertTriangle}
              subtitle="Parts at or below reorder level"
              onClick={() => setActiveTab('inventory')}
            />
            <StatCard
              title="Total Revenue Collected"
              value={`৳ ${(stats?.totalRevenue || 0).toLocaleString()}`}
              icon={TrendingUp}
              subtitle="All recorded payments"
              onClick={() => setActiveTab('invoices')}
            />
            <StatCard
              title="Unsettled Invoices"
              value={stats?.pendingInvoices || 0}
              icon={Receipt}
              subtitle="Unpaid and partial balances"
              onClick={() => setActiveTab('invoices')}
            />
          </>
        )}
      </div>

      {/* Recent Repairs Table */}
      {!isCustomer && stats?.recentJobs && stats.recentJobs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--metallic-dark)' }}>
              Recent Service Cards
            </h3>
            <button 
              className="btn btn-sm btn-outline"
              onClick={() => setActiveTab('jobs')}
            >
              <span>View All Jobs</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>Mechanic</th>
                  <th>Estimated Cost</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentJobs.map((job) => (
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
                          {job.make} {job.model}
                        </div>
                      </div>
                    </td>
                    <td>{job.customer_name}</td>
                    <td>{job.mechanic_name || <em style={{ color: 'var(--text-light)' }}>Unassigned</em>}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        ৳ {(parseFloat(job.total_labor_cost || 0) + parseFloat(job.total_parts_cost || 0)).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={job.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => setActiveTab('jobs')}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
