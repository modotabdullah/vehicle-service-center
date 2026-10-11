import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ShieldCheck, History, ArrowRight } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (tableFilter) params.table_name = tableFilter;
      const data = await api.audit.getLogs(params);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [tableFilter]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--metallic-dark)', marginBottom: '4px' }}>
            System Audit Trail & Security Logs
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Automated database trigger logs capturing invoice modifications, stock overrides, and admin operations.
          </p>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['', 'invoice', 'customer', 'inventory_part', 'mechanic'].map((tbl) => (
            <button
              key={tbl}
              className="btn btn-sm"
              style={{
                backgroundColor: tableFilter === tbl ? 'var(--metallic-dark)' : 'var(--metallic-silk)',
                color: tableFilter === tbl ? '#FFFFFF' : 'var(--metallic-dark)',
                textTransform: 'capitalize',
                fontWeight: tableFilter === tbl ? 700 : 500,
              }}
              onClick={() => setTableFilter(tbl)}
            >
              {tbl === '' ? 'All Tables' : tbl.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Operator</th>
              <th>Operation</th>
              <th>Table Name</th>
              <th>Record ID</th>
              <th>Value Changes (JSON Diffs)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Loading database audit records...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No audit trail records found.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isUpdate = log.operation === 'update';
                const isDelete = log.operation === 'delete';
                return (
                  <tr key={log.audit_id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(log.action_timestamp).toLocaleString()}
                    </td>
                    <td>
                      <div>
                        <strong>{log.username || 'System Trigger'}</strong>
                        {log.role && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--metallic-steel)' }}>
                            {log.role}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: isUpdate ? 'var(--status-progress-bg)' : isDelete ? '#FDE8E9' : 'var(--status-completed-bg)',
                          color: isUpdate ? 'var(--metallic-dark)' : isDelete ? '#D13438' : '#108A56',
                          textTransform: 'uppercase',
                          fontSize: '0.7rem',
                        }}
                      >
                        {log.operation}
                      </span>
                    </td>
                    <td>
                      <code>{log.table_name}</code>
                    </td>
                    <td>
                      <strong>#{log.record_id}</strong>
                    </td>
                    <td style={{ maxWidth: '340px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
                        {log.old_value && (
                          <div style={{ color: '#D13438', wordBreak: 'break-all' }}>
                            <span style={{ fontWeight: 600 }}>Old: </span>
                            <code>{JSON.stringify(log.old_value)}</code>
                          </div>
                        )}
                        {log.new_value && (
                          <div style={{ color: '#108A56', wordBreak: 'break-all' }}>
                            <span style={{ fontWeight: 600 }}>New: </span>
                            <code>{JSON.stringify(log.new_value)}</code>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
