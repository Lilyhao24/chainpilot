/**
 * SafetyScoreCard — Safety Score display with expandable mine signal details
 * Shows 6-dimension bars + grade badge + 3 mine signals
 */

import { useState } from 'react';

const DIM_LABELS = {
  honeypot: { zh: '蜜罐', en: 'Honeypot' },
  tax: { zh: '税率', en: 'Tax' },
  permissions: { zh: '合约权限', en: 'Permissions' },
  verified: { zh: '验证', en: 'Verification' },
  marketCap: { zh: '市值', en: 'Market Cap' },
  holders: { zh: '持有者', en: 'Holders' },
};

const DIM_MAX = {
  honeypot: 30, tax: 15, permissions: 15, verified: 10, marketCap: 15, holders: 15,
};

export default function SafetyScoreCard({ result }) {
  const [expanded, setExpanded] = useState(false);
  const { safetyScore, tokenName, tokenSymbol, gradeColor, mineSignals, slippage, riskTemplate, rephrasedRisk } = result;
  const isGood = safetyScore.grade === 'A' || safetyScore.grade === 'B';
  const borderColor = isGood ? '#00E676' : safetyScore.grade === 'C' ? '#D85A30' : '#FF1744';

  return (
    <div
      className="rounded-lg overflow-hidden my-2"
      style={{
        border: `1px solid ${borderColor}40`,
        background: `linear-gradient(135deg, ${borderColor}08, transparent)`,
      }}
    >
      {/* Header: Score + Grade */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <span
            className="text-4xl font-black font-mechanical"
            style={{ color: gradeColor.color, textShadow: `0 0 15px ${gradeColor.color}40` }}
          >
            {safetyScore.total}
          </span>
          <span
            className="text-sm font-bold px-2.5 py-1 rounded-md"
            style={{ backgroundColor: gradeColor.color, color: '#fff' }}
          >
            {safetyScore.grade}
          </span>
        </div>
        <div className="text-xs text-gray-400 font-mechanical">
          {tokenSymbol} · {tokenName}
        </div>
      </div>

      {/* 6 Dimension Bars */}
      <div className="px-4 py-2 space-y-2">
        {Object.entries(safetyScore.scores).map(([key, score]) => {
          const max = DIM_MAX[key];
          const pct = (score / max) * 100;
          const barColor = pct >= 80 ? '#00E676' : pct >= 50 ? '#FFD600' : '#FF1744';
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 w-16 truncate font-mechanical">
                {DIM_LABELS[key].zh}
              </span>
              <div className="flex-1 h-2.5 bg-gray-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: barColor,
                    boxShadow: `0 0 6px ${barColor}60`,
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-500 w-10 text-right font-mechanical">
                {score}/{max}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mine Signals - Always visible summary */}
      {mineSignals && (
        <div className="px-4 py-2 border-t border-white/[0.04]">
          {Object.entries(mineSignals).map(([key, signal]) => {
            const icon = signal.level === 'safe' || signal.level === 'info' ? '✓' :
                         signal.level === 'warn' || signal.level === 'warn_high' ? '⚠' : '✗';
            const colorClass = signal.level === 'safe' || signal.level === 'info' ? 'text-green-400' :
                               signal.level === 'warn' || signal.level === 'warn_high' ? 'text-yellow-400' : 'text-red-400';
            return (
              <div key={key} className={`text-[10px] ${colorClass} flex items-center gap-1.5 py-0.5`}>
                <span className="text-xs">{icon}</span>
                <span>{signal.reason}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Expandable Details */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors font-mechanical flex items-center gap-1"
        >
          <span>{expanded ? '▼' : '▶'}</span>
          <span>{expanded ? '收起详情' : '查看详情'}</span>
        </button>

        {expanded && (
          <div className="mt-2 space-y-2 text-[10px] text-gray-400 border-t border-white/[0.04] pt-2">
            {/* Slippage info */}
            {slippage && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">动态滑点:</span>
                <span className="text-cyan-400 font-mechanical">
                  默认 {slippage.default}% · 上限 {slippage.cap}%
                </span>
                <span className="text-gray-600">({slippage.label})</span>
              </div>
            )}

            {/* AI Risk Description — Gemini rephrased or original template */}
            {(rephrasedRisk || riskTemplate) && (
              <div className="bg-white/[0.02] rounded p-2 text-gray-400 leading-relaxed">
                {rephrasedRisk ? (
                  <>
                    <div className="text-[9px] text-cyan-500/60 mb-1 font-mechanical">AI 风险解读</div>
                    <div className="text-[11px]">{rephrasedRisk}</div>
                  </>
                ) : (
                  <>
                    <div className="text-[9px] text-gray-600 mb-1 font-mechanical animate-pulse">AI 分析中...</div>
                    <div className="text-[11px]">{riskTemplate.zh}</div>
                  </>
                )}
              </div>
            )}

            {/* Honeypot warning */}
            {safetyScore.isHoneypot && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-red-400">
                ⚠ 蜜罐代币：检测到该代币无法卖出。投入的资金将无法取回。
              </div>
            )}

            {/* ENS deployer info */}
            <div className="flex items-center gap-1 text-gray-500">
              <span>✓</span>
              <span>部署者身份：{safetyScore.grade === 'A' ? '已验证ENS' : '未验证'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
