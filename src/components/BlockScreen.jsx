/**
 * BlockScreen — Full-screen red warning for F-grade tokens
 * Triggered by: honeypot, fake token, no liquidity
 * Covers the left dashboard area for maximum drama
 */

import { simulateConsequence } from '../engine/rules.js';

export default function BlockScreen({ result, onDismiss }) {
  const { safetyScore, tokenName, tokenSymbol, mineSignals, marketCap } = result;

  // Find the blocking reason
  let blockReason = '该代币被评为F级，交易已拦截';
  let blockDetail = '';

  if (safetyScore.isHoneypot) {
    blockReason = '🚫 蜜罐代币检测';
    blockDetail = '该代币无法卖出。一旦买入，你的资金将被永久锁定。';
  } else if (mineSignals?.fakeToken?.level === 'block') {
    blockReason = '🚫 假代币检测';
    blockDetail = mineSignals.fakeToken.reason;
  } else if (mineSignals?.liquidity?.level === 'block') {
    blockReason = '🚫 无流动性';
    blockDetail = mineSignals.liquidity.reason;
  }

  // Consequence simulation
  const consequence = simulateConsequence(marketCap, 1000);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4">
        {/* Red glow container */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(226, 75, 74, 0.15), rgba(30, 10, 10, 0.95))',
            border: '2px solid rgba(226, 75, 74, 0.4)',
            boxShadow: '0 0 60px rgba(226, 75, 74, 0.2), inset 0 0 40px rgba(226, 75, 74, 0.05)',
          }}
        >
          {/* Warning icon */}
          <div className="text-6xl mb-4">🛑</div>

          {/* Title */}
          <h2
            className="font-mechanical text-2xl font-bold mb-2 tracking-wider"
            style={{ color: '#E24B4A', textShadow: '0 0 20px rgba(226, 75, 74, 0.5)' }}
          >
            交易已拦截
          </h2>

          {/* Token info */}
          <div className="text-gray-400 text-sm mb-4 font-mechanical">
            {tokenSymbol} · {tokenName}
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-5xl font-black font-mechanical" style={{ color: '#E24B4A' }}>
              {safetyScore.total}
            </span>
            <span className="grade-f text-lg font-bold px-3 py-1 rounded">
              F
            </span>
          </div>

          {/* Block reason */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4 text-left">
            <div className="text-red-400 font-bold text-sm mb-1">{blockReason}</div>
            <div className="text-red-300/70 text-xs">{blockDetail}</div>
          </div>

          {/* Consequence simulation */}
          <div className="bg-white/[0.03] rounded-lg p-3 mb-4 text-left">
            <div className="text-yellow-400 text-xs font-mechanical mb-1">⚠ 后果模拟</div>
            <div className="text-white text-sm">{consequence.display}</div>
            <div className="text-gray-600 text-[9px] mt-1">{consequence.disclaimer}</div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-sm transition-all font-mechanical"
          >
            我已了解风险
          </button>
        </div>
      </div>
    </div>
  );
}
