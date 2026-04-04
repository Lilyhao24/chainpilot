/**
 * Chat — Right 1/3 AI conversation sidebar
 * Intent parsing: token query → safety scan, swap → trade, .eth → ENS, else → Gemini
 */

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { runSecurityScan } from '../engine/index.js';
import { chatWithAI } from '../config/api.js';

// Well-known token addresses for name → address resolution
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

/**
 * Parse user intent from Chinese/English input
 */
function parseIntent(input) {
  const text = input.trim().toLowerCase();

  // Intent 1: Token safety query
  // "帮我查USDC安全吗", "查一下PEPE", "check USDC", "is PEPE safe"
  const safetyPattern = /(?:查|检查|安全|check|safe|scan|analyze)\s*[一下]*\s*/i;
  if (safetyPattern.test(text)) {
    const tokenName = extractTokenName(input);
    if (tokenName) {
      return { type: 'safety_check', token: tokenName, address: TOKEN_ADDRESSES[tokenName] };
    }
  }

  // Also match if input is just a token name or address
  const directToken = extractTokenName(input);
  if (directToken && text.length < 20) {
    return { type: 'safety_check', token: directToken, address: TOKEN_ADDRESSES[directToken] };
  }

  // Check if input is a contract address (0x...)
  const addressMatch = text.match(/0x[a-fA-F0-9]{40}/);
  if (addressMatch) {
    return { type: 'safety_check', token: 'Unknown', address: addressMatch[0] };
  }

  // Intent 2: Swap/trade request
  // "用0.1 ETH买USDC", "swap 0.1 ETH for USDC", "买USDC"
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
  // "vitalik.eth", "查vitalik.eth"
  const ensMatch = input.match(/([a-zA-Z0-9-]+\.eth)/);
  if (ensMatch) {
    return { type: 'ens', name: ensMatch[1] };
  }

  // Intent 4: General chat → Gemini
  return { type: 'chat', message: input };
}

function extractTokenName(input) {
  const upper = input.toUpperCase();
  for (const token of Object.keys(TOKEN_ADDRESSES)) {
    if (upper.includes(token)) return token;
  }
  return null;
}

// Dimension labels for Safety Score card
const DIM_LABELS = {
  honeypot: '蜜罐',
  tax: '税率',
  permissions: '合约权限',
  verified: '验证',
  marketCap: '市值',
  holders: '持有者',
};

const DIM_MAX = {
  honeypot: 30, tax: 15, permissions: 15, verified: 10, marketCap: 15, holders: 15,
};

/**
 * Safety Score Card component (rendered in chat)
 */
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
      {/* Score + Grade */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl font-bold" style={{ color: gradeColor.color }}>
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

      {/* 6 dimension bars */}
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

      {/* Mine signals summary */}
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

/**
 * Swap Quote Card component
 */
function SwapCard({ token, amount }) {
  const rate = token === 'USDC' ? 2845 : token === 'PEPE' ? 0.0000125 : 1;
  const outputAmount = (parseFloat(amount) * rate).toFixed(2);

  return (
    <div className="rounded-lg p-4 my-2 border border-cyan-500/30 bg-cyan-500/5">
      <div className="text-sm font-medium text-white mb-2">
        <span className="text-gray-400">{amount} ETH</span>
        <span className="mx-2 text-cyan-400">→</span>
        <span className="text-cyan-400 font-bold">{outputAmount} {token}</span>
      </div>
      <div className="text-[10px] text-gray-400 space-y-0.5">
        <div>滑点: 0.5%（由Safety Score自动设定）</div>
        <div>授权: 精确授权110%（非无限授权）</div>
      </div>
      <button className="w-full mt-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-colors">
        确认交易
      </button>
    </div>
  );
}

/**
 * Main Chat component
 */
export default function Chat({ onScanComplete }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      type: 'text',
      content: '你好！我是ChainPilot安全助手。你可以：\n• 查代币安全：「帮我查USDC安全吗」\n• 发起交易：「用0.1 ETH买USDC」\n• 查ENS：「vitalik.eth」\n• 或直接问我任何DeFi问题',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { isConnected } = useAccount();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', type: 'text', content: userMessage }]);
    setLoading(true);

    try {
      const intent = parseIntent(userMessage);

      switch (intent.type) {
        case 'safety_check': {
          if (!intent.address) {
            setMessages((prev) => [...prev, {
              role: 'ai', type: 'text',
              content: `抱歉，我不认识「${intent.token}」这个代币。请提供合约地址（0x...）进行查询。`,
            }]);
            break;
          }

          setMessages((prev) => [...prev, {
            role: 'ai', type: 'text', content: `正在扫描 ${intent.token}...`,
          }]);

          const result = await runSecurityScan(intent.address);

          // Replace loading message with result card
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'ai',
              type: 'safety_card',
              result,
            };
            return updated;
          });

          // Notify parent for dashboard update
          onScanComplete?.(result.safetyScore);
          break;
        }

        case 'swap': {
          if (!isConnected) {
            setMessages((prev) => [...prev, {
              role: 'ai', type: 'text',
              content: '请先连接钱包后再进行交易。',
            }]);
            break;
          }

          // First run safety check
          setMessages((prev) => [...prev, {
            role: 'ai', type: 'text',
            content: `正在检查 ${intent.token} 安全性...`,
          }]);

          if (intent.address) {
            const result = await runSecurityScan(intent.address);

            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: 'ai', type: 'safety_card', result,
              };
              return updated;
            });

            onScanComplete?.(result.safetyScore);

            // If safe enough, show swap card
            if (result.safetyScore.grade !== 'F') {
              setMessages((prev) => [...prev, {
                role: 'ai', type: 'swap_card',
                token: intent.token, amount: intent.amount,
              }]);
            } else {
              setMessages((prev) => [...prev, {
                role: 'ai', type: 'text',
                content: '⚠️ 该代币被评为F级，交易已被拦截。为了保护你的资产安全，我们无法执行此交易。',
              }]);
            }
          }
          break;
        }

        case 'ens': {
          setMessages((prev) => [...prev, {
            role: 'ai', type: 'text',
            content: `ENS查询功能将在Phase 6实现。你查询的是：${intent.name}`,
          }]);
          break;
        }

        case 'chat':
        default: {
          const reply = await chatWithAI(userMessage);
          setMessages((prev) => [...prev, {
            role: 'ai', type: 'text', content: reply,
          }]);
          break;
        }
      }
    } catch (error) {
      setMessages((prev) => [...prev, {
        role: 'ai', type: 'text',
        content: `出错了：${error.message}。请稍后再试。`,
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

  return (
    <div className="w-[380px] min-w-[380px] border-l border-gray-800 flex flex-col bg-[#0D0D0D]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-bold text-red-400 tracking-[0.15em]">
          CHAINPILOT AI
        </h2>
        <div className="w-12 h-[1px] bg-red-500/50 mt-1" />
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
              <div className="w-full">
                <SafetyScoreCard result={msg.result} />
              </div>
            )}
            {msg.type === 'swap_card' && (
              <div className="w-full">
                <SwapCard token={msg.token} amount={msg.amount} />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="text-sm text-gray-500 animate-pulse">分析中...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-lg px-3 py-2">
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
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="text-red-400 hover:text-red-300 disabled:opacity-30 transition-colors"
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
