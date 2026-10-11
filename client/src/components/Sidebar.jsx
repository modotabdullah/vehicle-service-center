import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Wrench,
  Package,
  Receipt,
  Users,
  UserCheck,
  ShieldCheck,
  Car,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, hasRole } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['system_admin', 'service_advisor', 'mechanic', 'customer'],
    },
    {
      id: 'jobs',
      label: user?.role === 'customer' ? 'My Repairs' : 'Service Jobs',
      icon: Wrench,
      roles: ['system_admin', 'service_advisor', 'mechanic', 'customer'],
    },
    {
      id: 'inventory',
      label: 'Parts & Inventory',
      icon: Package,
      roles: ['system_admin', 'service_advisor', 'mechanic'],
    },
    {
      id: 'invoices',
      label: user?.role === 'customer' ? 'My Invoices' : 'Billing & Invoices',
      icon: Receipt,
      roles: ['system_admin', 'service_advisor', 'customer'],
    },
    {
      id: 'customers',
      label: 'Customers & Fleet',
      icon: Users,
      roles: ['system_admin', 'service_advisor'],
    },
    {
      id: 'mechanics',
      label: 'Mechanics Roster',
      icon: UserCheck,
      roles: ['system_admin', 'service_advisor'],
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: ShieldCheck,
      roles: ['system_admin'],
    },
  ];

  const visibleItems = navItems.filter((item) => hasRole(...item.roles));

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 14px',
        gap: '6px',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '0 12px 14px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--metallic-steel)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Navigation
        </span>
      </div>

      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: isActive ? 'var(--metallic-silk)' : 'transparent',
              color: isActive ? 'var(--metallic-dark)' : 'var(--text-muted)',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              borderLeft: isActive ? '3px solid var(--metallic-primary)' : '3px solid transparent',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'var(--metallic-light)';
                e.currentTarget.style.color = 'var(--text-main)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }
            }}
          >
            <Icon size={18} color={isActive ? 'var(--metallic-primary)' : 'currentColor'} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
