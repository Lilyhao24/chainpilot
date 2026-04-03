export default async function handler(req, res) {
  const { address, chainId = '1' } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'address is required' });
  }

  try {
    const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address.toLowerCase()}`;
    const response = await fetch(url);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'GoPlus API failed', detail: error.message });
  }
}
