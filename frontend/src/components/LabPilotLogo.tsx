import React from 'react';

export interface LabPilotLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LabPilotLogo: React.FC<LabPilotLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const containerSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none overflow-hidden ${containerSize} ${className}`}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="lpCompBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="lpScreenBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="100%" stopColor="#1C2541" />
          </linearGradient>
          <linearGradient id="lpSparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67E8F9" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>

        {/* Background rounded squircle */}
        <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#lpCompBg)" />
        <rect
          x="2.75"
          y="2.75"
          width="58.5"
          height="58.5"
          rx="15.25"
          stroke="#FFFFFF"
          strokeOpacity="0.25"
          strokeWidth="1.5"
        />

        {/* Computer monitor base / stand */}
        <path d="M25 47h14 M32 40v7" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />

        {/* Computer monitor body */}
        <rect
          x="13"
          y="15"
          width="38"
          height="26"
          rx="5"
          fill="#FFFFFF"
          fillOpacity="0.12"
          stroke="#FFFFFF"
          strokeWidth="2.75"
        />

        {/* Screen inside */}
        <rect x="16.5" y="18.5" width="31" height="19" rx="2.5" fill="url(#lpScreenBg)" />

        {/* Code / Lab Pulse on screen */}
        <path d="M21 24h9 M21 28h15 M21 32h7" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />

        {/* AI Lab Sparkle (Top-Right) */}
        <path
          d="M48 7.5c.5 3 2.5 5 5.5 5.5-3 .5-5 2.5-5.5 5.5-.5-3-2.5-5-5.5-5.5 3-.5 5-2.5 5.5-5.5z"
          fill="url(#lpSparkleGrad)"
        />
        <circle cx="41" cy="8.5" r="1.5" fill="#A5F3FC" />
      </svg>
    </div>
  );
};
