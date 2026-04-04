/**
 * Dashboard — Left 2/3 of the screen
 * Richard Mille style: 4 gauge dials + gear decorations + metric cards + transactions
 * Dials are interactive: hover for tooltip, click for detail panels
 */

import { useState } from 'react';
import { useAccount, useBalance, useEnsName, useEnsAvatar } from 'wagmi';
import GaugeDial from './GaugeDial';
import { WalletPanel, SecurityPanel, ScanPanel, MarketPanel } from './DialPanels.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';

const colorMap = {
  red: '#ff1744',
  yellow: '#ffd600',
  orange: '#ff9100',
  cyan: '#00e5ff',
};

// Gear decoration component
function GearDecoration({ size = 50, color = 'red', speed = '20s' }) {
  const c = colorMap[color];
  const r = size / 2;
  const teeth = 10;

  return (
    <svg
      width={size} height={size}
      viewBox={`${-r} ${-r} ${size} ${size}`}
      style={{
        animation: `spin ${speed} linear infinite`,
        opacity: 0.15,
        filter: `drop-shadow(0 0 6px ${c}40)`,
      }}
    >
      {Array.from({ length: teeth }, (_, i) => {
        const a1 = (i / teeth) * Math.PI * 2;
        const a2 = ((i + 0.5) / teeth) * Math.PI * 2;
        const outerR = r;
        const innerR = r * 0.7;
        return (
          <path
            key={i}
            d={`M${Math.cos(a1)*outerR},${Math.sin(a1)*outerR} L${Math.cos(a2)*innerR},${Math.sin(a2)*innerR}`}
            stroke={c} strokeWidth="2" fill="none"
          />
        );
      })}
      <circle cx="0" cy="0" r={r * 0.3} fill={c} opacity="0.3" />
      <circle cx="0" cy="0" r={r * 0.5} fill="none" stroke={c} strokeWidth="1" opacity="0.3" strokeDasharray="3,3" />
    </svg>
  );
}

