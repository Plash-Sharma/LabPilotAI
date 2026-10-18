import React from 'react';

export interface LabPilotLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LabPilotLogo: React.FC<LabPilotLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-10 h-10 rounded-xl',
    xl: 'w-12 h-12 rounded-2xl',
  };

  const containerClasses = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`relative flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/25 overflow-hidden select-none ${containerClasses} ${className}`}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="lp-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="lp-core-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>

        {/* Squircle base */}
        <rect width="40" height="40" rx="10" fill="url(#lp-bg-grad)" />
        <rect
          x="0.75"
          y="0.75"
          width="38.5"
          height="38.5"
          rx="9.25"
          stroke="#FFFFFF"
          strokeOpacity="0.3"
          strokeWidth="1.25"
        />

        {/* Lab Beaker Rim & Neck */}
        <path
          d="M17 8.5H23 M20 8.5V13"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Aerodynamic Lab-Pilot Flask Delta Wings */}
        <path
          d="M17.5 13L9.5 25.5C8.8 26.6 9.6 28 10.9 28H29.1C30.4 28 31.2 26.6 30.5 25.5L22.5 13H17.5Z"
          fill="#FFFFFF"
          fillOpacity="0.18"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />

        {/* AI Quantum Guidance Star Core */}
        <circle cx="20" cy="21.5" r="2.8" fill="#FFFFFF" />
        <path
          d="M20 16.5V19.5 M20 23.5V26.5 M15 21.5H18 M22 21.5H25"
          stroke="url(#lp-core-glow)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Pilot Propulsion Vector */}
        <path
          d="M16 31.5L20 29.5L24 31.5"
          stroke="url(#lp-core-glow)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
