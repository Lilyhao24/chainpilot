const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : '';

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
