import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Receipt, DollarSign, Calendar, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

export default function Invoices() {
  const { user, hasRole } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentMsg, setPaymentMsg] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') {
        params.payment_status = statusFilter;
      }
      const data = await api.invoices.getAll(params);
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const openInvoiceDetails = async (invoiceId) => {
    setModalLoading(true);
    setPaymentMsg(null);
    try {
      const data = await api.invoices.getById(invoiceId);
      setSelectedInvoice(data);
      // Pre-fill remaining balance
      const totalPaid = (data.payments || []).reduce((acc, p) => acc + parseFloat(p.amount_paid || 0), 0);
      const balance = Math.max(0, parseFloat(data.grand_total) - totalPaid);
      setPaymentAmount(balance > 0 ? balance.toFixed(2) : '');
    } catch (err) {
      alert(`Could not load invoice: ${err.message}`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentAmount) return;
    try {
      await api.invoices.processPayment(selectedInvoice.invoice_id, {
        amount_paid: parseFloat(paymentAmount),
        payment_method: paymentMethod,
      });
      setPaymentMsg({ type: 'success', text: 'Payment processed successfully via stored procedure!' });
      openInvoiceDetails(selectedInvoice.invoice_id);
      fetchInvoices();
    } catch (err) {
      setPaymentMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--metallic-dark)', marginBottom: '4px' }}>
          Invoices & Billing Accounts
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Review service statements, itemized repair taxes, and payment audit records.
        </p>
      </div>

      {/* Filter Tabs */}
      <div 
        style={{
          display: 'flex',
          gap: '8px',
          backgroundColor: '#FFFFFF',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {['all', 'unpaid', 'partial', 'paid'].map((st) => (
          <button
            key={st}
            className="btn btn-sm"
            style={{
              backgroundColor: statusFilter === st ? 'var(--metallic-dark)' : 'transparent',
              color: statusFilter === st ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: statusFilter === st ? 700 : 500,
              textTransform: 'capitalize',
            }}
            onClick={() => setStatusFilter(st)}
          >
            {st === 'all' ? 'All Invoices' : st}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Job #</th>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Invoice Date</th>
              <th>Grand Total</th>
              <th>Paid Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: '16px', borderRadius: '6px' }} /></td>
                  ))}
                </tr>
              ))
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan="9">
                  <div className="empty-state">
                    <div className="empty-state-icon"><Receipt size={28} /></div>
                    <h4>No invoices found</h4>
                    <p>Generate an invoice from a completed job card to see it here.</p>
                  </div>
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const totalPaid = parseFloat(inv.total_paid || 0);
                return (
                  <tr key={inv.invoice_id}>
                    <td>
                      <strong style={{ color: 'var(--metallic-dark)', fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 800 }}>
                        INV-{inv.invoice_id.toString().padStart(4, '0')}
                      </strong>
                    </td>
                    <td>
                      <span style={{ color: 'var(--metallic-primary)', fontWeight: 600 }}>
                        Job #{inv.job_id}
                      </span>
                    </td>
                    <td>{inv.customer_name}</td>
                    <td>{inv.license_plate}</td>
                    <td>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                    <td>
                      <strong>৳ {parseFloat(inv.grand_total).toLocaleString()}</strong>
                    </td>
                    <td>
                      <span style={{ color: totalPaid > 0 ? '#108A56' : 'var(--text-muted)', fontWeight: 600 }}>
                        ৳ {totalPaid.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={inv.payment_status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => openInvoiceDetails(inv.invoice_id)}
                      >
                        View & Pay
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice Details & Payment Modal */}
      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice ? `Invoice #INV-${selectedInvoice.invoice_id.toString().padStart(4, '0')}` : 'Invoice'}
        maxWidth="700px"
      >
        {selectedInvoice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {paymentMsg && (
              <div className={`alert alert-${paymentMsg.type}`}>
                {paymentMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{paymentMsg.text}</span>
              </div>
            )}

            {/* Bill Header */}
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: 'var(--metallic-silk)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Billed To:</span>
                <div style={{ fontWeight: 700, color: 'var(--metallic-dark)' }}>{selectedInvoice.customer_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedInvoice.customer_phone}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedInvoice.license_plate} ({selectedInvoice.make} {selectedInvoice.model})</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status & Date:</span>
                <div style={{ marginTop: '2px' }}>
                  <StatusBadge status={selectedInvoice.payment_status} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {new Date(selectedInvoice.invoice_date).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Line Items Breakdown */}
            <div>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--metallic-dark)', marginBottom: '8px' }}>
                Itemized Summary
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span>Total Labor Tasks</span>
                  <strong>৳ {parseFloat(selectedInvoice.total_labor_cost || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span>Spare Parts Consumed</span>
                  <strong>৳ {parseFloat(selectedInvoice.total_parts_cost || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span>Sales Tax Applied</span>
                  <span>৳ {parseFloat(selectedInvoice.tax_amount || 0).toLocaleString()}</span>
                </div>
                <div 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    fontSize: '1.05rem',
                    color: 'var(--metallic-dark)',
                    fontWeight: 700,
                  }}
                >
                  <span>Grand Total</span>
                  <span>৳ {parseFloat(selectedInvoice.grand_total).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payments Log */}
            <div>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--metallic-dark)', marginBottom: '8px' }}>
                Payments Recorded
              </h4>
              {selectedInvoice.payments?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedInvoice.payments.map((p) => (
                    <div key={p.payment_id} className="line-item">
                      <div>
                        <strong style={{ color: 'var(--metallic-dark)' }}>৳ {parseFloat(p.amount_paid).toLocaleString()}</strong>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '8px', textTransform: 'capitalize', fontSize: '0.8rem' }}>
                          via {p.payment_method.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-small text-muted">
                        {new Date(p.payment_date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>
                  No payments recorded yet. Use the form below to record a payment.
                </div>
              )}
            </div>

            {/* Payment Processing Form (If unpaid or partial) */}
            {selectedInvoice.payment_status !== 'paid' && (
              <form 
                onSubmit={handleProcessPayment}
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--metallic-silk)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--metallic-mist)',
                }}
              >
                <h4 style={{ fontSize: '0.9rem', color: 'var(--metallic-dark)', marginBottom: '12px' }}>
                  Process Payment (Stored Procedure)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Payment Amount (৳)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-select"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Credit / Debit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="mobile_banking">Mobile Banking (bKash/Nagad)</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Submit Payment
                </button>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
