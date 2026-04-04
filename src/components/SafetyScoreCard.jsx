/**
 * SafetyScoreCard — Manus-style safety score display
 * Token header with icon + contract address + 6 dimension bars with status icons
 */

import { useState } from 'react';
import { Check, X, AlertTriangle, ShieldCheck, ShieldX, Copy, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext.jsx';

const DIM_KEYS = ['honeypot', 'tax', 'permissions', 'verified', 'marketCap', 'holders'];
const DIM_MAX = { honeypot: 30, tax: 15, permissions: 15, verified: 10, marketCap: 15, holders: 15 };

function getStatus(score, max) {
  const pct = score / max;
  if (pct >= 0.8) return 'pass';
  if (pct >= 0.5) return 'warn';
  return 'fail';
}

function StatusIcon({ status }) {
  if (status === 'pass') return <Check className="w-3.5 h-3.5 text-safe" />;
  if (status === 'warn') return <AlertTriangle className="w-3.5 h-3.5 text-warn" />;
  return <X className="w-3.5 h-3.5 text-danger" />;
}

function progressColor(status) {
  if (status === 'pass') return '#1D9E75';
  if (status === 'warn') return '#BA7517';
  return '#E24B4A';
}

function gradeStyles(grade) {
  switch (grade) {
    case 'A': return { bg: '#1D9E75', text: '#1D9E75', border: 'rgba(29,158,117,0.3)' };
    case 'B': return { bg: '#BA7517', text: '#BA7517', border: 'rgba(186,117,23,0.3)' };
    case 'C': return { bg: '#D85A30', text: '#D85A30', border: 'rgba(216,90,48,0.3)' };
    default:  return { bg: '#E24B4A', text: '#E24B4A', border: 'rgba(226,75,74,0.3)' };
  }
}

export default function SafetyScoreCard({ result }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { lang, t } = useLanguage();
  const { safetyScore, tokenName, tokenSymbol, gradeColor, mineSignals, slippage, riskTemplate, rephrasedRisk, deployerENS, address } = result;
  const isDanger = safetyScore.grade === 'F';
  const gs = gradeStyles(safetyScore.grade);

  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  function handleCopy() {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  const dimLabels = {
    honeypot: t.honeypot, tax: t.tax, permissions: t.permissions,
    verified: t.verified, marketCap: t.marketCap, holders: t.holders,
  };

  return (
    <div className="cp-card my-2" style={{ borderColor: `${gs.border}` }}>
      {/* Honeypot warning banner */}
      {safetyScore.isHoneypot && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ background: 'rgba(226,75,74,0.08)', borderColor: 'rgba(226,75,74,0.2)' }}>
          <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
          <span className="text-xs font-semibold text-danger">{t.honeypotWarning}</span>
        </div>
      )}

      <div className="p-5">
        {/* Token Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDanger ? 'bg-danger/20' : 'bg-safe/20'}`}
              style={{ backgroundColor: isDanger ? 'rgba(226,75,74,0.15)' : 'rgba(29,158,117,0.15)' }}>
              {isDanger
                ? <ShieldX className="w-5 h-5 text-danger" />
                : <ShieldCheck className="w-5 h-5 text-safe" />
              }
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{tokenSymbol}</span>
                <span className="text-sm text-gray-300">{tokenName}</span>
              </div>
              {shortAddr && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-mono-code text-gray-500">{shortAddr}</span>
                  <button onClick={handleCopy} className="text-gray-500 hover:text-white transition-colors">
                    {copied ? <Check className="w-3 h-3 text-safe" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <a
                    href={`https://etherscan.io/token/${address}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
          <span className="text-[10px] font-semibold text-gray-500 tracking-widest font-mechanical">{t.safetyScore}</span>
        </div>

        {/* Score + Grade */}
        <div className="flex items-center gap-4 mb-5">
          <span className="text-6xl font-bold font-mono-code" style={{ color: gs.text, textShadow: `0 0 20px ${gs.text}40` }}>{safetyScore.total}</span>
          <div className="flex flex-col gap-1">
            <span className="text-base font-bold px-3 py-1 rounded-lg text-white inline-block w-fit" style={{ backgroundColor: gs.bg, boxShadow: `0 0 12px ${gs.bg}40` }}>
              {safetyScore.grade}
            </span>
          </div>
        </div>

        {/* 6 Dimension Bars */}
        <div className="space-y-3">
          {DIM_KEYS.map((key, idx) => {
            const score = safetyScore.scores[key] || 0;
            const max = DIM_MAX[key];
            const status = getStatus(score, max);
            const pct = (score / max) * 100;
            return (
              <div key={key} className="space-y-1.5 animate-slide-up" style={{ animationDelay: `${idx * 0.06}s` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={status} />
                    <span className="text-sm font-medium text-white">{dimLabels[key]}</span>
                  </div>
                  <span className="text-sm font-mono-code font-bold" style={{ color: progressColor(status) }}>{score}/{max}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: progressColor(status), boxShadow: `0 0 8px ${progressColor(status)}60` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Mine Signals */}
        {mineSignals && (
          <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-2.5">
            {Object.entries(mineSignals).map(([key, signal]) => {
              const isOk = signal.level === 'safe' || signal.level === 'info';
              const isBlock = signal.level === 'block';
              return (
                <div key={key} className="flex items-center gap-2 text-sm">
                  {isOk ? <Check className="w-4 h-4 text-safe shrink-0" /> :
                   isBlock ? <X className="w-4 h-4 text-danger shrink-0" /> :
                   <AlertTriangle className="w-4 h-4 text-warn shrink-0" />}
                  <span className={`font-medium ${isOk ? 'text-safe' : isBlock ? 'text-danger' : 'text-warn'}`}>{lang === 'en' && signal.reasonEn ? signal.reasonEn : signal.reason}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Deployer ENS */}
        {deployerENS && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            {deployerENS.hasEns ? <Check className="w-4 h-4 text-safe shrink-0" /> : <AlertTriangle className="w-4 h-4 text-gray-400 shrink-0" />}
            <span className={`font-medium ${deployerENS.hasEns ? 'text-safe' : 'text-gray-400'}`}>{lang === 'en' && deployerENS.displayEn ? deployerENS.displayEn : deployerENS.display}</span>
            {deployerENS.hasEns && (
              <span className="text-[9px] px-1.5 py-0.5 rounded text-purple-300 font-mechanical" style={{ background: 'rgba(168,85,247,0.15)' }}>
                ENS
              </span>
            )}
          </div>
        )}

        {/* Expand / Collapse */}
        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-center gap-1 w-full text-xs text-gray-400 hover:text-white transition-colors py-1"
          >
            <span>{expanded ? t.hideDetails : t.viewDetails}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3 text-[11px]">
              {/* Slippage */}
              {slippage && (
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-gray-500">{t.dynamicSlippage}:</span>
                  <span className="text-safe font-mono-code">
                    {slippage.default}% / {slippage.cap}%
                  </span>
                  <span className="text-gray-600">({lang === 'en' && slippage.labelEn ? slippage.labelEn : slippage.label})</span>
                </div>
              )}

              {/* AI Risk Description */}
              {(rephrasedRisk || riskTemplate) && (
                <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  {rephrasedRisk ? (
                    <>
                      <div className="text-[9px] text-safe/60 mb-1 font-mechanical">{t.aiRiskAnalysis}</div>
                      <div className="text-[11px] text-gray-300 leading-relaxed">{rephrasedRisk}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-[9px] text-gray-600 mb-1 font-mechanical animate-pulse">{t.aiAnalyzing}</div>
                      <div className="text-[11px] text-gray-400 leading-relaxed">{lang === 'en' ? riskTemplate.en : riskTemplate.zh}</div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
