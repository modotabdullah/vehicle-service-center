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
        width: '238px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px 24px',
        gap: '3px',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Nav label */}
      <div style={{ padding: '0 10px 10px', marginBottom: '2px' }}>
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 800,
            color: 'var(--metallic-steel)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Navigation
        </span>
      </div>

      {visibleItems.map((item, idx) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 13px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: isActive
                ? 'linear-gradient(135deg, var(--metallic-silk), #E8E2F8)'
                : 'transparent',
              background: isActive
                ? 'linear-gradient(135deg, var(--metallic-silk) 0%, #EBE5F8 100%)'
                : 'transparent',
              color: isActive ? 'var(--metallic-dark)' : 'var(--text-muted)',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.855rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.18s var(--ease-spring)',
              borderLeft: isActive
                ? '3px solid var(--metallic-primary)'
                : '3px solid transparent',
              position: 'relative',
              overflow: 'hidden',
              animation: `slideInLeft 0.3s ${idx * 0.04 + 0.05}s var(--ease-spring) both`,
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.005em',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--metallic-light)';
                e.currentTarget.style.color = 'var(--text-main)';
                e.currentTarget.style.borderLeftColor = 'var(--metallic-mist)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderLeftColor = 'transparent';
              }
            }}
          >
            {/* Icon with glow for active */}
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: isActive
                  ? 'linear-gradient(135deg, #3D52A0, #7091E6)'
                  : 'transparent',
                color: isActive ? '#FFFFFF' : 'currentColor',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                boxShadow: isActive ? '0 3px 8px rgba(112,145,230,0.35)' : 'none',
              }}
            >
              <Icon size={16} />
            </span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {/* Active dot */}
            {isActive && (
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--metallic-primary)',
                  flexShrink: 0,
                }}
              />
            )}
          </button>
        );
      })}

      {/* Bottom decorative gradient */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: 'linear-gradient(to top, rgba(237,232,245,0.3), transparent)',
          pointerEvents: 'none',
        }}
      />
    </aside>
  );
}
