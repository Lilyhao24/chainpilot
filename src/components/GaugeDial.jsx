/**
 * GaugeDial — Richard Mille tonneau-framed circular gauge
 * Square dark container with accent borders + circular gauge inside
 */

import { useState } from 'react';

const colorMap = {
  red: '#ff1744',
  yellow: '#ffd600',
  orange: '#ff9100',
  cyan: '#00e5ff',
};

const glowMap = {
  red: 'rgba(255, 23, 68, 0.15)',
  yellow: 'rgba(255, 214, 0, 0.1)',
  orange: 'rgba(255, 145, 0, 0.1)',
  cyan: 'rgba(0, 229, 255, 0.1)',
};

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
  size = 160,
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const strokeWidth = 7;
  const gaugeSize = size;
  const radius = (gaugeSize - strokeWidth) / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (fillPercent / 100) * circumference;
  const cx = gaugeSize / 2;
  const cy = gaugeSize / 2;
  const mainColor = colorMap[color] || color;
  const glow = glowMap[color] || 'rgba(255,255,255,0.05)';

  // Container size slightly larger than gauge
  const containerSize = gaugeSize + 50;

  return (
    <div
      className="flex flex-col items-center cursor-pointer group relative"
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tonneau Container Frame */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          width: containerSize,
          height: containerSize,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
          boxShadow: `0 0 30px ${glow}, inset 0 0 40px rgba(0,0,0,0.6), inset -1px -1px 15px rgba(255,255,255,0.02)`,
          border: `1px solid rgba(255,255,255,0.06)`,
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent 10%, ${mainColor} 50%, transparent 90%)`, opacity: 0.7 }} />

        {/* Side accent bars (like Manus red lines) */}
        <div className="absolute top-[15%] left-0 w-[3px] h-[20%] rounded-r"
          style={{ background: mainColor, opacity: 0.4 }} />
        <div className="absolute top-[15%] right-0 w-[3px] h-[20%] rounded-l"
          style={{ background: mainColor, opacity: 0.4 }} />
        <div className="absolute bottom-[15%] left-0 w-[3px] h-[20%] rounded-r"
          style={{ background: mainColor, opacity: 0.2 }} />
        <div className="absolute bottom-[15%] right-0 w-[3px] h-[20%] rounded-l"
          style={{ background: mainColor, opacity: 0.2 }} />

        {/* Center: Circular Gauge */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative" style={{ width: gaugeSize, height: gaugeSize }}>
            <svg
              width={gaugeSize}
              height={gaugeSize}
              viewBox={`0 0 ${gaugeSize} ${gaugeSize}`}
              style={{ filter: `drop-shadow(0 0 15px ${glow})` }}
            >
              {/* Outer ring */}
              <circle cx={cx} cy={cy} r={gaugeSize / 2 - 5} fill="none" stroke={mainColor} strokeWidth="1" opacity="0.2" />

              {/* Dashed middle ring */}
              <circle cx={cx} cy={cy} r={gaugeSize / 2 - 15} fill="none" stroke={mainColor} strokeWidth="0.5" opacity="0.12" strokeDasharray="4,4" />

              {/* Tick marks */}
              {Array.from({ length: 12 }, (_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                const r1 = radius + 6;
                const r2 = radius + 14;
                return (
                  <line
                    key={i}
                    x1={cx + r1 * Math.cos(angle - Math.PI / 2)}
                    y1={cy + r1 * Math.sin(angle - Math.PI / 2)}
                    x2={cx + r2 * Math.cos(angle - Math.PI / 2)}
                    y2={cy + r2 * Math.sin(angle - Math.PI / 2)}
                    stroke={mainColor} strokeWidth="0.8" opacity="0.25"
                  />
                );
              })}

              {/* Background arc */}
              <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#2a2a2a" strokeWidth={strokeWidth} opacity="0.3" />

              {/* Filled arc */}
              <circle
                cx={cx} cy={cy} r={radius} fill="none"
                stroke={mainColor} strokeWidth={strokeWidth}
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 1s ease-out',
                  transform: 'rotate(-90deg)',
                  transformOrigin: `${cx}px ${cy}px`,
                  filter: `drop-shadow(0 0 8px ${mainColor}60)`,
                }}
              />

              {/* Center dot */}
              <circle cx={cx} cy={cy} r="3" fill={mainColor} opacity="0.5" />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {icon && <div className="text-base mb-0.5 opacity-40">{icon}</div>}
              <div className="flex items-center gap-1.5">
                <span
                  className="font-mechanical text-xl font-bold"
                  style={{ color: mainColor, textShadow: `0 0 10px ${mainColor}50` }}
                >
                  {value}
                </span>
                {badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                    style={{ backgroundColor: badge.bg, color: badge.color }}>
                    {badge.text}
                  </span>
                )}
              </div>
              {subValue && (
                <div className="text-[9px] text-gray-400 mt-0.5 text-center max-w-[100px] font-mechanical leading-tight">
                  {subValue}
                </div>
              )}
            </div>

            {/* Radial depth */}
            <div className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.02), transparent 50%), radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.25) 100%)` }} />
          </div>
        </div>

        {/* Corner connector dots */}
        <div className="absolute top-1/2 -translate-y-1/2 -left-[5px] w-[10px] h-[10px] rounded-full bg-gray-700 border border-gray-600" />
        <div className="absolute top-1/2 -translate-y-1/2 -right-[5px] w-[10px] h-[10px] rounded-full bg-gray-700 border border-gray-600" />
      </div>

      {/* Label below */}
      <div className="font-mechanical text-[10px] text-gray-500 mt-3 tracking-[0.2em] uppercase">
        {label}
      </div>

      {/* Bottom accent line */}
      <div className="w-16 h-[2px] mt-1.5"
        style={{ background: `linear-gradient(90deg, transparent, ${mainColor}, transparent)`, opacity: 0.5 }} />

      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute top-full mt-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="relative backdrop-blur-sm rounded-lg px-4 py-3 max-w-[240px] text-center leading-relaxed shadow-xl"
            style={{ background: 'linear-gradient(135deg, rgba(26,26,26,0.95), rgba(15,15,15,0.95))', border: `1px solid ${mainColor}40`, boxShadow: `0 8px 32px ${glow}` }}>
            <div className="font-mechanical text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: mainColor }}>
              {label}
            </div>
            <div className="text-[11px] text-gray-400">{tooltip}</div>
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45" style={{ background: 'rgba(26,26,26,0.95)', borderLeft: `1px solid ${mainColor}40`, borderTop: `1px solid ${mainColor}40` }} />
          </div>
        </div>
      )}
    </div>
  );
}
