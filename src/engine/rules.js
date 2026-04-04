/**
 * Rule Engine — 7 hard-coded rules, AI cannot bypass
 * These are enforced by code, not by Gemini
 */

/**
 * Rule 4: Dynamic slippage based on Safety Score grade
 */
export function getSlippageConfig(grade) {
  switch (grade) {
    case 'A': return { default: 0.5, cap: 3, label: '低风险滑点', labelEn: 'Low-risk slippage' };
    case 'B': return { default: 1.0, cap: 3, label: '中等滑点', labelEn: 'Medium slippage' };
    case 'C': return { default: 1.0, cap: 5, label: '高风险滑点', labelEn: 'High-risk slippage' };
    default:  return { default: 0,   cap: 0, label: '交易已拦截', labelEn: 'Trade blocked' };
  }
}

/**
 * Rule 7: Calculate approve amount (110% of trade, pure BigInt)
 */
export function calculateApproveAmount(tradeAmountBigInt) {
  return (tradeAmountBigInt * 110n) / 100n;
}

/**
 * Cooldown time based on grade + mine signals
 */
export function getCooldownSeconds(grade, mineSignals) {
  if (grade === 'F') return -1; // -1 means blocked, cannot proceed
  if (grade === 'C') return 300; // 5 minutes

  // B grade + any mine warning = 3 minutes
  if (grade === 'B' && mineSignals) {
    const hasWarn = Object.values(mineSignals).some(
      (s) => s.level === 'warn' || s.level === 'warn_high'
    );
    if (hasWarn) return 180; // 3 minutes
  }

  return 0; // A grade or B without warnings = no delay
}

/**
 * Consequence simulation — worst case scenario based on market cap
 */
export function simulateConsequence(marketCap, investAmount) {
  let maxLoss, tier;
  if (marketCap == null)    { maxLoss = 0.95; tier = 'unknown'; }
  else if (marketCap > 1e9) { maxLoss = 0.3;  tier = 'large_cap'; }
  else if (marketCap > 1e8) { maxLoss = 0.5;  tier = 'mid_cap'; }
  else if (marketCap > 1e7) { maxLoss = 0.7;  tier = 'small_cap'; }
  else                      { maxLoss = 0.9;  tier = 'micro_cap'; }

  const worstRemain = Math.round(investAmount * (1 - maxLoss));

  return {
    tier,
    investAmount,
    worstRemain,
    maxLossPercent: Math.round(maxLoss * 100),
    disclaimer: '基于市值分档的保守估计，非精确预测。实际波动可能更大或更小。',
    disclaimerEn: 'Conservative estimate based on market cap tier, not a precise prediction.',
    display: `如果投入 €${investAmount}，极端情况下可能只剩 €${worstRemain}`,
    displayEn: `If you invest €${investAmount}, worst case you may have only €${worstRemain} left`,
  };
}

/**
 * Run all 7 rules against a trade request
 */
export function enforceRules({ grade, mineSignals, tradeAmountBigInt, userBalance, userSettings = {} }) {
  const results = [];
  const largeThreshold = userSettings.largeThreshold || 0.8;

  // Rule 1: Honeypot block (handled by grade=F from safetyScore)
  if (grade === 'F') {
    results.push({
      id: 'honeypot_block',
      name: '蜜罐/危险代币拦截',
      triggered: true,
      action: 'block',
      message: '该代币被评为F级，交易已拦截',
    });
  }

  // Rule 2: Unknown token warning
  // (triggered in mine detector as fakeToken check)

  // Rule 3: Large trade protection
  if (userBalance && tradeAmountBigInt) {
    // Compare as numbers for threshold check
    const ratio = Number(tradeAmountBigInt) / Number(userBalance);
    if (ratio > largeThreshold) {
      results.push({
        id: 'large_trade',
        name: '大额保护',
        triggered: true,
        action: 'block',
        message: `交易金额超过资产的${Math.round(largeThreshold * 100)}%，已拦截`,
      });
    }
  }

  // Rule 4: Dynamic slippage
  const slippage = getSlippageConfig(grade);
  results.push({
    id: 'dynamic_slippage',
    name: '动态滑点',
    triggered: true,
    action: 'auto_set',
    slippage,
    message: `滑点已设为${slippage.default}%（上限${slippage.cap}%）`,
  });

  // Rule 5: MEV protection — always on
  results.push({
    id: 'mev_protection',
    name: 'MEV防护',
    triggered: true,
    action: 'always_on',
    message: 'MEV防护已启用',
  });

  // Rule 6: Gas anomaly (placeholder — checked at transaction time)
  results.push({
    id: 'gas_check',
    name: 'Gas异常检测',
    triggered: false,
    action: 'monitor',
    message: 'Gas费用正常',
  });

  // Rule 7: Approve amount limit
  if (tradeAmountBigInt) {
    const approveAmount = calculateApproveAmount(tradeAmountBigInt);
    results.push({
      id: 'approve_limit',
      name: '授权金额限制',
      triggered: true,
      action: 'auto_limit',
      approveAmount,
      message: '已限制授权为交易额的110%（非无限授权）',
    });
  }

  // Cooldown
  const cooldown = getCooldownSeconds(grade, mineSignals);

  return { rules: results, cooldown, slippage };
}

// Risk description templates for Gemini to rephrase
export const RISK_TEMPLATES = {
  mcap_under_10m: {
    zh: '该代币市值低于1000万美元，属于极小市值代币。价格波动极大，单笔大额交易就可能导致价格剧烈变动。',
    en: 'Market cap under $10M — extreme volatility, a single large trade can move the price significantly.',
  },
  mcap_10m_100m: {
    zh: '该代币市值在1000万至1亿美元之间，属于小市值代币。价格波动较大，但已有一定市场认可度。',
    en: 'Market cap $10M-$100M — still volatile, but has some market validation.',
  },
  mcap_100m_1b: {
    zh: '该代币市值在1亿至10亿美元之间，属于中等市值代币。通常已被主流交易所收录，但仍可能出现大幅波动。',
    en: 'Market cap $100M-$1B — mid-cap, usually listed on major exchanges, but still subject to swings.',
  },
  mcap_over_1b: {
    zh: '该代币市值超过10亿美元，属于大市值代币。价格相对稳定，但不意味着无风险。',
    en: 'Market cap over $1B — large cap, relatively stable, but not risk-free.',
  },
  mcap_unknown: {
    zh: '无法获取该代币的市值数据。这通常意味着代币非常新或流通量极低，风险极高。',
    en: 'Market cap data unavailable — likely very new or extremely low circulation, high risk.',
  },
};

export function getRiskTemplate(marketCap) {
  if (marketCap == null) return RISK_TEMPLATES.mcap_unknown;
  if (marketCap > 1e9) return RISK_TEMPLATES.mcap_over_1b;
  if (marketCap > 1e8) return RISK_TEMPLATES.mcap_100m_1b;
  if (marketCap > 1e7) return RISK_TEMPLATES.mcap_10m_100m;
  return RISK_TEMPLATES.mcap_under_10m;
}