// Metric card component (adapted from Manus MetricCard)
function MetricCard({ title, value, unit, change, color = 'red', positive = true }) {
  const c = colorMap[color];
  return (
    <div
      className="relative p-5 rounded-lg overflow-hidden backdrop-blur-sm"
      style={{
        background: 'linear-gradient(135deg, rgba(26,26,26,0.8), rgba(15,15,15,0.8))',
        border: `1px solid ${c}40`,
        boxShadow: `0 0 20px ${c}20, inset 0 0 20px ${c}05`,
      }}
    >
      {/* Background texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 1px, ${c}, ${c} 2px)`,
          backgroundSize: '4px 100%',
        }}
      />
      <div className="relative z-10">
        <div className="font-mechanical text-xs uppercase tracking-widest text-gray-400 mb-3">
          {title}
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span
            className="font-black text-3xl tracking-tight"
            style={{ color: c, textShadow: `0 0 10px ${c}60`, fontFamily: "'JetBrains Mono', monospace" }}
          >
            {value}
          </span>
          <span className="text-sm text-gray-500">{unit}</span>
        </div>
        <div className={`text-sm font-mechanical tracking-wider ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {positive ? '↑ ' : '↓ '}{change}
        </div>
      </div>
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${c}, transparent)`, opacity: 0.6 }}
      />
    </div>
  );
}

function getInfoCards(t) {
  return [
    { title: t.btcUsd, value: '45,230', unit: '$', change: '+3.2%', color: 'yellow', positive: true },
    { title: t.ethUsd, value: '2,845', unit: '$', change: '+2.1%', color: 'orange', positive: true },
    { title: t.totalMcap, value: '1.2', unit: 'T', change: '+1.5%', color: 'cyan', positive: true },
    { title: t.portfolio, value: '245,680', unit: '$', change: '+12.4%', color: 'red', positive: true },
  ];
}

const DEMO_TRANSACTIONS = [
  { type: 'BUY', token: 'USDC', detail: '284.50 USDC · 0.1 ETH', time: '2 mins ago' },
  { type: 'SELL', token: 'ETH', detail: '2.0 ETH · $5,690', time: '15 mins ago' },
  { type: 'BUY', token: 'PEPE', detail: '1,000,000 PEPE · $12.50', time: '1 hour ago' },
];

function getTooltips(lang) {
  return lang === 'zh' ? {
    wallet: '你的钱包身份和总资产。连接钱包后自动显示ENS名称和余额。',
    security: '7条安全规则由代码强制执行，AI无法绕过。包括蜜罐拦截、假代币检测、大额保护等。',
    scan: '最近一次代币安全检查结果。点击查看历史扫描和拦截记录。',
    market: '关注币种的实时价格。点击切换币种或添加新关注。',
  } : {
    wallet: 'Your wallet identity and total assets. ENS name and balance shown after connecting.',
    security: '7 safety rules enforced by code, AI cannot bypass. Includes honeypot, fake token, large trade protection.',
    scan: 'Most recent token safety scan result. Click to view scan history and blocked tokens.',
    market: 'Real-time prices for watched tokens. Click to switch or add tokens.',
  };
}

export default function Dashboard({ lastScan, scanCount = 0, blockCount = 0, scanHistory = [] }) {
  const { lang, t } = useLanguage();
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName });
  const [activePanel, setActivePanel] = useState(null);
  const [securitySettings, setSecuritySettings] = useState({
    largeThreshold: 80, cooldownC: 300, cooldownB: 180, mevEnabled: true,
  });

  const TOOLTIPS = getTooltips(lang);
  const INFO_CARDS = getInfoCards(t);

  const ethBalance = balance ? parseFloat(balance.formatted) : 0;
  const ethUsd = ethBalance * 2845;
  const ethDisplay = balance ? `${ethBalance.toFixed(3)} ETH` : '0 ETH';
  const walletDisplay = ensName || (address ? `${address.slice(0,4)}...${address.slice(-3)}` : '—');
  const walletSub = isConnected ? (ensName ? `$${Math.round(ethUsd).toLocaleString()}` : ethDisplay) : t.connectWallet;

  const togglePanel = (panel) => setActivePanel(prev => prev === panel ? null : panel);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto relative">
      {/* Background grid pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10">
        {/* 4 Gauge Dials */}
        <div className="grid grid-cols-4 gap-6 mb-4" style={{ animation: 'fadeIn 0.6s ease-out' }}>
          <div className="flex justify-center relative">
            <GaugeDial
              label={t.wallet}
              value={isConnected ? walletDisplay : '—'}
              subValue={walletSub}
              color="red"
              fillPercent={isConnected ? 75 : 10}
              tooltip={TOOLTIPS.wallet}
              onClick={() => togglePanel('wallet')}
            />
          </div>
          <div className="flex justify-center relative">
            <GaugeDial
              label={t.securityEngine}
              value="7/7"
              subValue={t.active}
              color="orange"
              fillPercent={100}
              tooltip={TOOLTIPS.security}
              onClick={() => togglePanel('security')}
            />
          </div>
          <div className="flex justify-center relative">
            <GaugeDial
              label={t.lastScan}
              value={lastScan ? String(lastScan.total) : '—'}
              subValue={lastScan ? `${scanCount}${t.scans} · ${blockCount}${t.blocked}` : t.noScans}
              color="yellow"
              fillPercent={lastScan ? lastScan.total : 0}
              badge={lastScan ? {
                text: lastScan.grade,
                bg: lastScan.grade === 'A' ? '#1D9E75' :
                    lastScan.grade === 'B' ? '#BA7517' :
                    lastScan.grade === 'C' ? '#D85A30' : '#E24B4A',
                color: '#fff',
              } : null}
              tooltip={TOOLTIPS.scan}
              onClick={() => togglePanel('scan')}
            />
          </div>
          <div className="flex justify-center relative">
            <GaugeDial
              label={t.market}
              value="2,845"
              subValue="ETH/USD +2.1%"
              color="cyan"
              fillPercent={68}
              tooltip={TOOLTIPS.market}
              onClick={() => togglePanel('market')}
            />
          </div>
        </div>

        {/* Detail Panels — slide down below dials */}
        {activePanel && (
          <div
            className="mb-4 rounded-lg overflow-hidden"
            style={{
              border: `1px solid ${colorMap[activePanel === 'wallet' ? 'red' : activePanel === 'security' ? 'orange' : activePanel === 'scan' ? 'yellow' : 'cyan']}30`,
              background: 'linear-gradient(135deg, rgba(26,26,26,0.95), rgba(15,15,15,0.95))',
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h3 className="font-mechanical text-xs tracking-[0.15em] uppercase"
                style={{ color: colorMap[activePanel === 'wallet' ? 'red' : activePanel === 'security' ? 'orange' : activePanel === 'scan' ? 'yellow' : 'cyan'] }}>
                {activePanel === 'wallet' ? t.walletDetails :
                 activePanel === 'security' ? t.securityRules :
                 activePanel === 'scan' ? t.scanHistory : t.marketWatchlist}
              </h3>
              <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white text-xs transition-colors">✕</button>
            </div>

            {activePanel === 'wallet' && <WalletPanel />}
            {activePanel === 'security' && <SecurityPanel settings={securitySettings} onSettingsChange={setSecuritySettings} />}
            {activePanel === 'scan' && <ScanPanel scanCount={scanCount} blockCount={blockCount} lastScan={lastScan} scanHistory={scanHistory} />}
            {activePanel === 'market' && <MarketPanel />}
          </div>
        )}

        {/* Gear decorations row */}
        <div className="flex justify-around items-center my-2 h-12">
          <GearDecoration size={45} color="red" speed="30s" />
          <GearDecoration size={35} color="orange" speed="20s" />
          <GearDecoration size={45} color="yellow" speed="25s" />
          <GearDecoration size={35} color="cyan" speed="15s" />
        </div>

        {/* 4 Info Cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {INFO_CARDS.map((card, i) => (
            <div key={card.title} className="animate-slide-up" style={{ animationDelay: `${0.1 + i * 0.06}s` }}>
              <MetricCard {...card} />
            </div>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="data-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mechanical text-lg tracking-[0.15em] text-glow-orange uppercase" style={{ color: '#ff9100' }}>
              {t.recentTx}
            </h3>
            <div className="w-2 h-2 rounded-full pulse-glow" style={{ backgroundColor: '#ff1744', color: '#ff1744' }} />
          </div>

          <div className="space-y-1">
            {DEMO_TRANSACTIONS.map((tx, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mechanical text-[10px] font-bold px-2.5 py-1 rounded ${
                      tx.type === 'BUY'
                        ? 'bg-green-500/15 text-green-400'
                        : 'bg-red-500/15 text-red-400'
                    }`}
                  >
                    {tx.type}
                  </span>
                  <span className="text-sm text-white font-medium">{tx.token}</span>
                </div>
                <div className="text-xs text-gray-400 font-mechanical">{tx.detail}</div>
                <div className="text-[10px] text-gray-600 font-mechanical">{tx.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
