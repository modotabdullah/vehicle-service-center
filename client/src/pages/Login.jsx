import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { Shield, UserCheck, Key, Wrench, ArrowRight, AlertCircle, Lock, User } from 'lucide-react';

export default function Login() {
  const { login, quickDemoLogin } = useAuth();
  const [username, setUsername] = useState('admin1');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

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

  const demoRoles = [
    { user: 'admin1', label: 'System Admin', icon: Shield, color: '#3D52A0', bg: '#EDE8F5' },
    { user: 'advisor1', label: 'Service Advisor', icon: UserCheck, color: '#059669', bg: '#ECFDF5' },
    { user: 'mech_acc1', label: 'Mechanic', icon: Wrench, color: '#D97706', bg: '#FFFBEB' },
    { user: 'cust_rahim', label: 'Customer', icon: Key, color: '#7091E6', bg: '#EDE8F5' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'linear-gradient(135deg, #1A2038 0%, #2D3A6B 40%, #3D52A0 70%, #7091E6 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 12s ease infinite',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(112,145,230,0.2) 0%, transparent 70%)',
          animation: 'floatY 8s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(61,82,160,0.25) 0%, transparent 70%)',
          animation: 'floatY 10s ease-in-out infinite reverse',
          pointerEvents: 'none',
        }}
      />

      {/* Dot grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }}
      />

      {/* Card */}
      <div
        className="animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '40px 36px 32px',
            background: 'linear-gradient(135deg, #3D52A0 0%, #7091E6 100%)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Sheen overlay */}
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)',
              pointerEvents: 'none',
            }}
          />

          {/* Logo container */}
          <div
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '22px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 12px 32px rgba(18, 37, 68, 0.3), 0 0 0 6px rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              padding: '8px',
              animation: 'floatY 4s ease-in-out infinite',
            }}
          >
            <Logo size={70} />
          </div>

          <h1 style={{ fontSize: '1.85rem', color: '#FFFFFF', marginBottom: '6px', letterSpacing: '-0.03em' }}>
            ApexCare Service
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'rgba(237,232,245,0.85)', fontWeight: 500 }}>
            Enterprise Vehicle Workshop &amp; Fleet Management Suite
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '32px 36px 36px' }}>
          {error && (
            <div
              className="alert alert-error"
              style={{ marginBottom: '20px', animation: 'slideUp 0.3s var(--ease-spring)' }}
            >
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {/* Username */}
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: focusedField === 'user' ? 'var(--metallic-primary)' : 'var(--text-light)',
                    transition: 'color 0.18s ease',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('user')}
                  onBlur={() => setFocusedField(null)}
                  required
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: focusedField === 'pass' ? 'var(--metallic-primary)' : 'var(--text-light)',
                    transition: 'color 0.18s ease',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
                  required
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', fontSize: '0.95rem', fontWeight: 700 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: 'var(--metallic-steel)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: '12px',
                textAlign: 'center',
              }}
            >
              ⚡ Instant Demo Access
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {demoRoles.map(({ user: demoUser, label, icon: DemoIcon, color, bg }) => (
                <button
                  key={demoUser}
                  type="button"
                  onClick={() => handleQuickDemo(demoUser)}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 13px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${color}25`,
                    backgroundColor: bg,
                    color: color,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.18s var(--ease-spring)',
                    fontFamily: 'var(--font-body)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 16px ${color}30`;
                    e.currentTarget.style.borderColor = color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = `${color}25`;
                  }}
                >
                  <DemoIcon size={14} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
