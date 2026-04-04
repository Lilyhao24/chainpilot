/**
 * BlockScreen — Manus-style interception screen for F-grade tokens
 * Structured layout: header → reason → risk simulation → dismiss
 */

import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { simulateConsequence } from '../engine/rules.js';
import { useLanguage } from '../contexts/LanguageContext.jsx';

export default function BlockScreen({ result, onDismiss }) {
  const { t } = useLanguage();
  const { safetyScore, tokenName, tokenSymbol, mineSignals, marketCap } = result;

  let blockReason = t.txBlocked;
  let blockDetail = '';
  let ruleRef = '';

  if (safetyScore.isHoneypot) {
    blockReason = t.honeypotBlock;
    blockDetail = t.honeypotBlockDetail;
    ruleRef = '#1';
  } else if (mineSignals?.fakeToken?.level === 'block') {
    blockReason = t.fakeTokenBlock;
    blockDetail = mineSignals.fakeToken.reason;
    ruleRef = '#2';
  } else if (mineSignals?.liquidity?.level === 'block') {
    blockReason = t.noLiquidityBlock;
    blockDetail = mineSignals.liquidity.reason;
    ruleRef = '#3';
  }

  const consequence = simulateConsequence(marketCap, 1000);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md" style={{ background: 'radial-gradient(ellipse at center, rgba(226,75,74,0.12) 0%, rgba(10,10,10,0.95) 70%)' }}>
      <div className="max-w-lg w-full mx-6">
        <div className="cp-card" style={{ borderColor: 'rgba(226,75,74,0.4)', boxShadow: '0 0 60px rgba(226,75,74,0.15), 0 0 120px rgba(226,75,74,0.05)' }}>
          {/* Red gradient header */}
          <div className="px-5 py-4 border-b" style={{ background: 'linear-gradient(90deg, rgba(226,75,74,0.15), rgba(226,75,74,0.03))', borderColor: 'rgba(226,75,74,0.2)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(226,75,74,0.15)' }}>
                <ShieldAlert className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h2 className="text-base font-bold text-danger">{t.txBlocked}</h2>
                <p className="text-xs text-gray-500">{t.blockedByRule}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Token + Score */}
            <div className="flex items-center gap-4">
              <span className="text-5xl font-bold font-mono-code text-danger">{safetyScore.total}</span>
              <div>
                <span className="grade-f text-sm font-bold px-2.5 py-0.5 rounded inline-block">F</span>
                <div className="text-xs text-gray-400 mt-1 font-mechanical">{tokenSymbol} · {tokenName}</div>
              </div>
            </div>

            {/* Block Reason */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-semibold text-gray-500 tracking-widest font-mechanical">{t.blockReason}</h3>
              <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(226,75,74,0.05)', border: '1px solid rgba(226,75,74,0.15)' }}>
                <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs text-white font-medium">{blockReason}</p>
                  <p className="text-[10px] text-gray-400">{blockDetail}</p>
                  {ruleRef && <p className="text-[10px] text-gray-600">{t.ruleSource} ({ruleRef})</p>}
                </div>
              </div>
            </div>

            {/* Risk Simulation */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-semibold text-gray-500 tracking-widest font-mechanical">{t.riskSim}</h3>
              <div className="p-3 rounded-lg border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="text-base text-white mb-2 font-medium">{consequence.display}</div>
                <div className="text-[10px] text-gray-600">{consequence.disclaimer}</div>
              </div>
            </div>

            {/* Dismiss */}
            <button
              onClick={onDismiss}
              className="w-full py-2.5 rounded-lg text-gray-400 hover:text-white text-xs font-semibold transition-all border border-white/10 hover:border-white/20"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              {t.iUnderstand}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
