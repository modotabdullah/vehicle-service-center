import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';
import Logo from './Logo';
import { LogOut, User, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { user, logout, quickDemoLogin } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const demoAccounts = [
    { label: 'System Admin', username: 'admin1', role: 'system_admin' },
    { label: 'Service Advisor', username: 'advisor1', role: 'service_advisor' },
    { label: 'Mechanic', username: 'mech_acc1', role: 'mechanic' },
    { label: 'Customer', username: 'cust_rahim', role: 'customer' },
  ];

  return (
    <header
      style={{
        height: '68px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 1px 0 var(--border-subtle), 0 4px 16px rgba(61,82,160,0.06)',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3D52A0, #7091E6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5px',
            boxShadow: '0 4px 12px rgba(112,145,230,0.35)',
          }}
        >
          <Logo size={32} monoChrome />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1
              style={{
                fontSize: '1.25rem',
                margin: 0,
                color: 'var(--metallic-dark)',
                lineHeight: 1,
                fontWeight: 800,
                letterSpacing: '-0.04em',
              }}
            >
              ApexCare
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--status-completed-bg)',
                color: 'var(--status-completed)',
                fontSize: '0.62rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                border: '1px solid rgba(5,150,105,0.2)',
              }}
            >
              <span className="pulse-dot" />
              LIVE
            </span>
          </div>
          <span
            style={{
              fontSize: '0.65rem',
              color: 'var(--metallic-steel)',
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
            }}
          >
            Vehicle Service &amp; Fleet
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-light)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            View as
          </span>
          <select
            className="form-select"
            style={{
              padding: '6px 32px 6px 11px',
              fontSize: '0.775rem',
              height: '34px',
              backgroundColor: 'var(--metallic-silk)',
              borderColor: 'var(--metallic-mist)',
              color: 'var(--metallic-dark)',
              fontWeight: 700,
              cursor: 'pointer',
              borderRadius: 'var(--radius-xs)',
              minWidth: '160px',
            }}
            value={user?.username || ''}
            onChange={(e) => {
              if (e.target.value) {
                quickDemoLogin(e.target.value);
              }
            }}
          >
            {demoAccounts.map((acc) => (
              <option key={acc.username} value={acc.username}>
                {acc.label}
              </option>
            ))}
          </select>
        </div>

        {/* Vertical divider */}
        <div style={{ width: '1px', height: '28px', backgroundColor: 'var(--border-subtle)' }} />

        {/* User Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 12px 6px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: '#FAFBFF',
            cursor: 'default',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3D52A0, #7091E6)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '0.8rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
            }}
          >
            {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '0.815rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                lineHeight: 1.2,
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.full_name || user?.username}
            </span>
            <div style={{ marginTop: '2px' }}>
              <StatusBadge status={user?.role} type="role" />
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign Out"
          style={{
            background: 'transparent',
            border: '1.5px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.18s var(--ease-spring)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FEF2F2';
            e.currentTarget.style.borderColor = '#DC2626';
            e.currentTarget.style.color = '#DC2626';
            e.currentTarget.style.transform = 'rotate(-8deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.transform = 'rotate(0)';
          }}
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
