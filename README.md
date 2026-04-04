# ChainPilot — DeFi Safety Agent

> Your AI co-pilot for safe DeFi trading. Code-enforced rules that even the AI cannot bypass.

**Live Demo:** [chainpilot-khaki.vercel.app](https://chainpilot-khaki.vercel.app)
**GitHub:** [github.com/Lilyhao24/chainpilot](https://github.com/Lilyhao24/chainpilot)

## What is ChainPilot?

ChainPilot is an AI-powered DeFi security assistant that protects users from scams, honeypots, and risky trades. Unlike traditional safety tools that only warn, ChainPilot **enforces safety rules at the code level** — the AI cannot bypass or override them.

### The Problem

DeFi users face $3.8B+ in annual losses from scams, honeypots, and rug pulls. Existing tools either:
- Only provide warnings that users ignore under FOMO pressure
- Rely on AI judgment that can be manipulated or hallucinate
- Require technical knowledge to interpret raw security data

### Our Solution: Code > AI

```
Layer 1: Safety Score Engine    — 6 dimensions, 100-point scale
Layer 2: Mine Detection         — 3 independent kill signals
Layer 3: Rule Engine            — 7 hard-coded rules, AI cannot bypass
Layer 4: Behavioral Engine      — Cooldown timers + consequence simulation
```

## Features

### Safety Score Engine (6 Dimensions)

| Dimension | Max Points | Data Source |
|-----------|-----------|-------------|
| Honeypot Detection | 30 | GoPlus `is_honeypot` |
| Buy/Sell Tax | 15 | GoPlus `buy_tax` / `sell_tax` |
| Contract Permissions | 15 | GoPlus cross-validation (mintable × open_source) |
| Contract Verification | 10 | GoPlus `is_open_source` |
| Market Cap | 15 | CoinGecko contract endpoint |
| Holder Concentration | 15 | GoPlus `holders[]` top 10 sum |

**Grades:** A (80+) → Safe | B (60+) → Caution | C (40+) → Warning | F (<40 or honeypot) → Blocked

### Mine Detection (3 Independent Kill Signals)
- **Liquidity Check** — No LP = instant block (can't sell after buying)
- **Fake Token Detection** — Triple verification: GoPlus + official address DB + CoinGecko symbol cross-check
- **Blacklist/Pause Risk** — Flags contracts that can freeze your tokens (contextual: A-grade = compliance, low-grade = danger)

### 7 Code-Enforced Rules
1. **Honeypot Block** — Auto-block tokens flagged `is_honeypot=1`
2. **Fake Token Detection** — Triple-verified token identity
3. **Large Trade Protection** — Block trades exceeding 80% of portfolio
4. **Dynamic Slippage** — A: 0.5% / B: 1% / C: 1% (caps: A/B=3%, C=5%)
5. **MEV Protection** — Anti-sandwich attack measures
6. **Gas Anomaly Detection** — Flag abnormal gas prices
7. **Precise Approval** — `approve = tradeAmount × 110%` (BigInt, never infinite)

### Real-Time Token Search
- **Any token, any time** — Type a token name (e.g. "floki", "bnb", "trump") and ChainPilot searches CoinGecko in real-time to find the Ethereum contract address
- **35+ hardcoded top tokens** for instant lookup, CoinGecko API fallback for everything else
- Works for safety queries and swap intents

### AI Features
- **Gemini AI Risk Rephrasing** — Bilingual (中文/English), code selects risk template → Gemini only rephrases
- **Consequence Simulation** — Market-cap-tiered worst-case: "If you invest €1000, you could be left with €50"
- **Cooldown Timer** — C-grade: 5min, B+warn: 3min, F: blocked entirely
- **ENS Deep Integration** — Wallet reverse resolution (`lilyhao.eth`), deployer ENS as trust signal, ENS Profile Cards with avatar/social links

### UI — Richard Mille Mechanical Watch Design
- **Manus design system** — oklch CSS variables, TonneauContainer, SkeletonizedDial, CircularGauge, GearAnimation
- **4 interactive gauge dials** — Wallet (ENS + balance), Security (7/7 rules), Last Scan (history + block rate), Market (ETH/USD live)
- **Orbitron display font** — CHAINPILOT title with red glow
- **Full bilingual** — 中文/English toggle, all components + Gemini prompts switch in real-time
- **BlockScreen** — Red gradient overlay with risk simulation for F-grade tokens
- **Scan history persistence** — localStorage, survives page refresh

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 |
| Wallet | wagmi 2 + RainbowKit 2 + viem 2 |
| Security Data | GoPlus Security API |
| Market Data | CoinGecko API (contract endpoint + search) |
| Token Search | CoinGecko Search API (real-time) |
| Swap Quotes | Uniswap V3 Quoter (on-chain, with fallback rates) |
| AI | Google Gemini API (bilingual system prompts) |
| ENS | viem ENS resolution (1rpc.io/eth) |
| Deploy | Vercel Serverless Functions |

## Architecture

```
User Input (Chat)
    │
    ▼
Intent Parser (regex + token name detection)
    │
    ├──▶ safety_check ──▶ Token in hardcoded list?
    │                      ├─ YES ──▶ GoPlus + CoinGecko ──▶ Safety Score Engine
    │                      └─ NO ───▶ CoinGecko Search API ──▶ resolve address ──▶ Safety Score Engine
    │                                                              │
    │                                                              ├──▶ Mine Detector (3 signals)
    │                                                              ├──▶ Rule Engine (7 rules)
    │                                                              ├──▶ Grade + Slippage + Risk Template
    │                                                              ├──▶ Gemini AI Rephrase (async, bilingual)
    │                                                              └──▶ Deployer ENS Lookup (async)
    │
    ├──▶ swap ──────────▶ Resolve address (if needed) ──▶ Safety Check first, then:
    │                     A-grade: immediate SwapCard (Uniswap V3 quote)
    │                     B+warn:  3min cooldown + consequence simulation
    │                     C-grade: 5min cooldown + consequence simulation
    │                     F-grade: BLOCKED (BlockScreen overlay)
    │
    ├──▶ ens ───────────▶ viem ENS resolution ──▶ ENS Profile Card
    │
    └──▶ chat ──────────▶ Gemini AI general conversation
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/goplus` | GET | Token security data from GoPlus |
| `/api/coingecko` | GET | Market cap by contract address |
| `/api/token-search` | GET | Search any token name → Ethereum contract address (CoinGecko) |
| `/api/uniswap` | POST | Swap quotes from Uniswap V3 Quoter |
| `/api/gemini` | POST | AI chat via Google Gemini |
| `/api/rephrase` | POST | Bilingual risk rephrasing via Gemini |

## Quick Start

```bash
git clone https://github.com/Lilyhao24/chainpilot.git
cd chainpilot
npm install

# Set up environment variables
cp .env.example .env.local
# Add: VITE_WALLETCONNECT_PROJECT_ID, GEMINI_API_KEY

# Dev (uses deployed Vercel API routes)
npm run dev

# Build
npm run build
```

## Key Design Decisions

1. **Code over AI** — Safety rules live in `src/engine/`, not in Gemini prompts. The AI enriches explanations but cannot override blocks.

2. **Progressive friction** — Not binary allow/block. Graduated: instant approval → cooldown timer → consequence simulation → full block.

3. **Unknown = suspicious** — Missing data always scores 0. A token with no market cap data and no holder info gets penalized, not assumed safe.

4. **Triple verification** — Fake token detection uses three independent signals to minimize both false positives and false negatives.

5. **Precise approvals** — Never `approve(MAX_UINT256)`. Every approval is `tradeAmount × 110n / 100n` (pure BigInt, no precision loss).

6. **Real-time token coverage** — Hardcoded top tokens for speed, CoinGecko Search API fallback for any token in existence.

## Bounty Tracks

- **Uniswap** — Real-time V3 on-chain quotes, dynamic slippage tied to Safety Score, MEV protection, precise approval amounts (110% BigInt)
- **ENS** — Wallet reverse resolution, deployer ENS as trust signal, ENS Profile Cards with avatar + social links + description

## Team

Built at ETHGlobal Cannes 2026

## License

MIT
