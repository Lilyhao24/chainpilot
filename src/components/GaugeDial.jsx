/**
 * GaugeDial — Richard Mille inspired circular gauge
 * Adapted from Manus CircularGauge + SkeletonizedDial + GearAnimation
 */

const colorMap = {
  red: '#ff1744',
  yellow: '#ffd600',
  orange: '#ff9100',
  cyan: '#00e5ff',
};

const glowMap = {
  red: 'rgba(255, 23, 68, 0.3)',
  yellow: 'rgba(255, 214, 0, 0.2)',
  orange: 'rgba(255, 145, 0, 0.2)',
  cyan: 'rgba(0, 229, 255, 0.2)',
};

import { useState } from 'react';

export default function GaugeDial({
  label,
  value,
  subValue,
  color = 'red',
  fillPercent = 75,
  icon,
  badge,
  onClick,
  tooltip,
  size = 180,
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2 - 15;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (fillPercent / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;
  const mainColor = colorMap[color] || color;
  const glow = glowMap[color] || 'rgba(255,255,255,0.1)';

  return (
    <div
      className="flex flex-col items-center cursor-pointer group relative"
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Red decorative line on top */}
      <div
        className="w-24 h-[2px] mb-3"
        style={{ background: `linear-gradient(90deg, transparent, ${mainColor}, transparent)`, opacity: 0.6 }}
      />

      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ filter: `drop-shadow(0 0 20px ${glow})` }}
        >
          {/* Outer decorative circle */}
          <circle cx={cx} cy={cy} r={size/2 - 5} fill="none" stroke={mainColor} strokeWidth="1" opacity="0.25" />

          {/* Middle dashed circle */}
          <circle cx={cx} cy={cy} r={size/2 - 18} fill="none" stroke={mainColor} strokeWidth="0.5" opacity="0.15" strokeDasharray="4,4" />

          {/* Tick marks (12 positions like a clock) */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const r1 = radius + 8;
            const r2 = radius + 18;
            return (
              <line
                key={i}
                x1={cx + r1 * Math.cos(angle - Math.PI/2)}
                y1={cy + r1 * Math.sin(angle - Math.PI/2)}
                x2={cx + r2 * Math.cos(angle - Math.PI/2)}
                y2={cy + r2 * Math.sin(angle - Math.PI/2)}
                stroke={mainColor}
                strokeWidth="1"
                opacity="0.3"
              />
            );
          })}

          {/* Background arc */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="#2a2a2a"
            strokeWidth={strokeWidth}
            opacity="0.4"
          />

          {/* Filled arc */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={mainColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s ease-out',
              transform: `rotate(-90deg)`,
              transformOrigin: `${cx}px ${cy}px`,
              filter: `drop-shadow(0 0 10px ${mainColor}80)`,
            }}
          />

          {/* Cardinal dots */}
          {[0, 90, 180, 270].map((deg) => {
            const rad = (deg - 90) * (Math.PI / 180);
            const dotR = radius + 22;
            return (
              <circle
                key={deg}
                cx={cx + dotR * Math.cos(rad)}
                cy={cy + dotR * Math.sin(rad)}
                r={2.5}
                fill={mainColor}
                opacity="0.5"
              />
            );
          })}

          {/* Center dot */}
          <circle cx={cx} cy={cy} r="3" fill={mainColor} opacity="0.6" />
        </svg>

        {/* Center content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && <div className="text-lg mb-1 opacity-50">{icon}</div>}
          <div className="flex items-center gap-1.5">
            <span
              className="font-mechanical text-2xl font-bold"
              style={{ color: mainColor, textShadow: `0 0 10px ${mainColor}60` }}
            >
              {value}
            </span>
            {badge && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                style={{ backgroundColor: badge.bg, color: badge.color }}
              >
                {badge.text}
              </span>
            )}
          </div>
          {subValue && (
            <div className="text-[10px] text-gray-400 mt-1 text-center max-w-[110px] font-mechanical">
              {subValue}
            </div>
          )}
        </div>

        {/* Radial depth shadow */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.03), transparent 50%),
                         radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.3) 100%)`,
          }}
        />
      </div>

      {/* Label */}
      <div className="font-mechanical text-[10px] text-gray-500 mt-3 tracking-[0.2em] uppercase">
        {label}
      </div>

      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{ animation: 'fadeIn 0.3s ease-out' }}
        >
          <div className="relative bg-[#1A1A1A]/95 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-[11px] text-gray-300 max-w-[200px] text-center leading-relaxed shadow-xl">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#1A1A1A]/95 border-l border-t border-white/10" />
            {tooltip}
          </div>
        </div>
      )}
    </div>
  );
}
