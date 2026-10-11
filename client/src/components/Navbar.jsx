import React from 'react';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';
import { Wrench, LogOut, User, RefreshCw } from 'lucide-react';

export default function Navbar() {
  const { user, logout, quickDemoLogin } = useAuth();

  const demoAccounts = [
    { label: 'Admin (admin1)', username: 'admin1', role: 'system_admin' },
    { label: 'Advisor (advisor1)', username: 'advisor1', role: 'service_advisor' },
    { label: 'Mechanic (mech_acc1)', username: 'mech_acc1', role: 'mechanic' },
    { label: 'Customer (cust_rahim)', username: 'cust_rahim', role: 'customer' },
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
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div 
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3D52A0 0%, #7091E6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: 'var(--shadow-metallic)',
          }}
        >
          <Wrench size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--metallic-dark)', lineHeight: 1 }}>
            ApexCare
          </h1>
          <span style={{ fontSize: '0.7rem', color: 'var(--metallic-steel)', fontWeight: 600, letterSpacing: '0.04em' }}>
            VEHICLE SERVICE SUITE
          </span>
        </div>
      </div>

      {/* User Controls & Demo Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Quick Role Switcher for seamless testing */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Demo As:
          </span>
          <select
            className="form-select"
            style={{
              padding: '6px 12px',
              fontSize: '0.775rem',
              height: '34px',
              backgroundColor: 'var(--metallic-silk)',
              borderColor: 'var(--metallic-mist)',
              color: 'var(--metallic-dark)',
              fontWeight: 600,
              cursor: 'pointer',
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

        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Current User Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: 'var(--metallic-silk)',
              color: 'var(--metallic-dark)',
              border: '1px solid var(--metallic-mist)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
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
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '7px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FDE8E9';
            e.currentTarget.style.borderColor = '#D13438';
            e.currentTarget.style.color = '#D13438';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
