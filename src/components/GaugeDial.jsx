/**
 * GaugeDial — Direct port of Manus TonneauContainer + CircularGauge + SkeletonizedDial
 * Converted from TSX to JSX, combined into single component
 */

import { useState } from 'react';

const colorMap = {
  red: '#ff1744',
  yellow: '#ffd600',
  orange: '#ff9100',
  cyan: '#00e5ff',
};

const glowColorMap = {
  red: 'rgba(255, 23, 68, 0.15)',
  yellow: 'rgba(255, 214, 0, 0.1)',
  orange: 'rgba(255, 145, 0, 0.1)',
  cyan: 'rgba(0, 229, 255, 0.1)',
};

/* ── Tonneau Container (from Manus) ── */
function TonneauContainer({ children, glowColor = 'red' }) {
  const screwPositions = [
    { top: '5%', left: '5%' },
    { top: '5%', right: '5%' },
    { top: '95%', left: '5%' },
    { top: '95%', right: '5%' },
    { top: '50%', left: '2%' },
    { top: '50%', right: '2%' },
  ];

  return (
    <div
      className="relative"
      style={{
        width: 256,
        height: 256,
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: 16,
        boxShadow: `
          0 0 40px ${glowColorMap[glowColor]},
          inset 0 0 60px rgba(0, 0, 0, 0.8),
          inset -2px -2px 20px rgba(255, 255, 255, 0.05)
        `,
      }}
    >
      {/* Three-Layer Border */}
      <div className="absolute inset-0 rounded-2xl" style={{ border: `1px solid ${colorMap[glowColor]}30` }} />
      <div className="absolute inset-[3px] rounded-[14px]" style={{ border: `1px solid rgba(255,255,255,0.04)` }} />
      <div className="absolute inset-[6px] rounded-[12px]" style={{ border: `1px solid ${colorMap[glowColor]}15` }} />

      {/* Side accent bars */}
      <div className="absolute top-[12%] left-0 w-[3px] h-[25%] rounded-r" style={{ background: colorMap[glowColor], opacity: 0.5 }} />
      <div className="absolute top-[12%] right-0 w-[3px] h-[25%] rounded-l" style={{ background: colorMap[glowColor], opacity: 0.5 }} />
      <div className="absolute bottom-[12%] left-0 w-[3px] h-[25%] rounded-r" style={{ background: colorMap[glowColor], opacity: 0.25 }} />
      <div className="absolute bottom-[12%] right-0 w-[3px] h-[25%] rounded-l" style={{ background: colorMap[glowColor], opacity: 0.25 }} />

      {/* Exposed Screws */}
      {screwPositions.map((pos, idx) => (
        <div
          key={idx}
          className="absolute w-[6px] h-[6px] rounded-full"
          style={{
            top: pos.top,
            left: pos.left,
            right: pos.right,
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, #555 30%, #333 70%)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5), 0 0 3px rgba(0,0,0,0.3)',
          }}
        />
      ))}

      {/* Content */}
      <div className="absolute inset-4 flex items-center justify-center overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/* ── Skeletonized Dial decorative rings (from Manus) ── */
function SkeletonizedDial({ color = 'red', size = 180 }) {
  const c = colorMap[color];
  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0"
      style={{ filter: `drop-shadow(0 0 15px ${glowColorMap[color]})` }}
    >
      {/* Outer decorative circle */}
      <circle cx={size/2} cy={size/2} r={size/2 - 5} fill="none" stroke={c} strokeWidth="1" opacity="0.4" />
      {/* Middle dashed circle */}
      <circle cx={size/2} cy={size/2} r={size/2 - 20} fill="none" stroke={c} strokeWidth="1" opacity="0.3" strokeDasharray="5,5" />
      {/* Inner decorative circle */}
      <circle cx={size/2} cy={size/2} r={size/2 - 35} fill="none" stroke={c} strokeWidth="0.5" opacity="0.2" />
      {/* Radial lines */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const x1 = (size/2) + (size/2 - 10) * Math.cos(angle);
        const y1 = (size/2) + (size/2 - 10) * Math.sin(angle);
        const x2 = (size/2) + (size/2 - 30) * Math.cos(angle);
        const y2 = (size/2) + (size/2 - 30) * Math.sin(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="0.5" opacity="0.2" />;
      })}
    </svg>
  );
}

