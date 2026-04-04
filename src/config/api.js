// In dev mode, call the deployed Vercel API (no local serverless runtime)
const API_BASE = import.meta.env.DEV ? 'https://chainpilot-khaki.vercel.app' : '';

export async function checkTokenSecurity(address, chainId = '1') {
  const res = await fetch(`${API_BASE}/api/goplus?address=${address}&chainId=${chainId}`);
  const data = await res.json();
  // GoPlus returns data nested under the address key
  const tokenData = data.result?.[address.toLowerCase()] || {};
  return tokenData;
}

export async function getSwapQuote(params) {
  const res = await fetch(`${API_BASE}/api/uniswap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function chatWithAI(message, history = []) {
  const res = await fetch(`${API_BASE}/api/gemini`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  const data = await res.json();
  // Extract text from Gemini response
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '抱歉，我暂时无法回答。';
}

export async function getMarketData(address) {
  const res = await fetch(`${API_BASE}/api/coingecko?address=${address}`);
  return res.json();
}

export async function searchTokenAddress(query) {
  try {
    const res = await fetch(`${API_BASE}/api/token-search?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data; // { address, name, symbol, id, market_cap }
  } catch {
    return { address: null };
  }
}

export async function rephraseRisk(scanResult, lang = 'zh') {
  try {
    const res = await fetch(`${API_BASE}/api/rephrase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        safetyScore: scanResult.safetyScore,
        riskTemplate: scanResult.riskTemplate,
        mineSignals: scanResult.mineSignals,
        tokenSymbol: scanResult.tokenSymbol,
        slippage: scanResult.slippage,
        lang,
      }),
    });
    const data = await res.json();
    const fallback = lang === 'en' ? scanResult.riskTemplate.en : scanResult.riskTemplate.zh;
    return data.rephrased || fallback;
  } catch {
    return lang === 'en' ? scanResult.riskTemplate.en : scanResult.riskTemplate.zh;
  }
}
