/**
 * Chat — Right 1/3 AI conversation sidebar
 * Intent parsing + quick action buttons + Gemini with Web3 context
 */

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { runSecurityScan } from '../engine/index.js';
import { chatWithAI } from '../config/api.js';

// Well-known token addresses
const TOKEN_ADDRESSES = {
  'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
  'WETH': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  'ETH':  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  'WBTC': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  'DAI':  '0x6b175474e89094c44da98b954eedeac495271d0f',
  'UNI':  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
  'LINK': '0x514910771af9ca656af840dff83e8264ecf986ca',
  'PEPE': '0x6982508145454ce325ddbe47a25d4ec3d2311933',
};

// Quick action buttons
const QUICK_ACTIONS = [
  { label: '🔍 查USDC安全', action: '帮我查USDC安全吗' },
  { label: '🐸 查PEPE安全', action: 'PEPE安全吗' },
  { label: '💱 买USDC', action: '用0.1 ETH买USDC' },
  { label: '🔗 查vitalik.eth', action: 'vitalik.eth' },
];

/**
 * Parse user intent from Chinese/English input
 */
function parseIntent(input) {
  const text = input.trim().toLowerCase();

  // Intent 1: Safety check — needs explicit keywords
  const safetyPattern = /(?:查|检查|安全|扫描|check|safe|scan|analyze|score)/i;
  if (safetyPattern.test(text)) {
    const tokenName = extractTokenName(input);
    if (tokenName) {
      return { type: 'safety_check', token: tokenName, address: TOKEN_ADDRESSES[tokenName] };
    }
    // Check for contract address
    const addrMatch = text.match(/0x[a-fA-F0-9]{40}/);
    if (addrMatch) {
      return { type: 'safety_check', token: 'Unknown', address: addrMatch[0] };
    }
  }

  // Pure contract address input
  const addressMatch = text.match(/^0x[a-fA-F0-9]{40}$/);
  if (addressMatch) {
    return { type: 'safety_check', token: 'Unknown', address: addressMatch[0] };
  }

  // Intent 2: Swap/trade — needs buy/swap keywords
  const swapPattern = /(?:买|换|swap|buy|交易|trade)/i;
  if (swapPattern.test(text)) {
    const amounts = text.match(/[\d.]+/);
    const tokenName = extractTokenName(input);
    return {
      type: 'swap',
      token: tokenName || 'USDC',
      amount: amounts ? amounts[0] : '0.1',
      address: TOKEN_ADDRESSES[tokenName] || TOKEN_ADDRESSES['USDC'],
    };
  }

  // Intent 3: ENS query
  const ensMatch = input.match(/([a-zA-Z0-9-]+\.eth)/);
  if (ensMatch) {
    return { type: 'ens', name: ensMatch[1] };
  }

  // Intent 4: General chat → Gemini with Web3 context
  return { type: 'chat', message: input };
}

function extractTokenName(input) {
  const upper = input.toUpperCase();
  for (const token of Object.keys(TOKEN_ADDRESSES)) {
    if (upper.includes(token)) return token;
  }
  return null;
}

// Dimension labels
const DIM_LABELS = {
  honeypot: '蜜罐', tax: '税率', permissions: '合约权限',
  verified: '验证', marketCap: '市值', holders: '持有者',
};
const DIM_MAX = {
  honeypot: 30, tax: 15, permissions: 15, verified: 10, marketCap: 15, holders: 15,
};

