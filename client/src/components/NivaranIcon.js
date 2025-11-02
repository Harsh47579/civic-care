import React from 'react';

const NivaranIcon = ({ size = 24, className = "", variant = "default" }) => {
  const iconSizes = {
    small: 16,
    medium: 24,
    large: 32,
    xl: 40,
    xxl: 48
  };

  const actualSize = typeof size === 'string' ? iconSizes[size] || 24 : size;

  const iconVariants = {
    default: {
      gradient: "url(#nivaranGradient)",
      stroke: "#3b82f6"
    },
    white: {
      gradient: "url(#nivaranGradientWhite)",
      stroke: "#ffffff"
    },
    primary: {
      gradient: "url(#nivaranGradientPrimary)",
      stroke: "#2563eb"
    }
  };

  const currentVariant = iconVariants[variant] || iconVariants.default;

  return (
    <div className={`relative ${className}`}>
      {/* 3D Blue square background with enhanced shadows */}
      <div 
        className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300"
        style={{ 
          width: actualSize, 
          height: actualSize,
          boxShadow: `
            0 20px 40px rgba(59, 130, 246, 0.3),
            0 10px 20px rgba(59, 130, 246, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1)
          `
        }}
      >
        {/* Inner glow effect */}
        <div 
          className="absolute inset-1 rounded-lg bg-gradient-to-br from-white/20 to-transparent"
          style={{ borderRadius: '0.75rem' }}
        ></div>
        
        <svg
          width={actualSize * 0.75}
          height={actualSize * 0.75}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          <defs>
            {/* Enhanced gradients for 3D effect */}
            <linearGradient id="nivaranGradientWhite" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#f8fafc" />
              <stop offset="70%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            
            <linearGradient id="nivaranBlue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            
            <linearGradient id="nivaranBlueDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>
            
            {/* Drop shadow filter */}
            <filter id="dropshadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.3)"/>
            </filter>
            
            {/* Inner shadow filter */}
            <filter id="innershadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="rgba(255,255,255,0.5)"/>
            </filter>
          </defs>

          {/* Hand base - enhanced 3D palm */}
          <ellipse
            cx="24"
            cy="36"
            rx="18"
            ry="8"
            fill="url(#nivaranGradientWhite)"
            stroke="#ffffff"
            strokeWidth="1.5"
            filter="url(#dropshadow)"
          />
          
          {/* Hand palm highlight */}
          <ellipse
            cx="24"
            cy="34"
            rx="12"
            ry="4"
            fill="rgba(255, 255, 255, 0.3)"
            stroke="none"
          />
          
          {/* Hand fingers with 3D effect */}
          <ellipse cx="12" cy="32" rx="3" ry="6" fill="url(#nivaranGradientWhite)" stroke="#ffffff" strokeWidth="1.5" filter="url(#dropshadow)" />
          <ellipse cx="18" cy="30" rx="3" ry="6" fill="url(#nivaranGradientWhite)" stroke="#ffffff" strokeWidth="1.5" filter="url(#dropshadow)" />
          <ellipse cx="30" cy="30" rx="3" ry="6" fill="url(#nivaranGradientWhite)" stroke="#ffffff" strokeWidth="1.5" filter="url(#dropshadow)" />
          <ellipse cx="36" cy="32" rx="3" ry="6" fill="url(#nivaranGradientWhite)" stroke="#ffffff" strokeWidth="1.5" filter="url(#dropshadow)" />
          
          {/* Finger highlights */}
          <ellipse cx="12" cy="30" rx="1.5" ry="3" fill="rgba(255, 255, 255, 0.4)" />
          <ellipse cx="18" cy="28" rx="1.5" ry="3" fill="rgba(255, 255, 255, 0.4)" />
          <ellipse cx="30" cy="28" rx="1.5" ry="3" fill="rgba(255, 255, 255, 0.4)" />
          <ellipse cx="36" cy="30" rx="1.5" ry="3" fill="rgba(255, 255, 255, 0.4)" />
          
          {/* Person figure with 3D effect */}
          <circle cx="18" cy="24" r="3" fill="url(#nivaranBlue)" stroke="#ffffff" strokeWidth="1.5" filter="url(#dropshadow)" />
          <circle cx="18" cy="23" r="1.5" fill="rgba(255, 255, 255, 0.3)" />
          <rect x="16" y="27" width="4" height="6" rx="2" fill="url(#nivaranBlue)" stroke="#ffffff" strokeWidth="1.5" filter="url(#dropshadow)" />
          <line x1="16" y1="29" x2="14" y2="33" stroke="url(#nivaranBlueDark)" strokeWidth="2" strokeLinecap="round" filter="url(#dropshadow)" />
          <line x1="20" y1="29" x2="22" y2="33" stroke="url(#nivaranBlueDark)" strokeWidth="2" strokeLinecap="round" filter="url(#dropshadow)" />
          <line x1="18" y1="33" x2="16" y2="36" stroke="url(#nivaranBlueDark)" strokeWidth="2" strokeLinecap="round" filter="url(#dropshadow)" />
          <line x1="18" y1="33" x2="20" y2="36" stroke="url(#nivaranBlueDark)" strokeWidth="2" strokeLinecap="round" filter="url(#dropshadow)" />
          
          {/* House with 3D effect */}
          <rect x="26" y="28" width="8" height="6" fill="url(#nivaranBlue)" stroke="#ffffff" strokeWidth="1.5" filter="url(#dropshadow)" />
          <polygon points="24,28 30,22 36,28" fill="url(#nivaranBlueDark)" stroke="#ffffff" strokeWidth="1.5" filter="url(#dropshadow)" />
          
          {/* House roof highlight */}
          <polygon points="25,27 30,23 35,27" fill="rgba(255, 255, 255, 0.2)" />
          
          {/* House windows with depth */}
          <rect x="27" y="29" width="1.5" height="1.5" fill="#ffffff" rx="0.2" filter="url(#innershadow)" />
          <rect x="29.5" y="29" width="1.5" height="1.5" fill="#ffffff" rx="0.2" filter="url(#innershadow)" />
          <rect x="27" y="31" width="1.5" height="1.5" fill="#ffffff" rx="0.2" filter="url(#innershadow)" />
          <rect x="29.5" y="31" width="1.5" height="1.5" fill="#ffffff" rx="0.2" filter="url(#innershadow)" />
          
          {/* House door with depth */}
          <rect x="31" y="30" width="2" height="4" fill="#ffffff" rx="0.3" filter="url(#innershadow)" />
          <circle cx="32.5" cy="32" r="0.3" fill="url(#nivaranBlue)" />
          
          {/* Connection lines with glow effect */}
          <path d="M18 24 Q22 20 26 24" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1.5" fill="none" opacity="0.8" filter="url(#innershadow)" />
          <path d="M26 24 Q28 22 30 24" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1.5" fill="none" opacity="0.8" filter="url(#innershadow)" />
          
          {/* Sparkle effects */}
          <circle cx="15" cy="20" r="0.5" fill="rgba(255, 255, 255, 0.8)" />
          <circle cx="33" cy="18" r="0.3" fill="rgba(255, 255, 255, 0.6)" />
          <circle cx="21" cy="16" r="0.4" fill="rgba(255, 255, 255, 0.7)" />
        </svg>
        
        {/* Outer glow ring */}
        <div 
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-400/20 to-transparent pointer-events-none"
          style={{ borderRadius: '0.75rem' }}
        ></div>
      </div>
    </div>
  );
};

export default NivaranIcon;
