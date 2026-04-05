import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

const translations = {
  zh: {
    // Header
    tagline: '安全 DEFI 代理',
    realtime: '安全',
    precision: '透明',
    safety: '智能',

    // Dials
    wallet: '钱包',
    securityEngine: '安全引擎',
    lastScan: '最近扫描',
    market: '行情',
    active: '已激活',
    connectWallet: '连接钱包',
    noScans: '暂无扫描',
    scans: '次扫描',
    blocked: '次拦截',

    // Metric cards
    btcUsd: 'BTC/USD',
    ethUsd: 'ETH/USD',
    totalMcap: '总市值',
    portfolio: '投资组合',

    // Transactions
    recentTx: '最近交易',
    minsAgo: '分钟前',
    hourAgo: '小时前',

    // Safety Score Card
    safetyScore: '安全评分',
    honeypot: '蜜罐检测',
    tax: '买卖税率',
    permissions: '合约权限',
    verified: '合约验证',
    marketCap: '市值评估',
    holders: '持有者分析',
    viewDetails: '查看详情',
    hideDetails: '收起详情',
    dynamicSlippage: '动态滑点',
    aiRiskAnalysis: 'AI 风险解读',
    aiAnalyzing: 'AI 分析中...',
    honeypotWarning: '蜜罐代币：检测到该代币无法卖出。投入的资金将无法取回。',
    deployerEns: '部署者身份',

    // Swap Card
    swapQuote: '交易报价',
    source: '数据源',
    estGas: '预估Gas',
    slippage: '滑点',
    slippageNote: '由Safety Score自动设定',
    approval: '授权方式',
    approvalNote: '精确授权110%（非无限授权）',
    mevProtection: 'MEV防护',
    mevEnabled: '已启用',
    confirmTrade: '确认交易',
    txSubmitted: '交易已提交',
    confirmInWallet: '请在 MetaMask 中确认签名',
    fallbackNote: '参考价格（API暂不可用）',
    fetchingQuote: '获取 Uniswap 实时报价中...',

    // Block Screen
    txBlocked: '交易已拦截',
    blockedByRule: '硬编码安全规则已阻止此交易',
    blockReason: '拦截原因',
    riskSim: '风险模拟',
    honeypotBlock: '蜜罐代币检测',
    honeypotBlockDetail: '该代币无法卖出。一旦买入，你的资金将被永久锁定。',
    fakeTokenBlock: '假代币检测',
    noLiquidityBlock: '无流动性',
    ruleSource: '规则来源：硬编码规则 — AI无法绕过',
    iUnderstand: '我已了解风险',
    consequenceSim: '后果模拟',

    // Dial panels
    walletDetails: '钱包详情',
    securityRules: '安全规则',
    scanHistory: '扫描历史',
    marketWatchlist: '关注列表',
    totalScans: '总扫描',
    totalBlocked: '已拦截',
    blockRate: '拦截率',
    latestScore: '最新评分',
    noScanHint: '在右侧聊天中输入代币名称开始扫描',
    noScanExample: '例如："帮我查USDC安全吗"',
    userSettings: '用户可调设置',
    largeThreshold: '大额保护阈值',
    largeThresholdDesc: '超过资产此比例触发拦截',
    cooldownTime: '冷却时间',
    mevLabel: 'MEV防护',
    mevDesc: '保护交易不被抢跑',
    approveMode: '授权模式',
    approveModeDesc: '精确授权110%（不可修改）',
    locked: 'LOCKED',
    noCooldown: '不冷却',
    addWatch: '添加关注',
    day30Chart: '30天价格走势',
    high24h: '24h最高',
    low24h: '24h最低',
    vol24h: '24h成交量',
    mcapLabel: '市值',
    connectFirst: '请先连接钱包以查看详情',

    // Chat
    chatTitle: 'CHAINPILOT AI',
    newChat: '新对话',
    welcomeTitle: '你好！我是 ChainPilot 安全助手',
    welcomeBody: '我可以帮你：\n• 检查代币是否安全\n• 在交易前做风险评估\n• 查询 ENS 域名信息\n• 回答 DeFi 和 Web3 问题\n\n试试下面的快捷按钮，或直接打字问我',
    inputPlaceholder: '试试：帮我查PEPE安全吗',
    scanning: '扫描中...',

    // Cooldown
    cooldownHigh: '高风险冷却期（5分钟）',
    cooldownMed: '中风险冷却期（3分钟）',
    cooldownWait: '冷却期 — 请等待倒计时结束后确认交易',
  },

  en: {
    tagline: 'SAFE DEFI AGENT',
    realtime: 'SAFE',
    precision: 'TRANSPARENT',
    safety: 'SMART',

    wallet: 'WALLET',
    securityEngine: 'SECURITY',
    lastScan: 'LAST SCAN',
    market: 'MARKET',
    active: 'ACTIVE',
    connectWallet: 'Connect Wallet',
    noScans: 'No scans yet',
    scans: ' scans',
    blocked: ' blocked',

    btcUsd: 'BTC/USD',
    ethUsd: 'ETH/USD',
    totalMcap: 'MARKET CAP',
    portfolio: 'PORTFOLIO',

    recentTx: 'RECENT TRANSACTIONS',
    minsAgo: 'mins ago',
    hourAgo: 'hour ago',

    safetyScore: 'SAFETY SCORE',
    honeypot: 'Honeypot',
    tax: 'Tax',
    permissions: 'Permissions',
    verified: 'Verification',
    marketCap: 'Market Cap',
    holders: 'Holders',
    viewDetails: 'View Details',
    hideDetails: 'Hide Details',
    dynamicSlippage: 'Dynamic Slippage',
    aiRiskAnalysis: 'AI Risk Analysis',
    aiAnalyzing: 'AI analyzing...',
    honeypotWarning: 'Honeypot: This token cannot be sold. Invested funds will be permanently locked.',
    deployerEns: 'Deployer Identity',

    swapQuote: 'SWAP QUOTE',
    source: 'Source',
    estGas: 'Est. Gas',
    slippage: 'Slippage',
    slippageNote: 'Auto-set by Safety Score',
    approval: 'Approval',
    approvalNote: 'Exact 110% (no infinite approval)',
    mevProtection: 'MEV Protection',
    mevEnabled: 'Enabled',
    confirmTrade: 'Confirm Trade',
    txSubmitted: 'Transaction Submitted',
    confirmInWallet: 'Please confirm in MetaMask',
    fallbackNote: 'Reference price (API unavailable)',
    fetchingQuote: 'Fetching Uniswap quote...',

    txBlocked: 'TRANSACTION BLOCKED',
    blockedByRule: 'Hard-coded safety rules blocked this trade',
    blockReason: 'Block Reason',
    riskSim: 'Risk Simulation',
    honeypotBlock: 'Honeypot Detected',
    honeypotBlockDetail: 'This token cannot be sold. Once purchased, your funds will be permanently locked.',
    fakeTokenBlock: 'Fake Token Detected',
    noLiquidityBlock: 'No Liquidity',
    ruleSource: 'Source: Hard-coded rule — AI cannot bypass',
    iUnderstand: 'I understand the risks',
    consequenceSim: 'Consequence Simulation',

    walletDetails: 'WALLET DETAILS',
    securityRules: 'SECURITY RULES',
    scanHistory: 'SCAN HISTORY',
    marketWatchlist: 'WATCHLIST',
    totalScans: 'Total Scans',
    totalBlocked: 'Blocked',
    blockRate: 'Block Rate',
    latestScore: 'Latest Score',
    noScanHint: 'Type a token name in the chat to start scanning',
    noScanExample: 'e.g., "Is USDC safe?"',
    userSettings: 'User Settings',
    largeThreshold: 'Large Trade Threshold',
    largeThresholdDesc: 'Block trades exceeding this % of assets',
    cooldownTime: 'Cooldown Time',
    mevLabel: 'MEV Protection',
    mevDesc: 'Protect against frontrunning',
    approveMode: 'Approval Mode',
    approveModeDesc: 'Exact 110% (cannot change)',
    locked: 'LOCKED',
    noCooldown: 'No cooldown',
    addWatch: 'Add Token',
    day30Chart: '30-Day Price',
    high24h: '24h High',
    low24h: '24h Low',
    vol24h: '24h Volume',
    mcapLabel: 'Market Cap',
    connectFirst: 'Connect wallet to view details',

    chatTitle: 'CHAINPILOT AI',
    newChat: 'New Chat',
    welcomeTitle: "Hi! I'm ChainPilot Security Assistant",
    welcomeBody: "I can help you:\n• Check if a token is safe\n• Run risk assessments before trades\n• Look up ENS domain info\n• Answer DeFi & Web3 questions\n\nTry the buttons below, or just type",
    inputPlaceholder: 'Try: Is PEPE safe?',
    scanning: 'Scanning...',

    cooldownHigh: 'High-risk cooldown (5 min)',
    cooldownMed: 'Medium-risk cooldown (3 min)',
    cooldownWait: 'Cooldown — Please wait before confirming',
  },
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');
  const t = translations[lang];
  const toggleLang = () => setLang((l) => (l === 'zh' ? 'en' : 'zh'));

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
  return ctx;
}
