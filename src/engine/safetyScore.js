/**
 * Safety Score Calculator — 6 dimensions, 100 points max
 * Data sources: GoPlus (5 dimensions) + CoinGecko (1 dimension)
 */

export function calculateSafetyScore(goplusData, marketCap) {
  const scores = {};
  let forceF = false;

  // 1. Honeypot Detection (30 pts)
  const isHoneypot = goplusData.is_honeypot === '1';
  scores.honeypot = isHoneypot ? 0 : 30;
  if (isHoneypot) forceF = true;

  // 2. Buy/Sell Tax (15 pts)
  const buyTax = parseFloat(goplusData.buy_tax || '0');
  const sellTax = parseFloat(goplusData.sell_tax || '0');
  const maxTax = Math.max(buyTax, sellTax) * 100; // Convert to percentage
  if (maxTax < 5) scores.tax = 15;
  else if (maxTax <= 10) scores.tax = 8;
  else scores.tax = 0;

  // 3. Contract Permissions (15 pts) — Cross-validation matrix
  const mintable = goplusData.is_mintable === '1';
  const ownerCanChange = goplusData.owner_change_balance === '1';
  const openSource = goplusData.is_open_source === '1';
  if (!mintable && !ownerCanChange) scores.permissions = 15;
  else if (mintable && openSource) scores.permissions = 10;
  else if (!mintable && ownerCanChange) scores.permissions = 5;
  else scores.permissions = 0; // mintable + closed source = most dangerous

  // 4. Contract Verification (10 pts)
  scores.verified = openSource ? 10 : 0;

  // 5. Market Cap (15 pts)
  if (marketCap == null) scores.marketCap = 0;
  else if (marketCap > 1e9) scores.marketCap = 15;
  else if (marketCap > 1e8) scores.marketCap = 10;
  else if (marketCap > 1e7) scores.marketCap = 5;
  else scores.marketCap = 0;

  // 6. Holder Concentration (15 pts)
  const holders = goplusData.holders;
  if (!holders || !Array.isArray(holders) || holders.length === 0) {
    scores.holders = 0;
  } else {
    const top10Pct = holders
      .slice(0, 10)
      .reduce((sum, h) => sum + parseFloat(h.percent || 0), 0);
    if (top10Pct < 0.3) scores.holders = 15;
    else if (top10Pct <= 0.5) scores.holders = 8;
    else scores.holders = 0;
  }

  // Total & Grade
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  let grade;
  if (forceF) grade = 'F';
  else if (total >= 80) grade = 'A';
  else if (total >= 60) grade = 'B';
  else if (total >= 40) grade = 'C';
  else grade = 'F';

  return { total, grade, scores, forceF, isHoneypot };
}

// Grade color mapping for UI
export const GRADE_COLORS = {
  A: { color: '#1D9E75', bg: 'rgba(29, 158, 117, 0.15)', label: 'Safe' },
  B: { color: '#BA7517', bg: 'rgba(186, 117, 23, 0.15)', label: 'Caution' },
  C: { color: '#D85A30', bg: 'rgba(216, 90, 48, 0.15)', label: 'Warning' },
  F: { color: '#E24B4A', bg: 'rgba(226, 75, 74, 0.15)', label: 'Danger' },
};

// Dimension labels for UI display
export const DIMENSION_LABELS = {
  honeypot:    { name: 'Honeypot',       nameZh: '蜜罐检测', max: 30 },
  tax:         { name: 'Tax Rate',       nameZh: '税率',     max: 15 },
  permissions: { name: 'Permissions',    nameZh: '合约权限', max: 15 },
  verified:    { name: 'Verification',   nameZh: '合约验证', max: 10 },
  marketCap:   { name: 'Market Cap',     nameZh: '市值',     max: 15 },
  holders:     { name: 'Holders',        nameZh: '持有者',   max: 15 },
};
