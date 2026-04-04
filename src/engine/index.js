/**
 * ChainPilot Security Engine — Unified entry point
 * Orchestrates: Safety Score + Mine Detection + Rule Enforcement
 */

import { calculateSafetyScore, GRADE_COLORS, DIMENSION_LABELS } from './safetyScore.js';
import { runMineDetection } from './mineDetector.js';
import { enforceRules, getSlippageConfig, simulateConsequence, getRiskTemplate } from './rules.js';
import { checkTokenSecurity, getMarketData } from '../config/api.js';
import { checkDeployerENS } from './ensLookup.js';

/**
 * Full security scan for a token address
 * This is the main function called by the chat interface
 *
 * @param {string} address - Token contract address
 * @param {string} chainId - Chain ID (default '1' for Ethereum mainnet)
 * @returns {Object} Complete security analysis
 */
export async function runSecurityScan(address, chainId = '1') {
  // Step 1: Fetch data from all sources in parallel
  const [goplusData, coingeckoData] = await Promise.all([
    checkTokenSecurity(address, chainId),
    getMarketData(address),
  ]);

  // Step 1b: Deployer ENS lookup (non-blocking, runs in parallel with processing)
  const deployerAddress = goplusData.creator_address || goplusData.owner_address;
  const deployerENSPromise = checkDeployerENS(deployerAddress);

  // Step 2: Calculate Safety Score (6 dimensions)
  const safetyScore = calculateSafetyScore(goplusData, coingeckoData.market_cap);

  // Step 3: Run mine detection (3 independent signals)
  const mineSignals = runMineDetection(
    address,
    goplusData,
    coingeckoData,
    safetyScore.grade
  );

  // Step 4: Mine signals affect score and grade
  const signals = Object.values(mineSignals);
  const hasBlock = signals.some((s) => s.level === 'block');
  const warnCount = signals.filter((s) => s.level === 'warn' || s.level === 'warn_high').length;

  // Block-level signal → force F
  if (hasBlock && safetyScore.grade !== 'F') {
    safetyScore.grade = 'F';
    safetyScore.forceF = true;
  }

  // Warn-level signals penalize score: -10 per warning
  if (warnCount > 0) {
    const penalty = warnCount * 10;
    safetyScore.total = Math.max(0, safetyScore.total - penalty);
    safetyScore.warnPenalty = penalty;

    // Recalculate grade from adjusted total
    if (!safetyScore.forceF) {
      if (safetyScore.total >= 80) safetyScore.grade = 'A';
      else if (safetyScore.total >= 60) safetyScore.grade = 'B';
      else if (safetyScore.total >= 40) safetyScore.grade = 'C';
      else safetyScore.grade = 'F';
    }

    // 2+ warnings → downgrade one extra level (but never to F — only block signals force F)
    if (warnCount >= 2 && !safetyScore.forceF) {
      const downgrade = { A: 'B', B: 'C' };
      if (downgrade[safetyScore.grade]) {
        safetyScore.grade = downgrade[safetyScore.grade];
      }
    }
  }

  // Step 5: Get slippage config
  const slippage = getSlippageConfig(safetyScore.grade);

  // Step 6: Get risk description template
  const riskTemplate = getRiskTemplate(coingeckoData.market_cap);

  // Step 7: Await deployer ENS result
  const deployerENS = await deployerENSPromise;

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
    deployerENS,
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
