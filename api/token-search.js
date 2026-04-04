export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'query is required' });
  }

  try {
    // Step 1: Search CoinGecko for matching tokens
    const searchRes = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
    );
    if (!searchRes.ok) {
      return res.status(200).json({ address: null, error: 'CoinGecko search failed' });
    }
    const searchData = await searchRes.json();
    const coins = searchData.coins || [];

    if (coins.length === 0) {
      return res.status(200).json({ address: null });
    }

    // Find best match: exact symbol match first, then first result
    const queryUpper = query.trim().toUpperCase();
    const exactMatch = coins.find(c => c.symbol?.toUpperCase() === queryUpper);
    const bestMatch = exactMatch || coins[0];

    // Step 2: Get coin detail to extract Ethereum contract address
    const detailRes = await fetch(
      `https://api.coingecko.com/api/v3/coins/${bestMatch.id}?localization=false&tickers=false&community_data=false&developer_data=false`
    );
    if (!detailRes.ok) {
      return res.status(200).json({ address: null, error: 'CoinGecko detail failed' });
    }
    const detail = await detailRes.json();

    // Extract Ethereum contract address
    const ethAddress = detail.platforms?.ethereum || null;

    return res.status(200).json({
      address: ethAddress,
      name: detail.name,
      symbol: detail.symbol?.toUpperCase(),
      id: detail.id,
      market_cap: detail.market_data?.market_cap?.usd ?? null,
    });
  } catch (err) {
    return res.status(200).json({ address: null, error: err.message });
  }
}
