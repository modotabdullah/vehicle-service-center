import React from 'react';

export default function StatCard({ title, value, icon: Icon, subtitle, highlight = false, onClick, trend }) {
  return (
    <div
      onClick={onClick}
      className="bg-metallic-card"
      style={{
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: highlight ? '4px solid var(--metallic-primary)' : undefined,
      }}
    >
      {/* Decorative background circle */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: highlight
            ? 'linear-gradient(135deg, rgba(112,145,230,0.12), rgba(61,82,160,0.06))'
            : 'linear-gradient(135deg, rgba(237,232,245,0.5), rgba(240,242,250,0.3))',
          pointerEvents: 'none',
        }}
      />

      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        {Icon && (
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              background: highlight
                ? 'linear-gradient(135deg, #3D52A0, #7091E6)'
                : 'var(--metallic-silk)',
              color: highlight ? '#FFFFFF' : 'var(--metallic-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: highlight ? 'none' : '1px solid var(--metallic-mist)',
              flexShrink: 0,
              boxShadow: highlight ? '0 4px 12px rgba(112,145,230,0.35)' : 'none',
            }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span
          style={{
            fontSize: '2.1rem',
            fontWeight: 800,
            color: highlight ? 'var(--metallic-dark)' : 'var(--text-main)',
            fontFamily: 'var(--font-heading)',
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}
        >
          {value}
        </span>
        {trend && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: trend > 0 ? 'var(--status-completed)' : 'var(--status-cancelled)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-full)',
              background: trend > 0 ? 'var(--status-completed-bg)' : 'var(--status-cancelled-bg)',
            }}
          >
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <span style={{ fontSize: '0.775rem', color: 'var(--text-light)', fontWeight: 500 }}>
          {subtitle}
        </span>
      )}

      {/* Bottom accent line for highlight cards */}
      {highlight && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, var(--metallic-dark), var(--metallic-primary))',
            opacity: 0.6,
          }}
        />
      )}
    </div>
  );
}
