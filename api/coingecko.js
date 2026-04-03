export default async function handler(req, res) {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'address is required' });
  }

  try {
    const url = `https://api.coingecko.com/api/v3/coins/ethereum/contract/${address.toLowerCase()}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(200).json({ market_cap: null });
    }

    const data = await response.json();
    return res.status(200).json({
      market_cap: data.market_data?.market_cap?.usd ?? null,
      name: data.name,
      symbol: data.symbol,
    });
  } catch {
    return res.status(200).json({ market_cap: null });
  }
}
