const SYSTEM_PROMPT = `你是ChainPilot安全助手。帮助中文用户安全地使用DeFi。
规则：
- 用简单中文回答
- 永远不要自己编造统计数据或历史表现
- 只使用系统提供的Safety Score数据
- Safety Score < 40 或蜜罐 → 语气严肃
- Safety Score >= 80 → 语气平和但提醒"高分不等于无风险"
- 你不能直接执行交易，所有交易需要用户通过钱包签名`;

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
    { role: 'model', parts: [{ text: '我是ChainPilot安全助手，随时帮你检查代币安全。' }] },
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