/* ── Circular Gauge arc (from Manus) ── */
function CircularGaugeArc({ value = 50, maxValue = 100, color = 'red', size = 160 }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / maxValue) * circumference;
  const cx = size / 2;
  const cy = size / 2;
  const c = colorMap[color];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#2a2a2a" strokeWidth={strokeWidth} opacity="0.3" />
      {/* Tick marks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * 360;
        const rad = (angle * Math.PI) / 180;
        const x1 = cx + (radius + 5) * Math.cos(rad - Math.PI/2);
        const y1 = cy + (radius + 5) * Math.sin(rad - Math.PI/2);
        const x2 = cx + (radius + 15) * Math.cos(rad - Math.PI/2);
        const y2 = cy + (radius + 15) * Math.sin(rad - Math.PI/2);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="1" opacity="0.4" />;
      })}
      {/* Progress Arc */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={c} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{
          transition: 'stroke-dashoffset 0.8s ease-out',
          transform: 'rotate(-90deg)',
          transformOrigin: `${cx}px ${cy}px`,
          filter: `drop-shadow(0 0 10px ${c}80)`,
        }}
      />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r="4" fill={c} opacity="0.8" />
    </svg>
  );
}

/* ── Main GaugeDial (assembled) ── */
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
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const mainColor = colorMap[color] || color;

  return (
    <div
      className="flex flex-col items-center cursor-pointer group relative"
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Top accent line */}
      <div className="w-full h-[2px] mb-2"
        style={{ background: `linear-gradient(90deg, transparent 10%, ${mainColor} 50%, transparent 90%)`, opacity: 0.6 }} />

      {/* Tonneau Container with Gauge inside */}
      <TonneauContainer glowColor={color}>
        {/* Skeletonized decorative rings */}
        <div className="relative flex items-center justify-center" style={{ width: 190, height: 190 }}>
          <SkeletonizedDial color={color} size={190} />

          {/* Circular gauge arc */}
          <div className="relative z-10">
            <CircularGaugeArc value={fillPercent} maxValue={100} color={color} size={155} />
          </div>

          {/* Center content overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
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
              <div className="text-[9px] text-gray-400 mt-0.5 text-center max-w-[110px] font-mechanical leading-tight">
                {subValue}
              </div>
            )}
          </div>

          {/* Radial depth shadow */}
          <div className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05), transparent 50%), radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.3) 100%)` }} />
        </div>
      </TonneauContainer>

      {/* Connector dots on sides */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-[7px] w-[10px] h-[10px] rounded-full"
        style={{ background: 'radial-gradient(circle, #666 30%, #444 70%)', boxShadow: '0 0 4px rgba(0,0,0,0.5)' }} />
      <div className="absolute top-1/2 -translate-y-1/2 -right-[7px] w-[10px] h-[10px] rounded-full"
        style={{ background: 'radial-gradient(circle, #666 30%, #444 70%)', boxShadow: '0 0 4px rgba(0,0,0,0.5)' }} />

      {/* Label */}
      <div className="font-mechanical text-[10px] text-gray-500 mt-3 tracking-[0.2em] uppercase">
        {label}
      </div>

      {/* Bottom accent line */}
      <div className="w-20 h-[2px] mt-1.5"
        style={{ background: `linear-gradient(90deg, transparent, ${mainColor}, transparent)`, opacity: 0.5 }} />

      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute top-full mt-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="relative backdrop-blur-sm rounded-lg px-4 py-3 max-w-[240px] text-center leading-relaxed shadow-xl"
            style={{ background: 'linear-gradient(135deg, rgba(26,26,26,0.95), rgba(15,15,15,0.95))', border: `1px solid ${mainColor}40`, boxShadow: `0 8px 32px ${glowColorMap[color]}` }}>
            <div className="font-mechanical text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: mainColor }}>
              {label}
            </div>
            <div className="text-[11px] text-gray-400">{tooltip}</div>
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
              style={{ background: 'rgba(26,26,26,0.95)', borderLeft: `1px solid ${mainColor}40`, borderTop: `1px solid ${mainColor}40` }} />
          </div>
        </div>
      )}
    </div>
  );
}
