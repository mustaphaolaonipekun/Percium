import Sidebar from '../components/Sidebar'
import Logo from '../components/Logo'

const C = { teal: '#1de9b6', text: '#e8f5e9', textSec: '#81c784', textMuted: '#4a6e5a', purple: '#7c4dff', border: 'rgba(0,230,118,0.10)' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <h2 style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 22, color: C.teal, marginBottom: 14, letterSpacing: '-0.5px' }}>{title}</h2>
      {children}
    </div>
  )
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 15, lineHeight: 1.8, color: C.textSec, marginBottom: 14 }}>{children}</p>
}
function Li({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ listStyle: 'none', padding: '6px 0 6px 22px', fontSize: 14, lineHeight: 1.72, color: C.textSec, position: 'relative' }}>
      <span style={{ position: 'absolute', left: 0, color: '#00e676' }}>→</span>
      {children}
    </li>
  )
}

export default function Docs() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0d1117', fontFamily: 'Manrope' }}>
      <Sidebar />
      <div style={{ flex: 1, overflowY: 'auto', padding: '44px 60px', maxWidth: 880 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Logo size={28} color="#00e676" />
          <h1 style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 40, letterSpacing: '-2px', color: C.text }}>Percium Docs</h1>
        </div>
        <p style={{ fontSize: 16, color: C.textMuted, marginBottom: 48 }}>Private perpetual trading on Solana — powered by Arcium MXE network.</p>

        {/* Arcium callout */}
        <div style={{ background: 'linear-gradient(135deg,rgba(124,77,255,0.08),rgba(0,200,83,0.04))', border: '1px solid rgba(124,77,255,0.22)', borderRadius: 16, padding: '26px 30px', marginBottom: 52 }}>
          <h3 style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 18, color: '#b39ddb', marginBottom: 12 }}>🔒 Powered by Arcium MXE</h3>
          <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.78, margin: 0 }}>
            Percium integrates Arcium Multiparty Execution Environment (MXE) to enable fully
            confidential computation of trades. All position data, order matching, and liquidation
            checks are processed inside encrypted enclaves — only the final settlement PnL is ever
            revealed on-chain. Privacy is enforced by cryptography, not policy.
          </p>
        </div>

        <Section title="What is Percium?">
          <P>
            Percium is a decentralized perpetual futures exchange built on Solana that uses
            Arcium confidential computing infrastructure to protect trader privacy at every
            stage of the trading lifecycle.
          </P>
          <P>
            Traditional DEX perps reveal trader intent publicly on-chain, enabling front-running,
            copy-trading, and targeted liquidations. Percium eliminates these attack vectors by
            moving sensitive computation off the public ledger and into Arcium MXE network.
          </P>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {[
              { label: 'Program ID', value: '76C52sp1b4MbXW6H64H3zDXqaHbGqfT915NVcUm6oZXn' },
              { label: 'Network', value: 'Solana Devnet' },
            ].map(item => (
              <div key={item.label} style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.12)', borderRadius: 10, padding: '10px 14px', flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#00e676', wordBreak: 'break-all' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="How Arcium is Used">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,77,255,0.1)', border: '1px solid rgba(124,77,255,0.28)', borderRadius: 8, padding: '5px 14px', fontSize: 13, color: '#b39ddb', marginBottom: 16 }}>
            🛡 Arcium MXE Integration — Cluster Offset: 456
          </div>
          <P>Arcium MXE is integrated at three critical stages of the trading lifecycle:</P>
          <ul style={{ padding: 0, marginBottom: 16 }}>
            <Li><strong style={{ color: C.text }}>encrypt_position</strong> — After opening a position, collateral and entry price are encrypted by the MXE and stored as ciphertexts on-chain. No one can read these values.</Li>
            <Li><strong style={{ color: C.text }}>compute_liquidation</strong> — The liquidation price is computed privately inside the MXE using encrypted inputs. The formula <code style={{ color: '#ffd740', fontSize: 12 }}>entry × (leverage−1) / leverage</code> runs in a secure enclave.</Li>
            <Li><strong style={{ color: C.text }}>compute_pnl</strong> — When a position is closed, the PnL is computed inside the MXE from encrypted collateral and entry price. Only the final number is revealed on-chain.</Li>
          </ul>
          <div style={{ background: '#0a0f14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 18px', fontSize: 12, fontFamily: 'monospace', color: '#81c784', lineHeight: 1.7 }}>
            <div style={{ color: '#4a6e5a', marginBottom: 4 }}>// MXE Program (Arcium)</div>
            <div>MXE: <span style={{ color: '#ffd740' }}>Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ</span></div>
            <div>USDC Mint: <span style={{ color: '#ffd740' }}>2fxCkXUmGKi3rkBxxHizEtakZi6RZ7ASfDNYZ5xJpYS9</span></div>
            <div>GitHub: <a href="https://github.com/mustaphaolaonipekun/Percium" target="_blank" style={{ color: '#1de9b6' }}>github.com/mustaphaolaonipekun/Percium</a></div>
          </div>
        </Section>

        <Section title="Privacy Benefits">
          <P>By computing inside Arcium MXE, Percium provides concrete guarantees no traditional DEX can match:</P>
          <ul style={{ padding: 0 }}>
            <Li><strong style={{ color: C.text }}>No Copy-Trading</strong> — Positions are invisible until closed. Sophisticated actors cannot mirror your trades in real time.</Li>
            <Li><strong style={{ color: C.text }}>No Targeted Liquidations</strong> — Exact margin levels are private, so liquidation hunters cannot target undercollateralized accounts precisely.</Li>
            <Li><strong style={{ color: C.text }}>No Front-Running</strong> — Orders are matched inside encrypted enclaves. Sandwich attacks and front-running bots are structurally impossible.</Li>
            <Li><strong style={{ color: C.text }}>Deeper Liquidity</strong> — Without adversarial behavior, market makers quote tighter spreads with less risk, resulting in deeper liquidity for all traders.</Li>
            <Li><strong style={{ color: C.text }}>Trustless Privacy</strong> — Unlike CEXs that promise privacy, Arcium MXE is cryptographically verifiable. Privacy is enforced by math, not policy.</Li>
          </ul>
        </Section>

        <Section title="Technical Architecture">
          <P>Percium is built on three layers:</P>
          <ul style={{ padding: 0 }}>
            <Li><strong style={{ color: C.text }}>Solana Program Layer</strong> — On-chain settlement, token custody, and final PnL accounting. Program ID: <code style={{ color: '#ffd740', fontSize: 12 }}>76C52sp1b4MbXW6H64H3zDXqaHbGqfT915NVcUm6oZXn</code></Li>
            <Li><strong style={{ color: C.text }}>Arcium MXE Layer</strong> — Confidential computation of positions, liquidation prices, and PnL. Uses Arcium multi-party computation nodes with cluster offset 456.</Li>
            <Li><strong style={{ color: C.text }}>Keeper Network</strong> — Off-chain bots that monitor for failed offers and trigger cleanups, earning bounties for maintaining order book integrity — without seeing order details.</Li>
          </ul>
        </Section>

        <Section title="Program Instructions">
          {[
            { name: 'initialize_user', desc: 'Creates a user account PDA on first visit. PDA seeds: ["user_account", wallet.publicKey]' },
            { name: 'deposit', desc: 'Deposits USDC from user wallet into protocol balance for trading.' },
            { name: 'withdraw', desc: 'Withdraws USDC from protocol balance back to wallet.' },
            { name: 'open_position', desc: 'Opens a leveraged long/short position with encrypted collateral, entry price, and liquidation price via Arcium MXE.' },
            { name: 'close_position', desc: 'Closes a position. PnL is computed privately by Arcium MXE and only the result is stored on-chain.' },
          ].map(ix => (
            <div key={ix.name} style={{ background: '#0a0f14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 16px', marginBottom: 10 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 14, color: '#00e676', fontWeight: 700, marginBottom: 4 }}>{ix.name}</div>
              <div style={{ fontSize: 13, color: C.textMuted }}>{ix.desc}</div>
            </div>
          ))}
        </Section>

        <Section title="Quick Start">
          <ul style={{ padding: 0 }}>
            <Li>Connect your Solana wallet (Phantom or Solflare) — devnet network</Li>
            <Li>Deposit devnet USDC (<code style={{ color: '#ffd740', fontSize: 12 }}>2fxCkXUm...</code>) to your Percium protocol balance</Li>
            <Li>Navigate to Trade, select a market (SOL/USDC, ETH/USDC, BTC/USDC)</Li>
            <Li>Enter collateral, set leverage (1–20×), choose Long or Short</Li>
            <Li>Click Open Position — your trade is submitted to Solana and encrypted by Arcium</Li>
            <Li>Close your position any time — PnL is computed privately and settled on-chain</Li>
          </ul>
        </Section>

        <Section title="Open Source">
          <P>Percium smart contracts and Arcium MXE programs are fully open source. Review, audit, and contribute on GitHub.</P>
          <a href="https://github.com/mustaphaolaonipekun/Percium" target="_blank" rel="noopener"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', border: '1px solid rgba(0,230,118,0.22)', color: C.text, fontFamily: 'Manrope', fontWeight: 600, fontSize: 14, padding: '11px 22px', borderRadius: 10, cursor: 'pointer', textDecoration: 'none', transition: 'all .2s' }}
            onMouseEnter={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.borderColor='#00e676'; el.style.color='#00e676' }}
            onMouseLeave={e => { const el=e.currentTarget as HTMLAnchorElement; el.style.borderColor='rgba(0,230,118,0.22)'; el.style.color=C.text }}
          >
            ⌥ View on GitHub →
          </a>
        </Section>

      </div>
    </div>
  )
}
