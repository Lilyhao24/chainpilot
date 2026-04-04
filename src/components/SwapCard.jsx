/**
 * SwapCard — Manus-style swap quote with input→arrow→output visual
 * Real Uniswap pricing with fallback. UI only change, logic preserved.
 */

import { useState, useEffect } from 'react';
import { ArrowDown, Shield, Lock } from 'lucide-react';
import { getSwapQuote } from '../config/api.js';
import { useLanguage } from '../contexts/LanguageContext.jsx';

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

const FALLBACK_RATES = {
  'USDC': 2845, 'USDT': 2845, 'DAI': 2845,
  'PEPE': 8000000, 'UNI': 200, 'LINK': 170, 'WBTC': 0.033,
};

function DetailRow({ label, value, note, icon }) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-1 text-right">
        {icon}
        <div>
          <span className="text-xs text-white">{value}</span>
          {note && <p className="text-[10px] text-gray-500">{note}</p>}
        </div>
      </div>
    </div>
  );
}

export default function SwapCard({ token, amount, slippage }) {
  const [confirmed, setConfirmed] = useState(false);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const { t } = useLanguage();

  const slippageDefault = slippage?.default || 0.5;

  useEffect(() => {
    async function fetchQuote() {
      const tokenOut = TOKEN_ADDRESSES[token];
      if (!tokenOut) { setUsingFallback(true); setLoading(false); return; }
      try {
        const data = await getSwapQuote({
          tokenInChainId: 1, tokenOutChainId: 1,
          tokenIn: WETH, tokenOut,
          amount: String(Math.round(parseFloat(amount) * 1e18)),
          type: 'EXACT_INPUT', slippageTolerance: slippageDefault,
          configs: [{ routingType: 'CLASSIC', protocols: ['V2', 'V3', 'MIXED'] }],
        });
        if (data?.quote?.quoteDecimals) {
          setQuote({
            output: parseFloat(data.quote.quoteDecimals).toFixed(token === 'WBTC' ? 6 : 2),
            gasUsd: data.quote.gasUseEstimateUSD || '—',
            route: data.quote.route?.[0]?.[0]?.protocol || 'Uniswap',
          });
        } else { setUsingFallback(true); }
      } catch { setUsingFallback(true); }
      finally { setLoading(false); }
    }
    fetchQuote();
  }, [token, amount, slippageDefault]);

  const outputAmount = quote ? quote.output
    : usingFallback ? (token === 'WBTC'
        ? (parseFloat(amount) * (FALLBACK_RATES[token] || 1)).toFixed(6)
        : (parseFloat(amount) * (FALLBACK_RATES[token] || 1)).toFixed(2))
    : '—';

  const inputUsd = `$${(parseFloat(amount) * 2845).toFixed(2)}`;

  if (loading) {
    return (
      <div className="cp-card my-2">
        <div className="p-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-safe animate-pulse" />
            <span className="text-xs text-gray-400 font-mechanical">{t.fetchingQuote}</span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-8 w-8 mx-auto rounded-full" />
            <div className="skeleton h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-card my-2">
      <div className="p-5">
        {/* Header */}
        <h3 className="text-[10px] font-semibold text-gray-500 tracking-widest mb-4 font-mechanical">{t.swapQuote}</h3>

        {/* Swap Visual: Input → Arrow → Output */}
        <div className="space-y-2 mb-5">
          {/* Input token */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#627EEA' }}>
                E
              </div>
              <span className="text-sm font-bold text-white">{amount} ETH</span>
            </div>
            <span className="text-xs text-gray-500">{inputUsd}</span>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center border" style={{ background: 'rgba(29,158,117,0.1)', borderColor: 'rgba(29,158,117,0.3)' }}>
              <ArrowDown className="w-4 h-4 text-safe" />
            </div>
          </div>

          {/* Output token */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#2775CA' }}>
                {token.charAt(0)}
              </div>
              <span className="text-sm font-bold text-white">{outputAmount} {token}</span>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="space-y-0 mb-5">
          <DetailRow
            label={t.source}
            value={quote ? `Uniswap ${quote.route}` : t.fallbackNote}
          />
          {quote?.gasUsd && (
            <DetailRow label={t.estGas} value={`$${quote.gasUsd}`} />
          )}
          <DetailRow
            label={t.slippage}
            value={`${slippageDefault}%`}
            note={t.slippageNote}
          />
          <DetailRow
            label={t.approval}
            value={t.approvalNote}
            icon={<Lock className="w-3 h-3 text-safe" />}
          />
          <DetailRow label={t.mevProtection} value={t.mevEnabled} />
        </div>

        {/* Confirm Button */}
        {!confirmed ? (
          <button
            onClick={() => setConfirmed(true)}
            className="w-full py-3 rounded-lg text-white text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ backgroundColor: '#1D9E75', boxShadow: '0 0 20px rgba(29, 158, 117, 0.2)' }}
          >
            <Shield className="w-4 h-4" />
            {t.confirmTrade}
          </button>
        ) : (
          <div className="text-center py-3 rounded-lg border border-safe/30" style={{ background: 'rgba(29,158,117,0.08)' }}>
            <div className="text-safe text-sm font-medium flex items-center justify-center gap-1.5">
              <Shield className="w-4 h-4" /> {t.txSubmitted}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">{t.confirmInWallet}</div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-gray-600 text-center mt-3">
          ChainPilot does not hold your private keys
        </p>
      </div>
    </div>
  );
}
