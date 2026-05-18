# Percium — Private Perps on Solana

Private perpetual trading powered by Arcium's MXE confidential computing.

## Quick Start

```bash
npm install
npm run dev      # → http://localhost:3000
npm run build    # production build
```

## Stack
- React 18 + TypeScript + Vite 5
- `@coral-xyz/anchor` — Solana program client
- `@solana/wallet-adapter-react` — auto-detects Phantom, Solflare, Backpack etc.
- `lightweight-charts` — live TradingView candlestick chart
- `Manrope` font (Google Fonts)

## Program Details
| Key | Value |
|-----|-------|
| Program ID | `76C52sp1b4MbXW6H64H3zDXqaHbGqfT915NVcUm6oZXn` |
| Network | Solana Devnet |
| USDC Mint | `2fxCkXUmGKi3rkBxxHizEtakZi6RZ7ASfDNYZ5xJpYS9` |
| RPC | Helius Devnet (in main.tsx) |
| Arcium MXE | `Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ` |
| GitHub | https://github.com/mustaphaolaonipekun/Percium |

## Pages & Routes
| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Hero, how it works, role cards |
| `/trade` | Dex | Live chart, order book, open/close positions on-chain |
| `/positions` | Positions | Private positions — encrypted via Arcium MXE |
| `/pnl` | PnL Overview | Trade history, private by default, reveal via Arcium |
| `/faucet` | Get Tokens | Devnet faucet, deposit/withdraw USDC |
| `/portfolio` | Portfolio | Real balances, position history, deposit/withdraw |
| `/docs` | Docs | Arcium integration, architecture, program instructions |

## Wallet Connect Fix
- Uses `@solana/wallet-adapter-wallets` with empty array — auto-detects ALL installed wallet extensions
- `onError` suppresses `WalletNotReadyError` so page never goes blank
- `autoConnect: true` reconnects on page reload

## How It Works

1. **Connect Wallet** — Click "Connect Wallet", pick any detected wallet (Phantom, Solflare, Backpack…)
2. **Get Tokens** — Go to `/faucet` to get devnet USDC and SOL airdropped
3. **Deposit** — Move USDC from wallet into Percium protocol balance
4. **Open Position** — Calls `open_position` on-chain; Arcium MXE encrypts collateral + entry price
5. **Arcium MXE** — `encrypt_position`, `compute_liquidation`, `compute_pnl` run in encrypted enclaves
6. **Close Position** — PnL computed privately, only result settled on-chain
7. **View Private History** — Go to PnL page; click "Reveal" on any trade to decrypt details

## Project Structure

```
src/
├── lib/
│   ├── idl.ts               # Anchor IDL for arcium_perp program
│   └── program.ts           # All Solana/Anchor interactions + price feed
├── hooks/
│   ├── useWalletData.ts     # Real-time SOL/USDC/protocol balances
│   ├── useProgram.ts        # Anchor program hooks
│   └── useOrderBook.ts      # Live order book
├── components/
│   ├── Logo.tsx             # Percium SVG logo
│   ├── Sidebar.tsx          # Collapsible DEX sidebar (Trade/Positions/GetTokens/Portfolio/PnL)
│   ├── TopBar.tsx           # Shared top bar with wallet connect
│   └── Toast.tsx            # Success/error/loading toasts
└── pages/
    ├── Landing.tsx          # Marketing landing page
    ├── Dex.tsx              # Main trading page (real Solana)
    ├── Positions.tsx        # Private positions (Arcium encrypted)
    ├── PnL.tsx              # Trade history + PnL, reveal selectively
    ├── Faucet.tsx           # Get devnet tokens + deposit/withdraw
    ├── Portfolio.tsx        # Portfolio overview
    └── Docs.tsx             # Arcium integration documentation
```
