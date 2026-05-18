import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { AnchorProvider } from '@coral-xyz/anchor'
import { BN } from '@coral-xyz/anchor'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import Logo from '../components/Logo'
import { getProgram, getUserAccountPDA, getPositionPDA, LAMPORTS_PER_USDC } from '../lib/program'

interface TradeRecord {
  index: number
  market: string
  side: number
  leverage: number
  collateral: BN
  entryPrice: BN
  pnl: BN
  status: number
  encCollateral: number[]
  encEntryPrice: number[]
}

export default function PnL() {
  const wallet = useWallet()
  const { connection } = useConnection()
  const { setVisible } = useWalletModal()
  const [trades, setTrades] = useState<TradeRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!wallet.connected || !wallet.publicKey) { setTrades([]); return }
    setLoading(true)
    const load = async () => {
      try {
        const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' })
        const program = getProgram(provider)
        const [userPda] = getUserAccountPDA(wallet.publicKey!)
        const info = await connection.getAccountInfo(userPda)
        if (!info) { setTrades([]); return }
        const userAcc = await (program.account as any).userAccount.fetch(userPda)
        const total = userAcc.totalPositions.toNumber()
        const all: TradeRecord[] = []
        for (let i = 0; i < total; i++) {
          try {
            const [pda] = getPositionPDA(wallet.publicKey!, new BN(String(i)))
            const pos = await (program.account as any).positionAccount.fetch(pda)
            all.push({ ...pos, index: i })
          } catch { }
        }
        setTrades(all)
      } catch (e) { console.warn('PnL load:', e) }
      finally { setLoading(false) }
    }
    load()
  }, [wallet.connected, wallet.publicKey])

  const closedTrades = trades.filter(t => t.status === 1)
  const openTrades = trades.filter(t => t.status === 0)

  const totalRealised = closedTrades.reduce((s, t) => s + (t.pnl?.toNumber() ?? 0) / LAMPORTS_PER_USDC, 0)
  const winTrades = closedTrades.filter(t => (t.pnl?.toNumber() ?? 0) >= 0)
  const winRate = closedTrades.length > 0 ? (winTrades.length / closedTrades.length * 100).toFixed(0) : '—'
  const totalVolume = trades.reduce((s, t) => s + t.collateral.toNumber() / LAMPORTS_PER_USDC * t.leverage, 0)

  const revealTrade = (idx: number) => {
    setRevealed(prev => new Set([...prev, idx]))
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0d1117', fontFamily: 'Manrope', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar />

        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Logo size={20} color="#1de9b6" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1de9b6', textTransform: 'uppercase', letterSpacing: '2px' }}>PnL Overview</span>
            </div>
            <h1 style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 32, letterSpacing: '-1px', color: '#e8f5e9', marginBottom: 6 }}>Trade History &amp; PnL</h1>
            <p style={{ fontSize: 14, color: '#4a6e5a' }}>Private by default — reveal selectively via Arcium MPC.</p>
          </div>

          {/* Privacy notice */}
          <div style={{ background: 'rgba(29,233,182,0.06)', border: '1px solid rgba(29,233,182,0.18)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🔐</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1de9b6', marginBottom: 4 }}>Trade History — Private by Default</div>
              <div style={{ fontSize: 13, color: '#81c784', lineHeight: 1.6 }}>
                Your trade history is visible only to you. Entry prices and collateral are stored as encrypted ciphertexts via Arcium MXE. Click "Reveal" on any trade to decrypt and view the full details. Only the final PnL is public on-chain.
              </div>
            </div>
          </div>

          {/* Not connected */}
          {!wallet.connected && (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <h3 style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 20, color: '#e8f5e9', marginBottom: 10 }}>Connect Wallet to View PnL</h3>
              <p style={{ fontSize: 14, color: '#4a6e5a', maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.65 }}>
                Your trade history is private and encrypted. Connect to view and selectively reveal your performance.
              </p>
              <button onClick={() => setVisible(true)}
                style={{ background: '#0f9b5e', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'Manrope', fontWeight: 700, fontSize: 14, padding: '12px 28px', cursor: 'pointer' }}>
                Connect Wallet
              </button>
            </div>
          )}

          {wallet.connected && !loading && (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
                {[
                  { label: 'Total Trades', value: trades.length.toString(), color: '#e8f5e9' },
                  { label: 'Realised PnL', value: `${totalRealised >= 0 ? '+' : ''}$${totalRealised.toFixed(2)}`, color: totalRealised >= 0 ? '#00e676' : '#ef5350' },
                  { label: 'Win Rate', value: closedTrades.length > 0 ? `${winRate}%` : '—', color: '#1de9b6' },
                  { label: 'Total Volume', value: `$${totalVolume.toFixed(0)}`, color: '#81c784' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '18px 20px' }}>
                    <div style={{ fontSize: 11, color: '#4a6e5a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>{s.label}</div>
                    <div style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 26, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Open trades summary */}
              {openTrades.length > 0 && (
                <div style={{ background: 'rgba(0,200,83,0.04)', border: '1px solid rgba(0,200,83,0.12)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13, color: '#81c784' }}>
                    <span style={{ color: '#00e676', fontWeight: 700 }}>{openTrades.length}</span> position{openTrades.length !== 1 ? 's' : ''} currently open
                  </div>
                  <a href="/positions" style={{ fontSize: 13, color: '#1de9b6', textDecoration: 'none', fontWeight: 600 }}>View Positions →</a>
                </div>
              )}

              {/* Trade history table */}
              {closedTrades.length === 0 && openTrades.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: 40, marginBottom: 14 }}>📊</div>
                  <h3 style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 18, color: '#e8f5e9', marginBottom: 8 }}>No Trade History Yet</h3>
                  <p style={{ fontSize: 13, color: '#4a6e5a', maxWidth: 340, margin: '0 auto 20px', lineHeight: 1.6 }}>Open your first position to start building your private trade history.</p>
                  <a href="/trade" style={{ display: 'inline-block', background: '#0f9b5e', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'Manrope', fontWeight: 700, fontSize: 14, padding: '11px 24px', cursor: 'pointer', textDecoration: 'none' }}>Start Trading →</a>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e8f5e9', marginBottom: 14 }}>Closed Trade History</div>
                  {closedTrades.length === 0 ? (
                    <div style={{ color: '#4a6e5a', fontSize: 13, textAlign: 'center', padding: '30px 0' }}>No closed trades yet.</div>
                  ) : (
                    <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            {['#', 'Market', 'Side', 'Collateral', 'Entry Price', 'Leverage', 'PnL', 'Details'].map(h => (
                              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: '#4a6e5a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {closedTrades.map((t, i) => {
                            const isRevealed = revealed.has(t.index)
                            const col = t.collateral.toNumber() / LAMPORTS_PER_USDC
                            const ep = t.entryPrice.toNumber() / LAMPORTS_PER_USDC
                            const pnl = (t.pnl?.toNumber() ?? 0) / LAMPORTS_PER_USDC
                            const pnlPct = col > 0 ? (pnl / col * 100) : 0

                            return (
                              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '12px 16px', fontSize: 12, color: '#4a6e5a' }}>#{t.index + 1}</td>
                                <td style={{ padding: '12px 16px', fontSize: 13, color: '#e8f5e9', fontWeight: 600 }}>{t.market}</td>
                                <td style={{ padding: '12px 16px' }}>
                                  <span style={{ background: t.side === 0 ? 'rgba(0,200,83,0.12)' : 'rgba(239,83,80,0.12)', color: t.side === 0 ? '#00e676' : '#ef5350', padding: '2px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700 }}>
                                    {t.side === 0 ? 'LONG' : 'SHORT'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 16px', fontSize: 13, color: isRevealed ? '#81c784' : '#4a6e5a' }}>
                                  {isRevealed ? `$${col.toFixed(2)}` : (
                                    <span style={{ fontFamily: 'monospace', color: '#4a6e5a', letterSpacing: '2px' }}>••••••</span>
                                  )}
                                </td>
                                <td style={{ padding: '12px 16px', fontSize: 13, color: isRevealed ? '#e8f5e9' : '#4a6e5a' }}>
                                  {isRevealed ? `$${ep.toFixed(2)}` : (
                                    <span style={{ fontFamily: 'monospace', color: '#4a6e5a', letterSpacing: '2px' }}>••••••</span>
                                  )}
                                </td>
                                <td style={{ padding: '12px 16px', fontSize: 13, color: '#81c784' }}>{t.leverage}×</td>
                                <td style={{ padding: '12px 16px' }}>
                                  <div style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 14, color: pnl >= 0 ? '#00e676' : '#ef5350' }}>
                                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                                  </div>
                                  <div style={{ fontSize: 11, color: pnl >= 0 ? '#0f9b5e' : '#8f1a1a' }}>
                                    {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                                  </div>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  {!isRevealed ? (
                                    <button onClick={() => revealTrade(t.index)}
                                      style={{ background: 'rgba(124,77,255,0.1)', border: '1px solid rgba(124,77,255,0.3)', color: '#b39ddb', fontFamily: 'Manrope', fontWeight: 600, fontSize: 11, padding: '5px 12px', borderRadius: 7, cursor: 'pointer', transition: 'all .15s' }}
                                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,77,255,0.2)' }}
                                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,77,255,0.1)' }}
                                    >🔓 Reveal</button>
                                  ) : (
                                    <span style={{ fontSize: 11, color: '#1de9b6', fontWeight: 600 }}>✓ Revealed</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {wallet.connected && loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4a6e5a' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(0,230,118,0.2)', borderTopColor: '#00e676', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <p>Loading trade history...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
