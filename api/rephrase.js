/**
 * Gemini Risk Rephrasing API — code picks the template, Gemini only rephrases
 * Gemini NEVER decides content, only rewrites existing text in conversational tone
 */

const SYSTEM_PROMPT = `你是ChainPlain安全助手。你会收到系统预生成的Safety Score数据和风险描述。

规则：
- 永远不要自己编造统计数据、历史表现或概率数字
- 只改写系统提供的文字，使其更口语化、更易懂，不改变任何数字和结论
- 用简单中文解释每个维度的含义
- Safety Score < 40 或蜜罐 → 语气严肃明确
- Safety Score >= 80 → 语气平和但仍提醒"高分不等于无风险"
- 回复控制在3-5句话，简洁有力`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { safetyScore, riskTemplate, mineSignals, tokenSymbol, slippage } = req.body;

  if (!safetyScore || !riskTemplate) {
    return res.status(400).json({ error: 'safetyScore and riskTemplate required' });
  }

  // Build the structured data prompt — Gemini only rephrases, never decides
  const mineWarnings = mineSignals
    ? Object.values(mineSignals)
        .filter(s => s.level !== 'safe')
        .map(s => s.reason)
        .join('；')
    : '';

  const dataPrompt = `请用口语化的中文改写以下安全分析结果，让普通用户能理解。不要改变任何数字和结论。

代币: ${tokenSymbol || '未知'}
Safety Score: ${safetyScore.total}/100 (${safetyScore.grade}级)
${safetyScore.isHoneypot ? '⚠ 蜜罐代币：无法卖出' : ''}

风险描述（请改写这段）:
${riskTemplate.zh}

${mineWarnings ? `排雷信号警告: ${mineWarnings}` : '无排雷警告'}

${slippage ? `动态滑点: 默认${slippage.default}%，上限${slippage.cap}%` : ''}

各维度得分:
- 蜜罐检测: ${safetyScore.scores.honeypot}/30
- 税率: ${safetyScore.scores.tax}/15
- 合约权限: ${safetyScore.scores.permissions}/15
- 合约验证: ${safetyScore.scores.verified}/10
- 市值: ${safetyScore.scores.marketCap}/15
- 持有者集中度: ${safetyScore.scores.holders}/15`;

  const contents = [
    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
    { role: 'model', parts: [{ text: '好的，我会严格按照你提供的数据改写风险描述，不编造任何信息。' }] },
    { role: 'user', parts: [{ text: dataPrompt }] },
  ];

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    });
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || riskTemplate.zh;
    return res.status(200).json({ rephrased: text });
  } catch {
    // Fallback to original template if Gemini fails
    return res.status(200).json({ rephrased: riskTemplate.zh });
  }
}
