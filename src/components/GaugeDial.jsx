/**
 * GaugeDial — Manus exact port: TonneauContainer + SkeletonizedDial + CircularGauge
 * Zero modifications to Manus visual code. Only removed TypeScript types.
 */

import { useState } from 'react';

/* ── Color maps (from Manus) ── */
const colorMap = {
  red: '#ff1744',
  yellow: '#ffd600',
  orange: '#ff9100',
  cyan: '#00e5ff',
};

const glowColorMap = {
  red: 'rgba(255, 23, 68, 0.3)',
  yellow: 'rgba(255, 214, 0, 0.2)',
  orange: 'rgba(255, 145, 0, 0.2)',
  cyan: 'rgba(0, 229, 255, 0.2)',
};

/* ── TonneauContainer (Manus exact) ── */
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
      className="tonneau-container w-64 h-64 relative"
      style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: '16px',
        boxShadow: `
          0 0 40px ${glowColorMap[glowColor]},
          inset 0 0 60px rgba(0, 0, 0, 0.8),
          inset -2px -2px 20px rgba(255, 255, 255, 0.05)
        `,
      }}
    >
      {/* Three-Layer Border Effect */}
      <div className="absolute inset-0 rounded-2xl" style={{ border: `1px solid ${colorMap[glowColor]}30` }} />
      <div className="absolute inset-[3px] rounded-[14px]" style={{ border: '1px solid rgba(255,255,255,0.04)' }} />
      <div className="absolute inset-[6px] rounded-[12px]" style={{ border: `1px solid ${colorMap[glowColor]}15` }} />

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

      {/* Content Container */}
      <div className="absolute inset-4 flex items-center justify-center overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/* ── SkeletonizedDial (Manus exact) ── */
function SkeletonizedDial({ children, size = 200, color = 'red' }) {
  const c = colorMap[color];
  const gc = glowColorMap[color];

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer Layer - Decorative Ring */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        style={{ filter: `drop-shadow(0 0 15px ${gc})` }}
      >
        {/* Outer decorative circle */}
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 5} fill="none" stroke={c} strokeWidth="1" opacity="0.4" />
        {/* Middle decorative circle */}
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 20} fill="none" stroke={c} strokeWidth="1" opacity="0.3" strokeDasharray="5,5" />
        {/* Inner decorative circle */}
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 35} fill="none" stroke={c} strokeWidth="0.5" opacity="0.2" />
        {/* Radial lines for mechanical effect */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const x1 = (size / 2) + (size / 2 - 10) * Math.cos(angle);
          const y1 = (size / 2) + (size / 2 - 10) * Math.sin(angle);
          const x2 = (size / 2) + (size / 2 - 30) * Math.cos(angle);
          const y2 = (size / 2) + (size / 2 - 30) * Math.sin(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="0.5" opacity="0.2" />;
        })}
      </svg>

      {/* Content Layer */}
      <div className="relative z-10">{children}</div>

      {/* Inner Depth Shadow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.05), transparent 50%),
                       radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.3) 100%)`,
        }}
      />
    </div>
  );
}

/* ── CircularGauge (Manus exact) ── */
function CircularGauge({ value, maxValue = 100, color = 'red', size = 160, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / maxValue) * circumference;
  const centerX = size / 2;
  const centerY = size / 2;
  const c = colorMap[color];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="relative"
      style={{ filter: `drop-shadow(0 0 20px ${glowColorMap[color]})` }}
    >
      {/* Background Circle */}
      <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#2a2a2a" strokeWidth={strokeWidth} opacity="0.3" />
      {/* Tick Marks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * 360;
        const rad = (angle * Math.PI) / 180;
        const x1 = centerX + (radius + 5) * Math.cos(rad - Math.PI / 2);
        const y1 = centerY + (radius + 5) * Math.sin(rad - Math.PI / 2);
        const x2 = centerX + (radius + 15) * Math.cos(rad - Math.PI / 2);
        const y2 = centerY + (radius + 15) * Math.sin(rad - Math.PI / 2);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="1" opacity="0.4" />;
      })}
      {/* Progress Arc */}
      <circle
        cx={centerX} cy={centerY} r={radius} fill="none" stroke={c}
        strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transition: 'stroke-dashoffset 0.8s ease-out',
          transform: 'rotate(-90deg)',
          transformOrigin: `${centerX}px ${centerY}px`,
          filter: `drop-shadow(0 0 10px ${c}80)`,
        }}
      />
      {/* Center Dot */}
      <circle cx={centerX} cy={centerY} r="4" fill={c} opacity="0.8" />
    </svg>
  );
}

