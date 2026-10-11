import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';
import Customers from './pages/Customers';
import Mechanics from './pages/Mechanics';
import AuditLogs from './pages/AuditLogs';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1A2038 0%, #3D52A0 60%, #7091E6 100%)',
          backgroundSize: '300% 300%',
          animation: 'gradientShift 6s ease infinite',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            border: '1px solid rgba(255,255,255,0.2)',
            animation: 'floatY 2s ease-in-out infinite',
          }}
        >
          <div className="spinner" style={{ width: '28px', height: '28px', borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#FFFFFF', borderWidth: '3px' }} />
        </div>
        <div
          style={{
            color: '#FFFFFF',
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '6px',
          }}
        >
          ApexCare
        </div>
        <div
          style={{
            color: 'rgba(237,232,245,0.7)',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Initializing service engine...
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Login />;
  }

  // Render Page Content
  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'jobs':
        return <Jobs />;
      case 'inventory':
        return <Inventory />;
      case 'invoices':
        return <Invoices />;
      case 'customers':
        return <Customers />;
      case 'mechanics':
        return <Mechanics />;
      case 'audit':
        return <AuditLogs />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main 
          style={{
            flex: 1,
            padding: '32px 36px',
            maxWidth: '1440px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
