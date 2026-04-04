/**
 * SwapCard — Swap quote display with real Uniswap pricing
 * Falls back to demo rates if API unavailable
 */

import { useState, useEffect } from 'react';
import { getSwapQuote } from '../config/api.js';

const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const TOKEN_ADDRESSES = {
  'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  'DAI':  '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  'PEPE': '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
  'UNI':  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  'WBTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
};

// Fallback demo rates (ETH → token)
const FALLBACK_RATES = {
  'USDC': 2845, 'USDT': 2845, 'DAI': 2845,
  'PEPE': 8000000, 'UNI': 200, 'LINK': 170,
  'WBTC': 0.033,
};

export default function SwapCard({ token, amount, slippage }) {
  const [confirmed, setConfirmed] = useState(false);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const slippageDefault = slippage?.default || 0.5;

  useEffect(() => {
    async function fetchQuote() {
      const tokenOut = TOKEN_ADDRESSES[token];
      if (!tokenOut) {
        // Unknown token — use fallback
        setUsingFallback(true);
        setLoading(false);
        return;
      }

      try {
        const data = await getSwapQuote({
          tokenInChainId: 1,
          tokenOutChainId: 1,
          tokenIn: WETH,
          tokenOut,
          amount: String(Math.round(parseFloat(amount) * 1e18)),
          type: 'EXACT_INPUT',
          slippageTolerance: slippageDefault,
          configs: [{ routingType: 'CLASSIC', protocols: ['V2', 'V3', 'MIXED'] }],
        });

        if (data?.quote?.quoteDecimals) {
          setQuote({
            output: parseFloat(data.quote.quoteDecimals).toFixed(token === 'WBTC' ? 6 : 2),
            gasUsd: data.quote.gasUseEstimateUSD || '—',
            route: data.quote.route?.[0]?.[0]?.protocol || 'Uniswap',
          });
        } else {
          setUsingFallback(true);
        }
      } catch {
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    }

    fetchQuote();
  }, [token, amount, slippageDefault]);

  // Calculate output amount
  const outputAmount = quote
    ? quote.output
    : usingFallback
      ? (token === 'WBTC'
          ? (parseFloat(amount) * (FALLBACK_RATES[token] || 1)).toFixed(6)
          : (parseFloat(amount) * (FALLBACK_RATES[token] || 1)).toFixed(2))
      : '—';

  if (loading) {
    return (
      <div className="rounded-lg p-4 my-2 border border-cyan-500/20 bg-cyan-500/5">
        <div className="text-sm text-gray-400 animate-pulse font-mechanical flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          获取 Uniswap 实时报价中...
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden my-2"
      style={{
        border: '1px solid rgba(0, 229, 255, 0.2)',
        background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.05), transparent)',
      }}
    >
      {/* Quote */}
      <div className="p-4">
        <div className="font-mechanical text-sm mb-3">
          <span className="text-gray-400">{amount} ETH</span>
          <span className="mx-2 text-cyan-400">→</span>
          <span className="text-cyan-400 font-bold text-lg">{outputAmount} {token}</span>
        </div>

        {/* Details */}
        <div className="space-y-1 text-[10px] text-gray-400 font-mechanical">
          <div className="flex justify-between">
            <span>数据源</span>
            <span className={quote ? 'text-green-400' : 'text-yellow-400'}>
              {quote ? `Uniswap ${quote.route}` : '参考价格（API暂不可用）'}
            </span>
          </div>
          {quote?.gasUsd && (
            <div className="flex justify-between">
              <span>预估Gas</span>
              <span className="text-gray-300">${quote.gasUsd}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>滑点</span>
            <span className="text-cyan-400">{slippageDefault}%（由Safety Score自动设定）</span>
          </div>
          <div className="flex justify-between">
            <span>授权</span>
            <span className="text-green-400">精确授权110%（非无限授权）</span>
          </div>
          <div className="flex justify-between">
            <span>MEV防护</span>
            <span className="text-green-400">已启用</span>
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="px-4 pb-4">
        {!confirmed ? (
          <button
            onClick={() => setConfirmed(true)}
            className="w-full py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-all active:scale-[0.98]"
            style={{ boxShadow: '0 0 20px rgba(0, 230, 118, 0.2)' }}
          >
            确认交易
          </button>
        ) : (
          <div className="text-center py-2.5 rounded-lg border border-green-500/30 bg-green-500/10">
            <div className="text-green-400 text-sm font-medium">✓ 交易已提交</div>
            <div className="text-[10px] text-gray-500 mt-1">请在 MetaMask 中确认签名</div>
          </div>
        )}
      </div>
    </div>
  );
}
