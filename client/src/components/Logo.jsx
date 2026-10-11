import React from 'react';

export default function Logo({ size = 40, animated = true, className = '', monoChrome = false }) {
  return (
    <div 
      className={`apex-logo-container ${className}`}
      style={{
        width: `${size}px`,
        height: `${size * 0.85}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        filter: 'drop-shadow(0 2px 4px rgba(61, 82, 160, 0.12))',
      }}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 200 170" 
        width="100%" 
        height="100%"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#FA5847" floodOpacity="0.25"/>
          </filter>
        </defs>

        {/* Garage Frame & Pillars */}
        <line x1="18" y1="158" x2="182" y2="158" stroke={monoChrome ? '#FFFFFF' : '#122544'} strokeWidth="6" strokeLinecap="round" />
        <line x1="28" y1="68" x2="28" y2="158" stroke={monoChrome ? '#FFFFFF' : '#122544'} strokeWidth="5.5" strokeLinecap="round" />
        <line x1="172" y1="68" x2="172" y2="158" stroke={monoChrome ? '#FFFFFF' : '#122544'} strokeWidth="5.5" strokeLinecap="round" />

        {/* Coral-Red Gable Roof (#FA5847) */}
        <path 
          d="M 12 76 L 100 8 L 188 76" 
          fill="none" 
          stroke={monoChrome ? '#FFFFFF' : '#FA5847'}
          strokeWidth="14" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          filter={monoChrome ? undefined : 'url(#logoGlow)'}
        />

        {/* Floating Horizontal Wrench with subtle mechanical animation */}
        <g className={animated ? 'animate-wrench-float' : ''}>
          <path 
            d="M 58 76
               C 52 69, 56 61, 64 61
               C 69 61, 74 64, 78 68
               L 122 68
               C 126 64, 131 61, 136 61
               C 144 61, 148 69, 142 76
               C 148 83, 144 91, 136 91
               C 131 91, 126 88, 122 84
               L 78 84
               C 74 88, 69 91, 64 91
               C 56 91, 52 83, 58 76 Z"
            fill="#122544"
          />
          {/* Left Spanner Mouth Cutout */}
          <polygon points="48,76 66,71 66,81" fill="#FFFFFF" />
          {/* Right Spanner Mouth Cutout */}
          <polygon points="152,76 134,71 134,81" fill="#FFFFFF" />
        </g>

        {/* Car Silhouette parked inside */}
        <g className="logo-car">
          {/* Left & Right Wheels */}
          <rect x="50" y="150" width="16" height="15" rx="5" fill="#15181C" />
          <rect x="134" y="150" width="16" height="15" rx="5" fill="#15181C" />

          {/* Side Mirrors */}
          <ellipse cx="56" cy="122" rx="5" ry="3.5" fill="#15181C" />
          <ellipse cx="144" cy="122" rx="5" ry="3.5" fill="#15181C" />

          {/* Car Cabin Roof & Body */}
          <path 
            d="M 68 102 
               C 74 98, 126 98, 132 102 
               C 137 106, 141 116, 145 125 
               C 151 126, 153 132, 152 142 
               C 152 153, 147 158, 140 158 
               L 60 158 
               C 53 158, 48 153, 48 142 
               C 47 132, 49 126, 55 125 
               C 59 116, 63 106, 68 102 Z" 
            fill="#15181C" 
          />

          {/* Windshield Glass (#C8E6F7) */}
          <path 
            d="M 73 106 
               C 80 104, 120 104, 127 106 
               C 131 110, 134 118, 137 124 
               L 63 124 
               C 66 118, 69 110, 73 106 Z" 
            fill="#C8E6F7" 
          />

          {/* Left Headlight (#E6EDF5) */}
          <ellipse cx="68" cy="142" rx="9" ry="4.5" transform="rotate(-8 68 142)" fill="#E6EDF5" />

          {/* Right Headlight (#E6EDF5) */}
          <ellipse cx="132" cy="142" rx="9" ry="4.5" transform="rotate(8 132 142)" fill="#E6EDF5" />
        </g>
      </svg>
    </div>
  );
}
