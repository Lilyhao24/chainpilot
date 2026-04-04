/**
 * Chat — Right 1/3 AI conversation sidebar
 * Intent parsing + quick actions + all card types
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Shield } from 'lucide-react';
import { runSecurityScan, simulateConsequence } from '../engine/index.js';
import { chatWithAI, rephraseRisk, searchTokenAddress } from '../config/api.js';
import SafetyScoreCard from './SafetyScoreCard.jsx';
import SwapCard from './SwapCard.jsx';
import ENSProfileCard from './ENSProfileCard.jsx';
import BlockScreen from './BlockScreen.jsx';
import CountdownTimer from './CountdownTimer.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';

// Well-known token addresses (Ethereum mainnet)
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
  'BNB':  '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
  'WBNB': '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
  'SHIB': '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
  'DOGE': '0x4206931337dc273a630d328dA6441786BfaD668f',
  'ARB':  '0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1',
  'OP':   '0x4200000000000000000000000000000000000042',
  'MATIC':'0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
  'POL':  '0x455e53CBB86018Ac2B8092FdCd39d8444aFFC3F6',
  'AAVE': '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
  'MKR':  '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
  'CRV':  '0xD533a949740bb3306d119CC777fa900bA034cd52',
  'LDO':  '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32',
  'APE':  '0x4d224452801ACEd8B2F0aebE155379bb5D594381',
  'SAND': '0x3845badAde8e6dFF049820680d1F14bD3903a5d0',
  'MANA': '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942',
  'COMP': '0xc00e94Cb662C3520282E6f5717214004A7f26888',
  'SNX':  '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
  'SUSHI':'0x6B3595068778DD592e39A122f4f5a5cF09C90fE2',
  '1INCH':'0x111111111117dC0aa78b770fA6A738034120C302',
  'ENS':  '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72',
  'GRT':  '0xc944E90C64B2c07662A292be6244BDf05Cda44a7',
  'FET':  '0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85',
  'RENDER':'0x6De037ef9aD2725EB40118Bb1702EBb27e4Aeb24',
  'IMX':  '0xF57e7e7C23978C3cAEC3C3548E3D615c346e79fF',
  'FLOKI':'0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E',
  'WLD':  '0x163f8C2467924be0ae7B5347228CABF260318753',
  'TRUMP':'0x576e2BeD8F7b46D34016198911Cdf9886f78bea7',
};

function getQuickActions(lang) {
  return lang === 'zh' ? [
    { label: '🔍 查USDC安全', action: '帮我查USDC安全吗' },
    { label: '🐸 查PEPE安全', action: 'PEPE安全吗' },
    { label: '💱 买USDC', action: '用0.1 ETH买USDC' },
    { label: '🔗 vitalik.eth', action: 'vitalik.eth' },
  ] : [
    { label: '🔍 Check USDC', action: 'check USDC safe' },
    { label: '🐸 Check PEPE', action: 'scan PEPE' },
    { label: '💱 Buy USDC', action: 'buy USDC with 0.1 ETH' },
    { label: '🔗 vitalik.eth', action: 'vitalik.eth' },
  ];
}

function getWelcomeMsg(t) {
  return {
    role: 'ai', type: 'text',
    content: `${t.welcomeTitle} \n\n${t.welcomeBody}`,
  };
}

function parseIntent(input) {
  const text = input.trim().toLowerCase();

  // Pure address → safety check
  if (/^0x[a-fA-F0-9]{40}$/.test(text)) {
    return { type: 'safety_check', token: 'Unknown', address: text };
  }

  // ENS lookup
  const ensMatch = input.match(/([a-zA-Z0-9-]+\.eth)/);
  if (ensMatch) return { type: 'ens', name: ensMatch[1] };

  // Safety check — explicit keywords
  const safetyPattern = /(?:查|检查|安全|扫描|check|safe|scan|analyze|score|risk|风险|审计|audit)/i;
  if (safetyPattern.test(text)) {
    const tokenName = extractTokenName(input);
    if (tokenName) return { type: 'safety_check', token: tokenName, address: TOKEN_ADDRESSES[tokenName] };
    const addrMatch = text.match(/0x[a-fA-F0-9]{40}/);
    if (addrMatch) return { type: 'safety_check', token: 'Unknown', address: addrMatch[0] };
  }

  // Swap
  if (/(?:买|换|swap|buy|交易|trade)/i.test(text)) {
    const amounts = text.match(/[\d.]+/);
    const tokenName = extractTokenName(input);
    return {
      type: 'swap', token: tokenName || 'USDC',
      amount: amounts ? amounts[0] : '0.1',
      address: TOKEN_ADDRESSES[tokenName] || TOKEN_ADDRESSES['USDC'],
    };
  }

  // Pure token name (e.g. just "BNB", "pepe", "shib") → auto safety check
  const tokenName = extractTokenName(input);
  if (tokenName && text.replace(/[^a-z0-9]/g, '').length <= tokenName.length + 3) {
    return { type: 'safety_check', token: tokenName, address: TOKEN_ADDRESSES[tokenName] };
  }

  // Short input that looks like a token name (1-10 chars, no spaces) → try CoinGecko lookup
  const cleaned = text.replace(/[^a-z0-9]/g, '');
  if (cleaned.length >= 1 && cleaned.length <= 10 && !text.includes(' ')) {
    return { type: 'safety_check', token: input.trim().toUpperCase(), address: null };
  }

  // General chat
  return { type: 'chat', message: input };
}

function extractTokenName(input) {
  const upper = input.toUpperCase();
  for (const token of Object.keys(TOKEN_ADDRESSES)) {
    if (upper.includes(token)) return token;
  }
  return null;
}

export default function Chat({ onScanComplete }) {
  const { lang, t } = useLanguage();
  const [messages, setMessages] = useState([getWelcomeMsg(t)]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [blockScreen, setBlockScreen] = useState(null);
  const messagesEndRef = useRef(null);
  const { isConnected } = useAccount();

  // Update welcome message + re-rephrase safety cards when language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'ai' && prev[0].type === 'text') {
        return [getWelcomeMsg(t)];
      }
      // Clear rephrasedRisk on existing safety cards so it re-fetches
      const updated = prev.map(m => {
        if (m.type === 'safety_card' && m.result?.rephrasedRisk) {
          return { ...m, result: { ...m.result, rephrasedRisk: null } };
        }
        return m;
      });
      // Re-trigger rephrase for each safety card
      updated.forEach(m => {
        if (m.type === 'safety_card' && m.result) {
          rephraseRisk(m.result, lang).then((rephrased) => {
            setMessages(p => p.map(msg =>
              msg.type === 'safety_card' && msg.result?.address === m.result.address
                ? { ...msg, result: { ...msg.result, rephrasedRisk: rephrased } }
                : msg
            ));
          });
        }
      });
      return updated;
    });
  }, [lang, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const replaceLastMessage = useCallback((msg) => {
    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = msg;
      return updated;
    });
  }, []);

  async function handleSend(overrideInput) {
    const userMessage = (overrideInput || input).trim();
    if (!userMessage || loading) return;

    setInput('');
    setShowQuickActions(false);
    addMessage({ role: 'user', type: 'text', content: userMessage });
    setLoading(true);

    try {
      const intent = parseIntent(userMessage);

      switch (intent.type) {
        case 'safety_check': {
          // If no hardcoded address, search CoinGecko in real-time
          if (!intent.address) {
            addMessage({ role: 'ai', type: 'text', content: lang === 'zh' ? `🔍 正在搜索 ${intent.token}...` : `🔍 Searching ${intent.token}...` });
            const searchResult = await searchTokenAddress(intent.token);
            if (!searchResult.address) {
              replaceLastMessage({ role: 'ai', type: 'text', content: lang === 'zh'
                ? `未找到「${intent.token}」的以太坊合约地址。请直接输入合约地址（0x...）进行扫描。`
                : `Could not find Ethereum contract for "${intent.token}". Please enter the contract address (0x...) directly.`
              });
              break;
            }
            intent.address = searchResult.address;
            intent.token = searchResult.symbol || intent.token;
          }
          addMessage({ role: 'ai', type: 'text', content: lang === 'zh' ? `🔍 正在扫描 ${intent.token}...` : `🔍 Scanning ${intent.token}...` });

          const result = await runSecurityScan(intent.address);
          replaceLastMessage({ role: 'ai', type: 'safety_card', result });
          onScanComplete?.({ ...result.safetyScore, symbol: result.tokenSymbol !== '???' ? result.tokenSymbol : `${intent.address.slice(0,6)}...${intent.address.slice(-4)}` });

          // If F grade, show block screen
          if (result.safetyScore.grade === 'F') {
            setBlockScreen(result);
          }

          // Gemini rephrase — runs in background, updates card when done
          rephraseRisk(result, lang).then((rephrased) => {
            setMessages(prev => prev.map(m =>
              m.type === 'safety_card' && m.result.address === result.address
                ? { ...m, result: { ...m.result, rephrasedRisk: rephrased } }
                : m
            ));
          });
          break;
        }

        case 'swap': {
          if (!isConnected) {
            addMessage({ role: 'ai', type: 'text', content: lang === 'zh' ? '⚠️ 请先连接钱包。点击右上角的连接按钮。' : '⚠️ Please connect your wallet first.' });
            break;
          }
          // Resolve address via CoinGecko if not hardcoded
          if (!intent.address) {
            addMessage({ role: 'ai', type: 'text', content: lang === 'zh' ? `🔍 正在搜索 ${intent.token}...` : `🔍 Searching ${intent.token}...` });
            const searchResult = await searchTokenAddress(intent.token);
            if (!searchResult.address) {
              replaceLastMessage({ role: 'ai', type: 'text', content: lang === 'zh'
                ? `未找到「${intent.token}」的以太坊合约地址，无法交易。`
                : `Could not find Ethereum contract for "${intent.token}".`
              });
              break;
            }
            intent.address = searchResult.address;
            intent.token = searchResult.symbol || intent.token;
          }
          addMessage({ role: 'ai', type: 'text', content: lang === 'zh' ? `🔍 交易前先检查 ${intent.token} 安全性...` : `🔍 Checking ${intent.token} safety before swap...` });

          {
            const result = await runSecurityScan(intent.address);
            replaceLastMessage({ role: 'ai', type: 'safety_card', result });
            onScanComplete?.({ ...result.safetyScore, symbol: result.tokenSymbol !== '???' ? result.tokenSymbol : `${intent.address.slice(0,6)}...${intent.address.slice(-4)}` });

            // Gemini rephrase in background
            rephraseRisk(result, lang).then((rephrased) => {
              setMessages(prev => prev.map(m =>
                m.type === 'safety_card' && m.result.address === result.address
                  ? { ...m, result: { ...m.result, rephrasedRisk: rephrased } }
                  : m
              ));
            });

            if (result.safetyScore.grade === 'F') {
              setBlockScreen(result);
              addMessage({ role: 'ai', type: 'text', content: '🚫 该代币被评为F级，交易已被拦截。' });
            } else {
              // Determine cooldown: C=5min, B+warn=3min, A=none
              const hasWarn = result.mineSignals && Object.values(result.mineSignals).some(
                s => s.level === 'warn' || s.level === 'warn_high'
              );
              let cooldown = 0;
              if (result.safetyScore.grade === 'C') cooldown = 300;
              else if (result.safetyScore.grade === 'B' && hasWarn) cooldown = 180;

              if (cooldown > 0) {
                // Consequence simulation before countdown
                const ethAmount = parseFloat(intent.amount);
                const investUsd = Math.round(ethAmount * 2845); // approximate ETH price
                const consequence = simulateConsequence(result.marketCap, investUsd);
                addMessage({
                  role: 'ai', type: 'consequence',
                  consequence,
                  grade: result.safetyScore.grade,
                });
                addMessage({
                  role: 'ai', type: 'countdown',
                  seconds: cooldown,
                  label: result.safetyScore.grade === 'C' ? '高风险冷却期（5分钟）' : '中风险冷却期（3分钟）',
                  pendingSwap: { token: intent.token, amount: intent.amount, slippage: result.slippage },
                });
              } else {
                addMessage({
                  role: 'ai', type: 'swap_card',
                  token: intent.token, amount: intent.amount, slippage: result.slippage,
                });
              }
            }
          }
          break;
        }

        case 'ens': {
          addMessage({ role: 'ai', type: 'ens_card', name: intent.name });
          break;
        }

        case 'chat':
        default: {
          try {
            const reply = await chatWithAI(userMessage);
            addMessage({ role: 'ai', type: 'text', content: reply });
          } catch {
            addMessage({
              role: 'ai', type: 'text',
              content: '我是 ChainPilot 安全助手。\n\n你可以试试：\n• 「USDC安全吗」检查代币\n• 「用0.1 ETH买USDC」发起交易\n• 「vitalik.eth」查询ENS\n• 或输入合约地址直接扫描',
            });
          }
          break;
        }
      }
    } catch (error) {
      addMessage({ role: 'ai', type: 'text', content: `出错了：${error.message}` });
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

  function resetChat() {
    setMessages([getWelcomeMsg(t)]);
    setShowQuickActions(true);
    setBlockScreen(null);
  }

  return (
    <div className="w-1/2 min-w-[480px] border-l border-white/[0.08] flex flex-col relative" style={{ background: 'linear-gradient(180deg, #111118 0%, #0d0d14 100%)' }}>
      {/* Block Screen Overlay */}
      {blockScreen && (
        <BlockScreen result={blockScreen} onDismiss={() => setBlockScreen(null)} />
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between" style={{ background: 'rgba(23,23,30,0.5)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: '#1D9E75' }} />
          <h2 className="font-display text-xl text-glow-red" style={{ color: '#ff1744' }}>
            {t.chatTitle}
          </h2>
        </div>
        <button
          onClick={resetChat}
          className="text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-all font-mechanical"
        >
          {t.newChat}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.type === 'text' && (
              <div className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-base leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-transparent text-gray-200'
              }`}>
                {msg.content}
              </div>
            )}
            {msg.type === 'safety_card' && <div className="w-full animate-slide-up"><SafetyScoreCard result={msg.result} /></div>}
            {msg.type === 'swap_card' && <div className="w-full animate-slide-up"><SwapCard token={msg.token} amount={msg.amount} slippage={msg.slippage} /></div>}
            {msg.type === 'ens_card' && <div className="w-full animate-slide-up"><ENSProfileCard name={msg.name} /></div>}
            {msg.type === 'consequence' && (
              <div className="w-full animate-slide-up">
                <div
                  className="rounded-lg p-4 my-2"
                  style={{
                    border: `1px solid ${msg.grade === 'C' ? 'rgba(216, 90, 48, 0.3)' : 'rgba(186, 117, 23, 0.3)'}`,
                    background: `linear-gradient(135deg, ${msg.grade === 'C' ? 'rgba(216, 90, 48, 0.08)' : 'rgba(186, 117, 23, 0.08)'}, transparent)`,
                  }}
                >
                  <div className="text-xs font-mechanical mb-2" style={{ color: msg.grade === 'C' ? '#D85A30' : '#BA7517' }}>
                    ⚠ 后果模拟
                  </div>
                  <div className="text-sm text-white mb-2">{msg.consequence.display}</div>
                  <div className="text-[9px] text-gray-600">{msg.consequence.disclaimer}</div>
                </div>
              </div>
            )}
            {msg.type === 'countdown' && (
              <div className="w-full animate-slide-up">
                <div className="rounded-lg p-4 my-2 border border-orange-500/20 bg-orange-500/5 text-center">
                  <div className="text-xs text-orange-400 mb-2 font-mechanical">⏱ 冷却期 — 请等待倒计时结束后确认交易</div>
                  <CountdownTimer
                    seconds={msg.seconds}
                    label={msg.label}
                    onComplete={() => {
                      // Replace countdown message with swap card
                      setMessages(prev => prev.map((m, idx) =>
                        idx === i ? { role: 'ai', type: 'swap_card', ...msg.pendingSwap } : m
                      ));
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {showQuickActions && !loading && (
          <div className="flex flex-wrap gap-2 mt-2">
            {getQuickActions(lang).map((qa, i) => (
              <button
                key={qa.label}
                onClick={() => handleSend(qa.action)}
                className="text-sm px-4 py-2 rounded-full border border-white/10 text-gray-300 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all animate-slide-up font-medium"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {qa.label}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-start w-full">
            <div className="w-full rounded-lg p-4 space-y-3" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(26,26,26,0.5)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-safe animate-pulse" />
                <span className="text-xs text-gray-500 font-mechanical">{t.scanning}</span>
              </div>
              <div className="skeleton h-3 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
              <div className="skeleton h-8 w-full mt-2" />
              <div className="flex gap-2 mt-2">
                <div className="skeleton h-2.5 w-16" />
                <div className="skeleton h-2.5 w-20" />
                <div className="skeleton h-2.5 w-14" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/[0.06]" style={{ background: 'rgba(23,23,30,0.5)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-2 rounded-xl px-3 py-1 border border-white/[0.06] focus-within:border-safe/30 focus-within:shadow-[0_0_12px_rgba(29,158,117,0.1)] transition-all duration-300" style={{ background: 'rgba(23,23,30,0.8)' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.inputPlaceholder}
            className="flex-1 bg-transparent text-base text-white placeholder-gray-500 outline-none py-2"
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-2 rounded-lg transition-all disabled:opacity-30"
            style={{ backgroundColor: 'rgba(29,158,117,0.15)', color: '#1D9E75' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
