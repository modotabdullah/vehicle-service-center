import React from 'react';

export default function StatCard({ title, value, icon: Icon, subtitle, highlight = false, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-metallic-card"
      style={{
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: highlight ? '4px solid var(--metallic-primary)' : '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {title}
        </span>
        {Icon && (
          <div 
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--metallic-silk)',
              color: 'var(--metallic-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--metallic-mist)',
            }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <h2 style={{ fontSize: '1.9rem', color: 'var(--text-main)', margin: 0 }}>
          {value}
        </h2>
      </div>

      {subtitle && (
        <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}
