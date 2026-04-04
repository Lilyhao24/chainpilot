/**
 * ChainPilot Security Engine — Unified entry point
 * Orchestrates: Safety Score + Mine Detection + Rule Enforcement
 */

import { calculateSafetyScore, GRADE_COLORS, DIMENSION_LABELS } from './safetyScore.js';
import { runMineDetection } from './mineDetector.js';
import { enforceRules, getSlippageConfig, simulateConsequence, getRiskTemplate } from './rules.js';
import { checkTokenSecurity, getMarketData } from '../config/api.js';

/**
 * Full security scan for a token address
 * This is the main function called by the chat interface
 *
 * @param {string} address - Token contract address
 * @param {string} chainId - Chain ID (default '1' for Ethereum mainnet)
 * @returns {Object} Complete security analysis
 */
export async function runSecurityScan(address, chainId = '1') {
  // Step 1: Fetch data from both sources in parallel
  const [goplusData, coingeckoData] = await Promise.all([
    checkTokenSecurity(address, chainId),
    getMarketData(address),
  ]);

  // Step 2: Calculate Safety Score (6 dimensions)
  const safetyScore = calculateSafetyScore(goplusData, coingeckoData.market_cap);

  // Step 3: Run mine detection (3 independent signals)
  const mineSignals = runMineDetection(
    address,
    goplusData,
    coingeckoData,
    safetyScore.grade
  );

  // Step 4: Check if any mine signal triggers a block
  const hasBlock = Object.values(mineSignals).some((s) => s.level === 'block');
  // If mine detector blocks, override grade to F
  if (hasBlock && safetyScore.grade !== 'F') {
    safetyScore.grade = 'F';
    safetyScore.forceF = true;
  }

  // Step 5: Get slippage config
  const slippage = getSlippageConfig(safetyScore.grade);

  // Step 6: Get risk description template
  const riskTemplate = getRiskTemplate(coingeckoData.market_cap);

  return {
    address,
    tokenName: goplusData.token_name || coingeckoData.name || 'Unknown',
    tokenSymbol: goplusData.token_symbol || coingeckoData.symbol || '???',
    safetyScore,
    mineSignals,
    slippage,
    riskTemplate,
    gradeColor: GRADE_COLORS[safetyScore.grade],
    dimensionLabels: DIMENSION_LABELS,
    marketCap: coingeckoData.market_cap,
    raw: { goplus: goplusData, coingecko: coingeckoData },
  };
}

// Re-export for direct access
export {
  calculateSafetyScore,
  GRADE_COLORS,
  DIMENSION_LABELS,
  enforceRules,
  getSlippageConfig,
  simulateConsequence,
  getRiskTemplate,
};
