/**
 * CountdownTimer — SVG circular countdown for cooldown periods
 * C-grade: 5 min, B-grade+warn: 3 min
 */

import { useState, useEffect } from 'react';

export default function CountdownTimer({ seconds, onComplete, label = '冷却倒计时' }) {
  const [remaining, setRemaining] = useState(seconds);
  const isComplete = remaining <= 0;

  useEffect(() => {
    if (remaining <= 0) {
      onComplete?.();
      return;
    }
    const timer = setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining, onComplete]);

  const size = 100;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / seconds;
  const offset = circumference * (1 - progress);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${minutes}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#2a2a2a" strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={isComplete ? '#00E676' : '#D85A30'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s linear',
              transform: 'rotate(-90deg)',
              transformOrigin: `${size / 2}px ${size / 2}px`,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mechanical text-xl font-bold"
            style={{ color: isComplete ? '#00E676' : '#D85A30' }}
          >
            {isComplete ? '✓' : display}
          </span>
        </div>
      </div>
      <span className="text-[10px] text-gray-500 font-mechanical">{label}</span>
    </div>
  );
}
