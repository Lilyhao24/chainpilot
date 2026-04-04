# ChainPilot - DeFi Safety Agent

> Your AI co-pilot for safe DeFi trading. Code-enforced rules that even the AI cannot bypass.

**Live Demo:** [chainpilot-khaki.vercel.app](https://chainpilot-khaki.vercel.app)

## What is ChainPilot?

ChainPilot is an AI-powered DeFi security assistant that protects users from scams, honeypots, and risky trades. Unlike traditional safety tools that only warn, ChainPilot **enforces safety rules at the code level** - the AI cannot bypass or override them.

### The Problem

DeFi users face $3.8B+ in annual losses from scams, honeypots, and rug pulls. Existing tools either:
- Only provide warnings that users ignore under FOMO pressure
- Rely on AI judgment that can be manipulated or hallucinate
- Require technical knowledge to interpret raw security data

### Our Solution: Code > AI

ChainPilot implements a **three-layer security architecture** where safety rules are enforced by code, not by AI:

```
Layer 1: Safety Score Engine (6 dimensions, 100-point scale)
Layer 2: Mine Detection (3 independent kill signals)
Layer 3: Rule Engine (7 hard-coded rules, AI cannot bypass)
```

## Features

### Safety Score Engine
- **6-dimension analysis**: Honeypot (30pt), Tax (15pt), Permissions (15pt), Verification (10pt), Market Cap (15pt), Holders (15pt)
- **Grade system**: A (80+) / B (60+) / C (40+) / F (blocked)
- Data from GoPlus Security API + CoinGecko

### Mine Detection (3 Kill Signals)
- **Fake Token Detection**: Triple verification via GoPlus + official address + CoinGecko symbol cross-check
- **Liquidity Check**: Flags tokens with dangerously low or concentrated liquidity
- **Whale Concentration**: Alerts when top holders control excessive supply

### 7 Code-Enforced Rules
1. **Honeypot Block** - Auto-block tokens that can't be sold
2. **Fake Token Detection** - Triple-verified token identity
3. **Large Trade Protection** - Block trades exceeding portfolio threshold
4. **Dynamic Slippage** - A: 0.5% / B: 1% / C: 1% (cap 5%)
5. **MEV Protection** - Anti-sandwich attack measures
6. **Gas Anomaly Detection** - Flag abnormal gas prices
7. **Precise Approval** - approve = trade amount x 110% (never infinite)

### AI Features
- **Gemini AI Risk Rephrasing** - Technical risks explained in plain language
- **Consequence Simulation** - "If you invest $X, here's what could happen"
- **Cooldown Timer** - Forced waiting period: C-grade 5min, B+warn 3min
- **ENS Integration** - Deployer ENS lookup as trust signal + reverse resolution

### UI
- Richard Mille mechanical watch inspired dashboard
- 4 interactive gauge dials (Wallet, Security, Scan History, Market)
- Real-time Uniswap V3 swap quotes
- Full-screen block overlay for F-grade tokens

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 |
| Wallet | wagmi 2 + RainbowKit 2 + viem 2 |
| Security Data | GoPlus Security API |
| Market Data | CoinGecko API |
| Swap Quotes | Uniswap V3/V4 API |
| AI | Google Gemini API |
| ENS | viem ENS resolution (llamarpc) |
| Deploy | Vercel Serverless Functions |

## Architecture

```
User Input (Chat)
    |
    v
Intent Parser (regex-based, 4 types)
    |
    +---> safety_check --> GoPlus + CoinGecko --> Safety Score Engine
    |                                              |
    |                                              +--> Mine Detector (3 signals)
    |                                              |
    |                                              +--> Rule Engine (7 rules)
    |                                              |
    |                                              +--> Grade + Slippage + Risk Template
    |                                              |
    |                                              +--> Gemini AI Rephrase (async)
    |
    +---> swap ---------> Safety Check first, then:
    |                     A-grade: immediate swap card
    |                     B+warn: 3min cooldown + consequence sim
    |                     C-grade: 5min cooldown + consequence sim
    |                     F-grade: BLOCKED (full-screen overlay)
    |
    +---> ens ----------> viem ENS resolution --> Profile card
    |
    +---> chat ---------> Gemini AI general conversation
```

## Quick Start

```bash
# Clone
git clone https://github.com/Lilyhao24/chainpilot.git
cd chainpilot

# Install
npm install

# Set up environment variables
cp .env.example .env.local
# Add your API keys: GOPLUS_API_KEY, GEMINI_API_KEY, COINGECKO_API_KEY

# Dev (uses deployed API routes)
npm run dev

# Build
npm run build
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/goplus` | GET | Token security data from GoPlus |
| `/api/coingecko` | GET | Market data from CoinGecko |
| `/api/uniswap` | POST | Swap quotes from Uniswap |
| `/api/gemini` | POST | AI chat via Google Gemini |
| `/api/rephrase` | POST | Risk rephrasing via Gemini |

## Key Design Decisions

1. **Code over AI**: Safety rules are enforced in `src/engine/rules.js`, not by Gemini. The AI enriches explanations but cannot override blocks.

2. **Progressive friction**: Instead of binary allow/block, we use graduated responses - immediate approval for safe tokens, forced cooldowns for risky ones, and full blocks for dangerous ones.

3. **Consequence simulation**: Before risky trades, we show "if you invest $X in a token with $Y market cap, a Z% dump would cost you $W" - making risk concrete, not abstract.

4. **Triple verification**: Fake token detection uses three independent signals (GoPlus + known address database + CoinGecko symbol cross-check) to minimize false positives.

5. **Precise approvals**: We never request infinite token approval. Every approve transaction is capped at 110% of the trade amount.

## Bounty Tracks

- **Uniswap**: Real-time V3 swap quotes with dynamic slippage, MEV protection, and precise approval amounts
- **ENS**: Deployer ENS lookup as trust signal, reverse resolution for connected wallet, ENS profile cards

## Team

Built at ETHGlobal Cannes 2026

## License

MIT