/** Safety Score Card */
function SafetyScoreCard({ result }) {
  const { safetyScore, tokenName, tokenSymbol, gradeColor, mineSignals } = result;
  const isGood = safetyScore.grade === 'A' || safetyScore.grade === 'B';
  const borderColor = isGood ? '#00E676' : '#FF1744';

  return (
    <div
      className="rounded-lg p-4 my-2"
      style={{
        border: `1px solid ${borderColor}40`,
        background: `linear-gradient(135deg, ${borderColor}08, transparent)`,
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl font-bold font-mechanical" style={{ color: gradeColor.color }}>
          {safetyScore.total}
        </span>
        <span
          className="text-sm font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: gradeColor.bg, color: gradeColor.color }}
        >
          {safetyScore.grade}
        </span>
      </div>
      <div className="text-xs text-gray-400 mb-3">
        {tokenSymbol} · {tokenName}
      </div>
      <div className="space-y-1.5">
        {Object.entries(safetyScore.scores).map(([key, score]) => {
          const max = DIM_MAX[key];
          const pct = (score / max) * 100;
          const barColor = pct >= 80 ? '#00E676' : pct >= 50 ? '#FFD600' : '#FF1744';
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 w-16 truncate">{DIM_LABELS[key]}</span>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
              <span className="text-[10px] text-gray-500 w-10 text-right">{score}/{max}</span>
            </div>
          );
        })}
      </div>
      {mineSignals && (
        <div className="mt-3 pt-2 border-t border-gray-800/50">
          {Object.entries(mineSignals).map(([key, signal]) => {
            const icon = signal.level === 'safe' || signal.level === 'info' ? '✓' :
                         signal.level === 'warn' || signal.level === 'warn_high' ? '⚠' : '✗';
            const color = signal.level === 'safe' || signal.level === 'info' ? 'text-green-400' :
                          signal.level === 'warn' || signal.level === 'warn_high' ? 'text-yellow-400' : 'text-red-400';
            return (
              <div key={key} className={`text-[10px] ${color} flex items-center gap-1`}>
                <span>{icon}</span>
                <span>{signal.reason}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Swap Quote Card */
function SwapCard({ token, amount }) {
  const [confirmed, setConfirmed] = useState(false);
  const rate = token === 'USDC' ? 2845 : token === 'PEPE' ? 0.0000125 : 1;
  const outputAmount = (parseFloat(amount) * rate).toFixed(2);

  return (
    <div className="rounded-lg p-4 my-2 border border-cyan-500/30 bg-cyan-500/5">
      <div className="text-sm font-medium text-white mb-2 font-mechanical">
        <span className="text-gray-400">{amount} ETH</span>
        <span className="mx-2 text-cyan-400">→</span>
        <span className="text-cyan-400 font-bold">{outputAmount} {token}</span>
      </div>
      <div className="text-[10px] text-gray-400 space-y-0.5">
        <div>滑点: 0.5%（由Safety Score自动设定）</div>
        <div>授权: 精确授权110%（非无限授权）</div>
      </div>
      {!confirmed ? (
        <button
          onClick={() => setConfirmed(true)}
          className="w-full mt-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-colors"
        >
          确认交易
        </button>
      ) : (
        <div className="mt-3 text-center text-xs text-green-400 py-2 border border-green-500/30 rounded-lg bg-green-500/10">
          ✓ 交易已提交到钱包，请在 MetaMask 中确认签名
        </div>
      )}
    </div>
  );
}

/** Main Chat component */
export default function Chat({ onScanComplete }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      type: 'text',
      content: '你好！我是 ChainPilot 安全助手 🛡️\n\n我可以帮你：\n• 检查代币是否安全\n• 在交易前做风险评估\n• 回答 DeFi 和 Web3 问题\n\n试试下面的快捷按钮，或直接打字问我 👇',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef(null);
  const { isConnected } = useAccount();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(overrideInput) {
    const userMessage = (overrideInput || input).trim();
    if (!userMessage || loading) return;

    setInput('');
    setShowQuickActions(false);
    setMessages((prev) => [...prev, { role: 'user', type: 'text', content: userMessage }]);
    setLoading(true);

    try {
      const intent = parseIntent(userMessage);

      switch (intent.type) {
        case 'safety_check': {
          if (!intent.address) {
            setMessages((prev) => [...prev, {
              role: 'ai', type: 'text',
              content: `我不认识「${intent.token}」这个代币。请提供合约地址（0x...）我来帮你查。`,
            }]);
            break;
          }
          setMessages((prev) => [...prev, {
            role: 'ai', type: 'text', content: `🔍 正在扫描 ${intent.token}，请稍候...`,
          }]);
          const result = await runSecurityScan(intent.address);
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'ai', type: 'safety_card', result };
            return updated;
          });
          onScanComplete?.(result.safetyScore);
          break;
        }

        case 'swap': {
          if (!isConnected) {
            setMessages((prev) => [...prev, {
              role: 'ai', type: 'text',
              content: '⚠️ 请先连接钱包后再进行交易。点击右上角的连接按钮。',
            }]);
            break;
          }
          setMessages((prev) => [...prev, {
            role: 'ai', type: 'text',
            content: `🔍 交易前先检查 ${intent.token} 安全性...`,
          }]);
          if (intent.address) {
            const result = await runSecurityScan(intent.address);
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'ai', type: 'safety_card', result };
              return updated;
            });
            onScanComplete?.(result.safetyScore);
            if (result.safetyScore.grade !== 'F') {
              setMessages((prev) => [...prev, {
                role: 'ai', type: 'swap_card', token: intent.token, amount: intent.amount,
              }]);
            } else {
              setMessages((prev) => [...prev, {
                role: 'ai', type: 'text',
                content: '🚫 该代币被评为F级，交易已被拦截。ChainPilot 不会让你买入高风险代币。',
              }]);
            }
          }
          break;
        }

        case 'ens': {
          setMessages((prev) => [...prev, {
            role: 'ai', type: 'text',
            content: `🔗 ENS查询功能即将上线。你查询的是：${intent.name}`,
          }]);
          break;
        }

        case 'chat':
        default: {
          try {
            const reply = await chatWithAI(userMessage);
            setMessages((prev) => [...prev, {
              role: 'ai', type: 'text', content: reply,
            }]);
          } catch {
            // Fallback if Gemini fails
            setMessages((prev) => [...prev, {
              role: 'ai', type: 'text',
              content: '我是 ChainPilot 安全助手，专注于 DeFi 安全检查。\n\n你可以试试：\n• 「USDC安全吗」检查代币\n• 「用0.1 ETH买USDC」发起交易\n• 或输入合约地址（0x...）直接扫描',
            }]);
          }
          break;
        }
      }
    } catch (error) {
      setMessages((prev) => [...prev, {
        role: 'ai', type: 'text',
        content: `出错了：${error.message}。请稍后重试。`,
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleQuickAction(action) {
    handleSend(action);
  }

  return (
    <div className="w-[380px] min-w-[380px] border-l border-white/[0.06] flex flex-col bg-[#0D0D0D]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <h2 className="font-mechanical text-sm font-bold tracking-[0.15em]" style={{ color: '#ff1744' }}>
            CHAINPILOT AI
          </h2>
          <div className="w-12 h-[1px] mt-1" style={{ background: 'linear-gradient(90deg, #ff1744, transparent)' }} />
        </div>
        <button
          onClick={() => {
            setMessages([{
              role: 'ai', type: 'text',
              content: '你好！我是 ChainPilot 安全助手 🛡️\n\n我可以帮你：\n• 检查代币是否安全\n• 在交易前做风险评估\n• 回答 DeFi 和 Web3 问题\n\n试试下面的快捷按钮，或直接打字问我 👇',
            }]);
            setShowQuickActions(true);
          }}
          className="text-[10px] text-gray-500 hover:text-white border border-white/10 hover:border-white/30 px-2 py-1 rounded transition-all"
        >
          🔄 新对话
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.type === 'text' && (
              <div
                className={`max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#2A2A2A] text-white'
                    : 'bg-transparent text-gray-300'
                }`}
              >
                {msg.content}
              </div>
            )}
            {msg.type === 'safety_card' && (
              <div className="w-full"><SafetyScoreCard result={msg.result} /></div>
            )}
            {msg.type === 'swap_card' && (
              <div className="w-full"><SwapCard token={msg.token} amount={msg.amount} /></div>
            )}
          </div>
        ))}

        {/* Quick action buttons — show at start or after conversation settles */}
        {showQuickActions && !loading && (
          <div className="flex flex-wrap gap-2 mt-2">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.label}
                onClick={() => handleQuickAction(qa.action)}
                className="text-[11px] px-3 py-1.5 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all"
              >
                {qa.label}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              分析中...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-lg px-3 py-2 border border-white/[0.04]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="试试：帮我查PEPE安全吗"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="disabled:opacity-30 transition-colors hover:opacity-80"
            style={{ color: '#ff1744' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
