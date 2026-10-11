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
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F4F6FC',
          color: 'var(--metallic-dark)',
          fontWeight: 600,
          fontFamily: 'var(--font-heading)',
          fontSize: '1.2rem',
        }}
      >
        Initializing ApexCare Engine...
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
