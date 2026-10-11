import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wrench, Shield, UserCheck, Key, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, quickDemoLogin } = useAuth();
  const [username, setUsername] = useState('admin1');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoUser) => {
    setError('');
    setLoading(true);
    try {
      await quickDemoLogin(demoUser);
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4F6FC',
        padding: '24px',
        backgroundImage: 'radial-gradient(#ADBBDA 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div 
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--metallic-mist)',
          overflow: 'hidden',
        }}
      >
        {/* Header with Metallic Chic Gradient */}
        <div 
          style={{
            padding: '36px 32px 28px',
            background: 'linear-gradient(135deg, #3D52A0 0%, #7091E6 100%)',
            color: '#FFFFFF',
            textAlign: 'center',
          }}
        >
          <div 
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <Wrench size={28} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: '1.8rem', color: '#FFFFFF', marginBottom: '6px' }}>
            ApexCare Service
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--metallic-silk)', opacity: 0.9 }}>
            Enterprise Vehicle Workshop & Fleet Suite
          </p>
        </div>

        {/* Content Body */}
        <div style={{ padding: '32px' }}>
          {error && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 14px',
                backgroundColor: '#FDE8E9',
                border: '1px solid #D13438',
                borderRadius: 'var(--radius-sm)',
                color: '#D13438',
                fontSize: '0.85rem',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--metallic-steel)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px', textAlign: 'center' }}>
              Instant Demo Access (1-Click)
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickDemo('admin1')}
                style={{ justifyContent: 'flex-start' }}
              >
                <Shield size={14} color="var(--metallic-dark)" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickDemo('advisor1')}
                style={{ justifyContent: 'flex-start' }}
              >
                <UserCheck size={14} color="var(--metallic-dark)" />
                <span>Advisor</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickDemo('mech_acc1')}
                style={{ justifyContent: 'flex-start' }}
              >
                <Wrench size={14} color="var(--metallic-dark)" />
                <span>Mechanic</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickDemo('cust_rahim')}
                style={{ justifyContent: 'flex-start' }}
              >
                <Key size={14} color="var(--metallic-dark)" />
                <span>Customer</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
