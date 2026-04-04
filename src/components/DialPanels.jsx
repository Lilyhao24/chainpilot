/**
 * DialPanels — Detail panels for each gauge dial
 * WALLET: ENS Profile + portfolio pie + token balances
 * SECURITY ENGINE: 7 rules + adjustable settings
 * LAST SCAN: scan history + stats
 * MARKET: watchlist with sparklines + add tokens
 */

import { useState } from 'react';
import { useAccount, useBalance, useEnsName, useEnsAvatar } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';

const colorMap = {
  red: '#ff1744', orange: '#ff9100', yellow: '#ffd600', cyan: '#00e5ff',
};

// ─── WALLET PANEL ─────────────────────────────────────────────
function WalletPanel() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName });

  const ethBalance = balance ? parseFloat(balance.formatted) : 0;
  const ethUsd = ethBalance * 2845;

  // Demo portfolio (real would use multicall for ERC20 balances)
  const portfolio = [
    { symbol: 'ETH', name: 'Ethereum', balance: ethBalance.toFixed(4), usd: ethUsd.toFixed(2), pct: 60, color: '#627EEA' },
    { symbol: 'USDC', name: 'USD Coin', balance: '850.00', usd: '850.00', pct: 25, color: '#2775CA' },
    { symbol: 'PEPE', name: 'Pepe', balance: '5,000,000', usd: '62.50', pct: 10, color: '#00A86B' },
    { symbol: 'UNI', name: 'Uniswap', balance: '12.5', usd: '177.88', pct: 5, color: '#FF007A' },
  ];

  if (!isConnected) {
    return <div className="p-8 text-center text-gray-500 text-sm">请先连接钱包以查看详情</div>;
  }

  // SVG donut chart
  const donutSize = 120;
  const donutR = 45;
  const donutCirc = 2 * Math.PI * donutR;
  let donutOffset = 0;

  return (
    <div className="p-4 space-y-4">
      {/* ENS Profile — same style as ENSProfileCard */}
      <div className="flex items-center gap-4 pb-4 border-b border-white/[0.06]">
        <img
          src={ensAvatar || `https://metadata.ens.domains/mainnet/avatar/${ensName || 'unknown'}`}
          alt=""
          className="w-14 h-14 rounded-full border-2 border-red-500/30 object-cover"
          onError={(e) => { e.target.src = `https://effigy.im/a/${address}.png`; }}
        />
        <div className="flex-1">
          <div className="font-mechanical text-lg font-bold" style={{ color: ensName ? '#A855F7' : '#fff' }}>
            {ensName || 'No ENS'}
          </div>
          <div className="text-[10px] text-gray-500 font-mechanical">{address}</div>
        </div>
      </div>

      {/* Portfolio Pie Chart + Total */}
      <div className="flex items-center gap-6">
        <div className="relative" style={{ width: donutSize, height: donutSize }}>
          <svg width={donutSize} height={donutSize} viewBox={`0 0 ${donutSize} ${donutSize}`}>
            {portfolio.map((token) => {
              const dashLen = (token.pct / 100) * donutCirc;
              const gap = donutCirc - dashLen;
              const currentOffset = donutOffset;
              donutOffset += dashLen;
              return (
                <circle
                  key={token.symbol}
                  cx={donutSize / 2} cy={donutSize / 2} r={donutR}
                  fill="none" stroke={token.color} strokeWidth="12"
                  strokeDasharray={`${dashLen} ${gap}`}
                  strokeDashoffset={-currentOffset}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[10px] text-gray-500 font-mechanical">TOTAL</div>
            <div className="font-mechanical text-sm font-bold text-white">
              ${(ethUsd + 850 + 62.5 + 177.88).toFixed(0)}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-1.5">
          {portfolio.map((token) => (
            <div key={token.symbol} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: token.color }} />
              <span className="text-[10px] text-gray-400 font-mechanical flex-1">{token.symbol}</span>
              <span className="text-[10px] text-gray-500 font-mechanical">{token.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Token Balance List */}
      <div className="space-y-1 pt-2 border-t border-white/[0.06]">
        {portfolio.map((token) => (
          <div key={token.symbol} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: `${token.color}20`, color: token.color }}>
                {token.symbol.charAt(0)}
              </div>
              <div>
                <div className="text-xs text-white font-mechanical">{token.name}</div>
                <div className="text-[10px] text-gray-500 font-mechanical">{token.symbol}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white font-mechanical">{token.balance}</div>
              <div className="text-[10px] text-gray-500 font-mechanical">${token.usd}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SECURITY ENGINE PANEL ────────────────────────────────────
const SECURITY_RULES = [
  { id: 1, name: '蜜罐拦截', desc: 'GoPlus检测到蜜罐代币自动拦截交易', adjustable: false },
  { id: 2, name: '假代币检测', desc: '三层验证：GoPlus + 官方地址 + CoinGecko符号交叉', adjustable: false },
  { id: 3, name: '大额保护', desc: '交易超过资产一定比例时自动拦截', adjustable: true, settingKey: 'largeThreshold' },
  { id: 4, name: '动态滑点', desc: 'A级0.5% / B级1% / C级1%（AI不可绕过）', adjustable: false },
  { id: 5, name: 'MEV防护', desc: '防止三明治攻击和抢跑交易', adjustable: true, settingKey: 'mevEnabled' },
  { id: 6, name: 'Gas异常检测', desc: 'Gas费异常偏高时发出警告', adjustable: false },
  { id: 7, name: '授权金额限制', desc: 'approve = 交易额 × 110%，非无限授权（不可关闭）', adjustable: false },
];

function SecurityPanel({ settings, onSettingsChange }) {
  return (
    <div className="p-4 space-y-3">
      {/* Rules List */}
      {SECURITY_RULES.map(rule => (
        <div key={rule.id} className="py-2.5 border-b border-white/[0.04] last:border-0">
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-[10px] shrink-0">✓</span>
            <div className="flex-1">
              <div className="text-xs text-white font-mechanical">{rule.id}. {rule.name}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{rule.desc}</div>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-mechanical shrink-0">ACTIVE</span>
          </div>
        </div>
      ))}

      {/* Adjustable Settings */}
      <div className="pt-3 border-t border-white/[0.08]">
        <div className="font-mechanical text-[10px] text-gray-400 tracking-[0.15em] uppercase mb-3">用户可调设置</div>

        {/* Large trade threshold */}
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-xs text-white font-mechanical">大额保护阈值</div>
            <div className="text-[10px] text-gray-500">超过资产此比例触发拦截</div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="50" max="100" step="5"
              value={settings.largeThreshold}
              onChange={(e) => onSettingsChange({ ...settings, largeThreshold: Number(e.target.value) })}
              className="w-20 accent-orange-500"
            />
            <span className="text-xs text-orange-400 font-mechanical w-8 text-right">{settings.largeThreshold}%</span>
          </div>
        </div>

        {/* Cooldown multiplier */}
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-xs text-white font-mechanical">冷却时间</div>
            <div className="text-[10px] text-gray-500">C级 {settings.cooldownC}秒 / B+warn {settings.cooldownB}秒</div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={settings.cooldownC}
              onChange={(e) => {
                const v = Number(e.target.value);
                onSettingsChange({ ...settings, cooldownC: v, cooldownB: v === 0 ? 0 : Math.round(v * 0.6) });
              }}
              className="bg-[#1A1A1A] border border-white/10 rounded px-2 py-1 text-[10px] text-white font-mechanical"
            >
              <option value={0}>不冷却</option>
              <option value={120}>2分钟</option>
              <option value={180}>3分钟</option>
              <option value={300}>5分钟（默认）</option>
              <option value={600}>10分钟</option>
            </select>
          </div>
        </div>

        {/* MEV toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-xs text-white font-mechanical">MEV防护</div>
            <div className="text-[10px] text-gray-500">保护交易不被抢跑</div>
          </div>
          <button
            onClick={() => onSettingsChange({ ...settings, mevEnabled: !settings.mevEnabled })}
            className={`w-10 h-5 rounded-full transition-colors relative ${settings.mevEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${settings.mevEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Approve mode — display only */}
        <div className="flex items-center justify-between py-2 opacity-60">
          <div>
            <div className="text-xs text-white font-mechanical">授权模式</div>
            <div className="text-[10px] text-gray-500">精确授权110%（不可修改）</div>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 font-mechanical">LOCKED</span>
        </div>
      </div>
    </div>
  );
}

// ─── LAST SCAN PANEL ──────────────────────────────────────────
function ScanPanel({ scanCount, blockCount, lastScan, scanHistory }) {
  const blockRate = scanCount > 0 ? Math.round((blockCount / scanCount) * 100) : 0;

  return (
    <div className="p-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-white/[0.03] rounded p-3 text-center">
          <div className="text-[10px] text-gray-500 font-mechanical">总扫描</div>
          <div className="text-xl font-mechanical font-bold text-yellow-400">{scanCount}</div>
        </div>
        <div className="bg-white/[0.03] rounded p-3 text-center">
          <div className="text-[10px] text-gray-500 font-mechanical">已拦截</div>
          <div className="text-xl font-mechanical font-bold text-red-400">{blockCount}</div>
        </div>
        <div className="bg-white/[0.03] rounded p-3 text-center">
          <div className="text-[10px] text-gray-500 font-mechanical">拦截率</div>
          <div className="text-xl font-mechanical font-bold" style={{ color: blockRate > 30 ? '#E24B4A' : '#1D9E75' }}>{blockRate}%</div>
        </div>
        <div className="bg-white/[0.03] rounded p-3 text-center">
          <div className="text-[10px] text-gray-500 font-mechanical">最新评分</div>
          <div className="text-xl font-mechanical font-bold" style={{ color: lastScan ? (lastScan.grade === 'A' ? '#1D9E75' : lastScan.grade === 'B' ? '#BA7517' : '#E24B4A') : '#666' }}>
            {lastScan ? `${lastScan.total}` : '—'}
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="font-mechanical text-[10px] text-gray-400 tracking-[0.15em] uppercase mb-2">扫描历史</div>
      {scanHistory.length > 0 ? (
        <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
          {scanHistory.map((scan, i) => {
            const gradeColor = scan.grade === 'A' ? '#1D9E75' : scan.grade === 'B' ? '#BA7517' : scan.grade === 'C' ? '#D85A30' : '#E24B4A';
            const isBlocked = scan.grade === 'F';
            return (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-2 rounded"
                style={{
                  borderLeft: `3px solid ${gradeColor}`,
                  background: isBlocked ? 'rgba(226, 75, 74, 0.08)' : 'transparent',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white font-mechanical font-bold">{scan.symbol}</span>
                  {isBlocked && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">BLOCKED</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mechanical font-bold" style={{ color: gradeColor }}>
                    {scan.total} {scan.grade}
                  </span>
                  <span className="text-[10px] text-gray-600 font-mechanical">{scan.time || 'just now'}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-600 text-[11px] py-6">
          在右侧聊天中输入代币名称开始扫描<br />
          <span className="text-gray-700">例如：&quot;帮我查USDC安全吗&quot;</span>
        </div>
      )}
    </div>
  );
}

// ─── MARKET PANEL ─────────────────────────────────────────────
// Simple sparkline SVG component
function Sparkline({ data, color, width = 80, height = 30 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) =>
    `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`
  ).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Demo 7-day + 30-day price data
const MARKET_DATA = [
  { symbol: 'ETH', name: 'Ethereum', price: '2,845', change: '+2.1%', positive: true,
    spark: [2700, 2750, 2780, 2810, 2790, 2830, 2845],
    spark30: [2400, 2450, 2500, 2480, 2550, 2600, 2580, 2620, 2650, 2630, 2680, 2700, 2720, 2690, 2710, 2750, 2730, 2760, 2780, 2770, 2790, 2800, 2780, 2810, 2790, 2820, 2830, 2810, 2840, 2845],
    high: '2,920', low: '2,380', vol: '$18.2B', mcap: '$342B' },
  { symbol: 'BTC', name: 'Bitcoin', price: '45,230', change: '+3.2%', positive: true,
    spark: [43800, 44100, 44500, 44200, 44800, 45100, 45230],
    spark30: [41000, 41500, 42000, 41800, 42500, 43000, 42800, 43200, 43500, 43300, 43800, 44000, 44200, 43900, 44100, 44500, 44300, 44600, 44800, 44700, 44900, 45000, 44800, 45100, 44900, 45200, 45300, 45100, 45200, 45230],
    high: '46,800', low: '40,200', vol: '$32.1B', mcap: '$886B' },
  { symbol: 'USDC', name: 'USD Coin', price: '1.00', change: '0.0%', positive: true,
    spark: [1, 1, 1, 1, 1, 1, 1], spark30: Array(30).fill(1),
    high: '1.001', low: '0.999', vol: '$5.8B', mcap: '$32.5B' },
  { symbol: 'PEPE', name: 'Pepe', price: '0.0000125', change: '+15.3%', positive: true,
    spark: [80, 85, 90, 95, 100, 110, 125],
    spark30: [50, 55, 52, 58, 62, 60, 65, 70, 68, 72, 75, 73, 78, 80, 82, 79, 85, 88, 86, 90, 92, 95, 93, 98, 100, 105, 108, 112, 118, 125],
    high: '0.0000142', low: '0.0000062', vol: '$1.2B', mcap: '$5.2B' },
  { symbol: 'UNI', name: 'Uniswap', price: '14.23', change: '-1.2%', positive: false,
    spark: [14.8, 14.6, 14.5, 14.3, 14.1, 14.0, 14.23],
    spark30: [15.5, 15.3, 15.1, 15.4, 15.2, 15.0, 14.8, 14.9, 14.7, 14.6, 14.8, 14.5, 14.6, 14.4, 14.5, 14.3, 14.4, 14.2, 14.3, 14.1, 14.2, 14.0, 14.1, 13.9, 14.0, 14.1, 14.0, 14.1, 14.2, 14.23],
    high: '15.80', low: '13.60', vol: '$280M', mcap: '$8.5B' },
  { symbol: 'LINK', name: 'Chainlink', price: '16.74', change: '+0.8%', positive: true,
    spark: [16.2, 16.3, 16.5, 16.4, 16.6, 16.7, 16.74],
    spark30: [15.0, 15.2, 15.4, 15.3, 15.5, 15.7, 15.6, 15.8, 16.0, 15.9, 16.1, 16.0, 16.2, 16.1, 16.3, 16.2, 16.4, 16.3, 16.5, 16.4, 16.6, 16.5, 16.7, 16.6, 16.5, 16.6, 16.7, 16.6, 16.7, 16.74],
    high: '17.20', low: '14.80', vol: '$420M', mcap: '$10.1B' },
];

function MarketPanel() {
  const [tokens, setTokens] = useState(MARKET_DATA);
  const [addInput, setAddInput] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [expandedToken, setExpandedToken] = useState(null);

  const removeToken = (symbol) => {
    setTokens(prev => prev.filter(t => t.symbol !== symbol));
    if (expandedToken === symbol) setExpandedToken(null);
  };

  const addToken = () => {
    const name = addInput.trim().toUpperCase();
    if (!name || tokens.find(t => t.symbol === name)) {
      setAddInput('');
      setShowAdd(false);
      return;
    }
    setTokens(prev => [...prev, {
      symbol: name, name: name, price: '—', change: '—', positive: true,
      spark: [50, 52, 48, 55, 53, 57, 56],
      spark30: Array.from({ length: 30 }, (_, i) => 50 + Math.sin(i / 3) * 10),
      high: '—', low: '—', vol: '—', mcap: '—',
    }]);
    setAddInput('');
    setShowAdd(false);
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="font-mechanical text-[10px] text-gray-400 tracking-[0.15em] uppercase">关注列表</div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-[10px] px-2 py-1 rounded border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors font-mechanical"
        >
          + 添加关注
        </button>
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-3">
          <input
            type="text" value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addToken()}
            placeholder="输入代币符号（如 AAVE）"
            className="flex-1 bg-[#1A1A1A] border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-cyan-500/50 font-mechanical"
            autoFocus
          />
          <button onClick={addToken} className="px-3 py-1.5 rounded bg-cyan-500/20 text-cyan-400 text-xs font-mechanical hover:bg-cyan-500/30 transition-colors">
            添加
          </button>
        </div>
      )}

      {/* Token List */}
      <div className="space-y-0.5">
        {tokens.map(token => (
          <div key={token.symbol}>
            <div
              className="flex items-center justify-between py-2.5 border-b border-white/[0.04] group cursor-pointer hover:bg-white/[0.02] rounded px-1 transition-colors"
              onClick={() => setExpandedToken(expandedToken === token.symbol ? null : token.symbol)}
            >
              <div className="flex items-center gap-3 w-24">
                <div>
                  <div className="text-xs text-white font-mechanical font-bold">{token.symbol}</div>
                  <div className="text-[9px] text-gray-600">{token.name}</div>
                </div>
              </div>
              <Sparkline data={token.spark} color={token.positive ? '#00E676' : '#FF1744'} />
              <div className="text-right w-28">
                <div className="text-xs text-white font-mechanical">${token.price}</div>
                <div className={`text-[10px] font-mechanical ${token.positive ? 'text-green-400' : 'text-red-400'}`}>
                  {token.positive ? '▲' : '▼'} {token.change}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeToken(token.symbol); }}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-xs ml-2 transition-opacity"
              >
                ✕
              </button>
            </div>

            {/* Expanded Large Chart */}
            {expandedToken === token.symbol && (
              <div className="px-2 py-3 bg-white/[0.02] rounded-b mb-1" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                {/* 30-day chart */}
                <div className="mb-3">
                  <div className="text-[9px] text-gray-500 font-mechanical mb-1">30天价格走势</div>
                  <Sparkline data={token.spark30} color={token.positive ? '#00E676' : '#FF1744'} width={500} height={80} />
                </div>
                {/* Market stats */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <div className="text-[9px] text-gray-600 font-mechanical">24h最高</div>
                    <div className="text-[11px] text-white font-mechanical">${token.high}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-gray-600 font-mechanical">24h最低</div>
                    <div className="text-[11px] text-white font-mechanical">${token.low}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-gray-600 font-mechanical">24h成交量</div>
                    <div className="text-[11px] text-white font-mechanical">{token.vol}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-gray-600 font-mechanical">市值</div>
                    <div className="text-[11px] text-white font-mechanical">{token.mcap}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────
export { WalletPanel, SecurityPanel, ScanPanel, MarketPanel };