/* ── GearAnimation (Manus exact) ── */
function GearAnimation({ size = 60, color = 'red', speed = 'normal', opacity = 0.3 }) {
  const c = colorMap[color];
  const speedMap = { slow: '30s', normal: '20s', fast: '10s' };
  const radius = size / 2;
  const teethCount = 12;

  const generateGearPath = () => {
    const teeth = [];
    for (let i = 0; i < teethCount; i++) {
      const angle = (i / teethCount) * Math.PI * 2;
      const nextAngle = ((i + 1) / teethCount) * Math.PI * 2;
      const outerRadius = radius;
      const innerRadius = radius - size * 0.15;
      const x1 = Math.cos(angle) * outerRadius;
      const y1 = Math.sin(angle) * outerRadius;
      const x2 = Math.cos(nextAngle) * outerRadius;
      const y2 = Math.sin(nextAngle) * outerRadius;
      const midAngle = (angle + nextAngle) / 2;
      const x3 = Math.cos(midAngle) * innerRadius;
      const y3 = Math.sin(midAngle) * innerRadius;
      teeth.push(`L${x1},${y1}`);
      teeth.push(`L${x3},${y3}`);
      teeth.push(`L${x2},${y2}`);
    }
    return `M${radius},0 ${teeth.join(' ')} Z`;
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-radius} ${-radius} ${size} ${size}`}
      className="absolute"
      style={{
        animation: `spin ${speedMap[speed]} linear infinite`,
        opacity,
        filter: `drop-shadow(0 0 8px ${c}40)`,
      }}
    >
      <path d={generateGearPath()} fill="none" stroke={c} strokeWidth="2" opacity="0.8" />
      <circle cx="0" cy="0" r={radius * 0.3} fill={c} opacity="0.4" />
      <circle cx="0" cy="0" r={radius * 0.25} fill="none" stroke={c} strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

/* ── HoverTooltip (Manus exact) ── */
function HoverTooltip({ children, title, description, color = 'red', position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            ...(position === 'top' && { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '12px' }),
            ...(position === 'bottom' && { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '12px' }),
            animation: 'fadeInScale 0.2s ease-out',
          }}
        >
          <div
            className="relative px-4 py-3 rounded-lg backdrop-blur-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(15, 15, 15, 0.95))',
              border: `1px solid ${colorMap[color]}60`,
              boxShadow: `0 8px 32px ${glowColorMap[color]}, inset 0 0 20px ${colorMap[color]}10`,
              minWidth: '200px',
              maxWidth: '280px',
            }}
          >
            <div className="font-mechanical text-sm font-bold uppercase tracking-widest mb-2"
              style={{ color: colorMap[color], textShadow: `0 0 8px ${colorMap[color]}40` }}>
              {title}
            </div>
            <div className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              {description}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── DashboardModuleWithTooltip (Manus exact) ── */
function DashboardModuleWithTooltip({ children, title, description, color = 'red', tooltipPosition = 'top' }) {
  return (
    <HoverTooltip title={title} description={description} color={color} position={tooltipPosition}>
      <div className="cursor-help">
        <TonneauContainer glowColor={color}>
          {children}
        </TonneauContainer>
      </div>
    </HoverTooltip>
  );
}

/* ── Main GaugeDial (Manus structure + our data) ── */
export default function GaugeDial({
  label,
  value,
  subValue,
  color = 'red',
  fillPercent = 75,
  badge,
  onClick,
  tooltip,
}) {
  const mainColor = colorMap[color] || color;

  return (
    <div className="flex flex-col items-center cursor-pointer group" onClick={onClick}>
      {/* Top accent line (from Manus design) */}
      <div className="w-full h-[2px] mb-2"
        style={{ background: `linear-gradient(90deg, transparent 10%, ${mainColor} 50%, transparent 90%)`, opacity: 0.6 }} />

      {/* Manus: DashboardModuleWithTooltip wrapping CircularGauge */}
      <div className="relative">
        <DashboardModuleWithTooltip
          title={label}
          description={tooltip || ''}
          color={color}
          tooltipPosition="bottom"
        >
          <div className="flex items-center justify-center h-full">
            <SkeletonizedDial size={190} color={color}>
              <CircularGauge value={fillPercent} maxValue={100} color={color} size={160} />
            </SkeletonizedDial>
          </div>
        </DashboardModuleWithTooltip>

        {/* GearAnimation (from Manus Dashboard) */}
        <GearAnimation size={60} color={color} speed="slow" opacity={0.3} />

        {/* Center content overlay - our data */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
          <div className="flex items-center gap-2">
            <span className="metric-display" style={{ color: mainColor, textShadow: `0 0 12px ${mainColor}50` }}>
              {value}
            </span>
            {badge && (
              <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>
                {badge.text}
              </span>
            )}
          </div>
          {subValue && (
            <div className="font-mechanical text-xs text-gray-400 mt-1 text-center max-w-[140px] opacity-70">
              {subValue}
            </div>
          )}
        </div>
      </div>

      {/* Label (Manus style) */}
      <div className="mt-4 text-center">
        <div className="font-mechanical text-xs uppercase tracking-widest" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>
          {label}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="w-24 h-[2px] mt-2"
        style={{ background: `linear-gradient(90deg, transparent, ${mainColor}, transparent)`, opacity: 0.5 }} />
    </div>
  );
}

export { GearAnimation };
