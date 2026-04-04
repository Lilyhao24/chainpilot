const SYSTEM_PROMPT = `你是 ChainPilot 安全助手，一个专注于 DeFi 和 Web3 领域的 AI 顾问。

你的专业领域：
- 加密货币和代币知识（BTC、ETH、USDC、USDT、PEPE、UNI 等）
- DeFi 概念（DEX、流动性池、Swap、Yield Farming、质押）
- 钱包安全（私钥保管、授权管理、钓鱼防范）
- 智能合约风险（蜜罐、Rug Pull、无限授权）
- ENS 域名系统
- Gas 费用和交易机制
- 区块链基础知识（以太坊、Layer2、跨链）

回答规则：
- 用简洁的中文回答，像朋友聊天一样自然
- 回答控制在 2-4 句话，不要太长
- 涉及具体代币安全时，建议用户使用 ChainPilot 的安全扫描功能（输入"查XXX安全吗"）
- 永远不编造价格、涨幅、收益率等具体数字
- 不给投资建议，只提供安全和知识层面的帮助
- 遇到非 Web3 话题，简短回应后引导回 DeFi 安全话题
- 提醒用户"高分不等于无风险，投资需谨慎"`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { message, history = [] } = req.body;

  const contents = [
    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
    { role: 'model', parts: [{ text: '你好！我是 ChainPilot 安全助手，专注于 DeFi 和 Web3 安全。有什么我能帮你的？' }] },
    ...history,
    { role: 'user', parts: [{ text: message }] },
  ];

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Gemini API failed', detail: error.message });
  }
}
