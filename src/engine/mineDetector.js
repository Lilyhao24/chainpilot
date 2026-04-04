/**
 * Mine Detector — 3 independent binary signals (not scored)
 * These run in parallel with Safety Score, can trigger block/warn independently
 */

// Official token addresses — authenticity anchors, not whitelist
const OFFICIAL_TOKENS = {
  'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
  'WETH': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  'WBTC': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  'DAI':  '0x6b175474e89094c44da98b954eedeac495271d0f',
  'UNI':  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
  'LINK': '0x514910771af9ca656af840dff83e8264ecf986ca',
  'PEPE': '0x6982508145454ce325ddbe47a25d4ec3d2311933',
};

/**
 * Signal 1: Liquidity Check
 * block = no liquidity (can't sell), warn = LP unlocked (rug pull risk)
 */
export function checkLiquidity(goplus) {
  const lpSupply = parseFloat(goplus.lp_total_supply || '0');
  const lpHolderCount = parseInt(goplus.lp_holder_count || '0', 10);

  if (lpSupply === 0 || lpHolderCount === 0) {
    return {
      pass: false,
      level: 'block',
      reason: '无流动性：该代币没有交易对，买入后无法卖出',
      reasonEn: 'No liquidity: token has no trading pair, cannot sell after buying',
    };
  }

  // Check if LP is locked (is_locked may not exist, fallback to is_contract)
  const lpHolders = goplus.lp_holders || [];
  const isLpLocked = lpHolders.some(
    (h) => h.is_locked === '1' || h.is_contract === '1'
  );

  if (!isLpLocked && lpHolderCount <= 2) {
    return {
      pass: true,
      level: 'warn',
      reason: '流动性未锁定：项目方可随时撤池（Rug Pull风险）',
      reasonEn: 'LP not locked: project can remove liquidity anytime (Rug Pull risk)',
    };
  }

  return {
    pass: true,
    level: 'safe',
    reason: '流动性正常',
    reasonEn: 'Liquidity normal',
  };
}

/**
 * Signal 2: Fake Token Detection
 * 3-layer verification: GoPlus → Official list → CoinGecko symbol cross-check
 */
export function checkFakeToken(address, goplus, coingeckoData) {
  // Layer 1: GoPlus direct check
  if (goplus.is_true_token === '0') {
    return {
      pass: false,
      level: 'block',
      reason: `假代币：该合约冒充 ${goplus.token_name || 'unknown'}`,
      reasonEn: `Fake token: contract impersonates ${goplus.token_name || 'unknown'}`,
    };
  }

  // Layer 2: Local official address comparison
  const symbol = (goplus.token_symbol || '').toUpperCase();
  const officialAddr = OFFICIAL_TOKENS[symbol];
  if (officialAddr && address.toLowerCase() !== officialAddr) {
    return {
      pass: false,
      level: 'block',
      reason: `假代币：声称是${symbol}但合约地址与官方不符`,
      reasonEn: `Fake token: claims to be ${symbol} but contract address doesn't match official`,
    };
  }

  // Layer 3: CoinGecko symbol cross-validation
  if (coingeckoData && coingeckoData.symbol) {
    const cgSymbol = coingeckoData.symbol.toUpperCase();
    if (cgSymbol !== symbol && symbol !== '') {
      return {
        pass: true,
        level: 'warn',
        reason: `代币符号不一致：GoPlus报告${symbol}，CoinGecko报告${cgSymbol}`,
        reasonEn: `Symbol mismatch: GoPlus reports ${symbol}, CoinGecko reports ${cgSymbol}`,
      };
    }
  }

  return {
    pass: true,
    level: 'safe',
    reason: '代币身份验证通过',
    reasonEn: 'Token identity verified',
  };
}

/**
 * Signal 3: Blacklist/Pause Check
 * Never hard-blocks (USDC/USDT have blacklist for compliance)
 */
export function checkBlacklistPause(goplus, safetyGrade) {
  const hasBlacklist = goplus.is_blacklisted === '1';
  const canPause = goplus.transfer_pausable === '1';

  if (!hasBlacklist && !canPause) {
    return {
      pass: true,
      level: 'safe',
      reason: '无黑名单/暂停风险',
      reasonEn: 'No blacklist/pause risk',
    };
  }

  const warnings = [];
  const warningsEn = [];
  if (hasBlacklist) {
    warnings.push('合约含黑名单功能：项目方可冻结你的代币');
    warningsEn.push('Contract has blacklist: project can freeze your tokens');
  }
  if (canPause) {
    warnings.push('合约可暂停转账：项目方可随时停止所有交易');
    warningsEn.push('Contract can pause transfers: project can stop all trading');
  }

  // Cross-validate with Safety Score: large-cap + open-source + blacklist = compliance feature
  if (safetyGrade === 'A') {
    return {
      pass: true,
      level: 'info',
      reason: warnings.join('；') + '（大市值已验证代币的合规功能，风险较低）',
      reasonEn: warningsEn.join('; ') + ' (compliance feature of verified large-cap token, low risk)',
    };
  }

  const level = hasBlacklist && canPause ? 'warn_high' : 'warn';
  return { pass: true, level, reason: warnings.join('；'), reasonEn: warningsEn.join('; ') };
}

/**
 * Run all 3 mine detection signals
 */
export function runMineDetection(address, goplus, coingeckoData, safetyGrade) {
  return {
    liquidity: checkLiquidity(goplus),
    fakeToken: checkFakeToken(address, goplus, coingeckoData),
    blacklistPause: checkBlacklistPause(goplus, safetyGrade),
  };
}
