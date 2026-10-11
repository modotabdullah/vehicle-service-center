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
  Activity,
  Zap,
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Skeleton header */}
        <div className="skeleton" style={{ height: '36px', width: '260px', borderRadius: '10px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-metallic-card skeleton" style={{ height: '120px' }} />
          ))}
        </div>
      </div>
    );
  }

  const isCustomer = user?.role === 'customer';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Welcome Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '28px 32px',
          background: 'linear-gradient(135deg, #3D52A0 0%, #5B72CB 50%, #7091E6 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 10s ease infinite',
          borderRadius: 'var(--radius-lg)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-metallic)',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            pointerEvents: 'none',
          }}
        />
        {/* Glowing orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-40px',
            left: '30%',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.9)',
                fontSize: '0.7rem',
                fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Activity size={11} />
              {isCustomer ? 'Customer Portal' : 'Operations Center'}
            </span>
          </div>
          <h2
            style={{
              fontSize: '1.85rem',
              color: '#FFFFFF',
              marginBottom: '6px',
              letterSpacing: '-0.03em',
            }}
          >
            Welcome back, {user?.full_name?.split(' ')[0] || user?.username}! 👋
          </h2>
          <p style={{ color: 'rgba(237,232,245,0.85)', fontSize: '0.9rem', fontWeight: 500, maxWidth: '480px' }}>
            {isCustomer
              ? 'Track your registered vehicles, active service tickets, and billing history.'
              : 'Real-time overview of vehicle service throughput, parts inventory, and financials.'}
          </p>
        </div>

        {!isCustomer && (
          <div style={{ display: 'flex', gap: '10px', position: 'relative', zIndex: 1 }}>
            <button
              className="btn"
              onClick={() => setActiveTab('jobs')}
              style={{
                backgroundColor: '#FFFFFF',
                color: 'var(--metallic-dark)',
                fontWeight: 700,
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
            >
              <PlusCircle size={16} />
              <span>New Job Card</span>
            </button>
            <button
              className="btn"
              onClick={() => setActiveTab('invoices')}
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                border: '1.5px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(4px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Receipt size={16} />
              <span>Billing</span>
            </button>
          </div>
        )}
      </div>

      {/* Low Stock Alert */}
      {!isCustomer && stats?.lowStockParts > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            backgroundColor: '#FFFBEB',
            border: '1.5px solid rgba(217,119,6,0.3)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 2px 8px rgba(217,119,6,0.1)',
            animation: 'slideUp 0.4s 0.1s var(--ease-spring) both',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#FEF3C7',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid rgba(217,119,6,0.25)',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <strong style={{ color: '#92400E', fontSize: '0.9rem', display: 'block' }}>
                ⚠ Inventory Alert — {stats.lowStockParts} parts at critical reorder level
              </strong>
              <span style={{ color: '#B45309', fontSize: '0.8rem' }}>
                Automated stock monitoring detected low quantities. Review and restock soon.
              </span>
            </div>
          </div>
          <button
            className="btn btn-sm"
            onClick={() => setActiveTab('inventory')}
            style={{
              backgroundColor: '#D97706',
              color: '#FFFFFF',
              border: 'none',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#B45309';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#D97706';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>View Stock</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        {isCustomer ? (
          <>
            <StatCard title="Registered Vehicles" value={stats?.totalVehicles || 0} icon={Car} subtitle="Linked to your account" />
            <StatCard title="Active Repair Jobs" value={stats?.activeJobs || 0} icon={Wrench} highlight subtitle="Vehicles in bay or inspection" />
            <StatCard title="Pending Invoices" value={stats?.pendingInvoices || 0} icon={Receipt} subtitle="Unsettled bills" />
            <StatCard title="Lifetime Spend" value={`৳ ${(stats?.totalSpent || 0).toLocaleString()}`} icon={DollarSign} subtitle="Total service payments" />
          </>
        ) : (
          <>
            <StatCard
              title="Active Service Jobs"
              value={stats?.activeJobs || 0}
              icon={Wrench}
              highlight
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
              title="Total Revenue"
              value={`৳ ${(stats?.totalRevenue || 0).toLocaleString()}`}
              icon={TrendingUp}
              subtitle="All recorded payments collected"
              onClick={() => setActiveTab('invoices')}
            />
            <StatCard
              title="Unsettled Invoices"
              value={stats?.pendingInvoices || 0}
              icon={Receipt}
              subtitle="Unpaid & partial balances"
              onClick={() => setActiveTab('invoices')}
            />
          </>
        )}
      </div>

      {/* Recent Repairs Table */}
      {!isCustomer && stats?.recentJobs && stats.recentJobs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeIn 0.5s 0.2s var(--ease-spring) both' }}>
          <div className="section-header">
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--metallic-dark)', fontWeight: 800 }}>
                Recent Service Cards
              </h3>
              <p className="section-subtitle">Latest jobs opened at the workshop</p>
            </div>
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
                        <div className="text-small text-muted">{job.make} {job.model}</div>
                      </div>
                    </td>
                    <td>{job.customer_name}</td>
                    <td>
                      {job.mechanic_name || (
                        <em style={{ color: 'var(--text-light)', fontSize: '0.82rem' }}>Unassigned</em>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--metallic-dark)' }}>
                        ৳ {(parseFloat(job.total_labor_cost || 0) + parseFloat(job.total_parts_cost || 0)).toLocaleString()}
                      </strong>
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
