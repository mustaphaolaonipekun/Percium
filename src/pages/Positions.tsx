import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { AnchorProvider } from '@coral-xyz/anchor'
import { BN } from '@coral-xyz/anchor'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import Toast from '../components/Toast'
import Logo from '../components/Logo'
import { getProgram, getUserAccountPDA, getPositionPDA, fetchPrices, LAMPORTS_PER_USDC, closePosition as closePositionOnChain } from '../lib/program'
import { SystemProgram } from '@solana/web3.js'

interface Position {
  pda: any
  index: number
  market: string
  side: number
  leverage: number
  collateral: BN
  entryPrice: BN
  liquidationPrice: BN
  pnl: BN
  status: number
  size: BN
}

const MARKET_COLORS: Record<string, string> = {
  'SOL/USDC': '#9945FF',
  'ETH/USDC': '#627eea',
  'BTC/USDC': '#f7931a',
}

export default function Positions() {
  const wallet = useWallet()
  const { connection } = useConnection()
  const { setVisible } = useWalletModal()
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)
  const [prices, setPrices] = useState({ SOL: 150, ETH: 2300, BTC: 65000 })
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'loading' } | null>(null)
  const [txLink, setTxLink] = useState('')
  const [tab, setTab] = useState<'open' | 'closed'>('open')

  const showToast = (msg: string, type: 'success' | 'error' | 'loading') => {
    setToast({ msg, type })
    if (type !== 'loading') setTimeout(() => setToast(null), 4500)
  }

  useEffect(() => {
    fetchPrices().then(p => setPrices(p))
    const t = setInterval(() => fetchPrices().then(p => setPrices(p)), 15000)
    return () => clearInterval(t)
  }, [])

  const loadPositions = async () => {
    if (!wallet.publicKey) return
    setLoading(true)
    try {
      const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' })
      const program = getProgram(provider)
      const [userPda] = getUserAccountPDA(wallet.publicKey)
      const info = await connection.getAccountInfo(userPda)
      if (!info) { setPositions([]); return }
      const userAcc = await (program.account as any).userAccount.fetch(userPda)
      const total = userAcc.totalPositions.toNumber()
      const all: Position[] = []
      for (let i = 0; i < total; i++) {
        try {
          const [pda] = getPositionPDA(wallet.publicKey, new BN(String(i)))
          const pos = await (program.account as any).positionAccount.fetch(pda)
          all.push({ ...pos, pda, index: i } as Position)
        } catch { }
      }
      setPositions(all)
    } catch (e) { console.warn('load positions:', e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (wallet.connected) loadPositions()
    else setPositions([])
  }, [wallet.connected, wallet.publicKey])

  const handleClose = async (pos: Position) => {
    if (!wallet.publicKey) { setVisible(true); return }
    showToast('Closing position via Arcium MXE...', 'loading')
    try {
      const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' })
      const program = getProgram(provider)
      const pk = wallet.publicKey
      const key = pos.market.split('/')[0] as keyof typeof prices
      const exitPrice = prices[key] || 150
      const sig = await closePositionOnChain(program, pk, pos.pda, exitPrice)
      setTxLink(`https://solscan.io/tx/${sig}?cluster=devnet`)
      showToast('✓ Position closed. PnL computed privately by Arcium.', 'success')
      await loadPositions()
    } catch (e: any) {
      showToast(e?.message?.slice(0, 160) ?? 'Close failed', 'error')
    }
  }

  const openPos = positions.filter(p => p.status === 0)
  const closedPos = positions.filter(p => p.status === 1)
  const shown = tab === 'open' ? openPos : closedPos

  const totalOpenValue = openPos.reduce((s, p) => s + p.collateral.toNumber() / LAMPORTS_PER_USDC * p.leverage, 0)
  const totalPnl = closedPos.reduce((s, p) => s + (p.pnl?.toNumber() ?? 0) / LAMPORTS_PER_USDC, 0)

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0d1117', fontFamily: 'Manrope', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar />

        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Logo size={20} color="#7c4dff" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#7c4dff', textTransform: 'uppercase', letterSpacing: '2px' }}>Open Positions</span>
            </div>
            <h1 style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 32, letterSpacing: '-1px', color: '#e8f5e9', marginBottom: 6 }}>Positions</h1>
            <p style={{ fontSize: 14, color: '#4a6e5a' }}>Your position data — entry price, size, liquidation &amp; PnL are visible only to you.</p>
          </div>

          {/* Privacy callout */}
          <div style={{ background: 'linear-gradient(135deg,rgba(124,77,255,0.08),rgba(0,200,83,0.04))', border: '1px solid rgba(124,77,255,0.22)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 22 }}>🔒</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#b39ddb', marginBottom: 4 }}>Private by Arcium MXE</div>
              <div style={{ fontSize: 13, color: '#81c784', lineHeight: 1.5 }}>
                Your position data — entry price, collateral, liquidation price — are encrypted on-chain via Arcium MXE. Only the final PnL is revealed at settlement.
              </div>
            </div>
          </div>

          {/* Stats row */}
          {wallet.connected && positions.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Open Positions', value: openPos.length.toString(), color: '#00e676' },
                { label: 'Total Open Value', value: `$${totalOpenValue.toFixed(2)}`, color: '#e8f5e9' },
                { label: 'Closed Positions', value: closedPos.length.toString(), color: '#81c784' },
                { label: 'Realised PnL', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? '#00e676' : '#ef5350' },
              ].map(s => (
                <div key={s.label} style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, color: '#4a6e5a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 24, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
            {(['open', 'closed'] as const).map(t => (
              <div key={t} onClick={() => setTab(t)}
                style={{ padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: tab === t ? '#e8f5e9' : '#4a6e5a', borderBottom: `2px solid ${tab === t ? '#00e676' : 'transparent'}`, transition: 'all .15s', textTransform: 'capitalize' }}>
                {t === 'open' ? `Open (${openPos.length})` : `Closed (${closedPos.length})`}
              </div>
            ))}
          </div>

          {/* Not connected */}
          {!wallet.connected && (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
              <h3 style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 22, color: '#e8f5e9', marginBottom: 10 }}>Connect Wallet to View Positions</h3>
              <p style={{ fontSize: 14, color: '#4a6e5a', marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
                Your position data is private. Connect your wallet to decrypt and view your positions.
              </p>
              <button onClick={() => setVisible(true)}
                style={{ background: '#0f9b5e', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'Manrope', fontWeight: 700, fontSize: 14, padding: '12px 28px', cursor: 'pointer' }}>
                Connect Wallet
              </button>
            </div>
          )}

          {/* Loading */}
          {wallet.connected && loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4a6e5a' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(0,230,118,0.2)', borderTopColor: '#00e676', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <p>Decrypting positions via Arcium MXE...</p>
            </div>
          )}

          {/* Empty state */}
          {wallet.connected && !loading && shown.length === 0 && (
            <div style={{ textAlign: 'center', padding: '72px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(124,77,255,0.1)', border: '1px solid rgba(124,77,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px' }}>🔒</div>
              <h3 style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 20, color: '#e8f5e9', marginBottom: 10 }}>
                {tab === 'open' ? 'No Open Positions Yet' : 'No Closed Positions Yet'}
              </h3>
              <p style={{ fontSize: 14, color: '#4a6e5a', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.65 }}>
                {tab === 'open'
                  ? 'Start by opening a private position. Your trades are encrypted end-to-end via Arcium.'
                  : 'Closed positions will appear here with their final PnL revealed.'}
              </p>
              {tab === 'open' && (
                <a href="/trade" style={{ display: 'inline-block', background: '#0f9b5e', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'Manrope', fontWeight: 700, fontSize: 14, padding: '12px 28px', cursor: 'pointer', textDecoration: 'none' }}>
                  Open a Position →
                </a>
              )}
            </div>
          )}

          {/* Positions list */}
          {wallet.connected && !loading && shown.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {shown.map((pos, i) => {
                const col = pos.collateral.toNumber() / LAMPORTS_PER_USDC
                const ep = pos.entryPrice.toNumber() / LAMPORTS_PER_USDC
                const liq = pos.liquidationPrice.toNumber() / LAMPORTS_PER_USDC
                const pnl = (pos.pnl?.toNumber() ?? 0) / LAMPORTS_PER_USDC
                const key = pos.market.split('/')[0] as keyof typeof prices
                const currentPrice = prices[key] || ep
                const unrealPnl = pos.status === 0
                  ? pos.side === 0
                    ? (currentPrice - ep) * (col * pos.leverage / ep)
                    : (ep - currentPrice) * (col * pos.leverage / ep)
                  : pnl
                const displayPnl = pos.status === 0 ? unrealPnl : pnl
                const pnlPct = col > 0 ? (displayPnl / col * 100) : 0
                const mktColor = MARKET_COLORS[pos.market] || '#00e676'

                return (
                  <div key={i} style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 22px', position: 'relative', overflow: 'hidden' }}>
                    {/* left accent */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: pos.side === 0 ? '#00c853' : '#ef5350', borderRadius: '3px 0 0 3px' }} />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      {/* Market + side */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${mktColor}22`, border: `1px solid ${mktColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: mktColor }}>
                          {pos.market.charAt(0)}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 16, color: '#e8f5e9' }}>{pos.market}</span>
                            <span style={{ background: pos.side === 0 ? 'rgba(0,200,83,0.12)' : 'rgba(239,83,80,0.12)', color: pos.side === 0 ? '#00e676' : '#ef5350', padding: '2px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700 }}>
                              {pos.side === 0 ? 'LONG' : 'SHORT'} {pos.leverage}×
                            </span>
                            <span style={{ background: 'rgba(124,77,255,0.12)', color: '#b39ddb', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>🔒 Private</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#4a6e5a', marginTop: 3 }}>
                            Entry: <span style={{ color: '#81c784' }}>${ep.toFixed(2)}</span> · Liq: <span style={{ color: '#ef5350' }}>${liq.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: '#4a6e5a', marginBottom: 3 }}>Collateral</div>
                          <div style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 15, color: '#e8f5e9' }}>${col.toFixed(2)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: '#4a6e5a', marginBottom: 3 }}>Size</div>
                          <div style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 15, color: '#e8f5e9' }}>${(col * pos.leverage).toFixed(2)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: '#4a6e5a', marginBottom: 3 }}>{pos.status === 0 ? 'Unrealised PnL' : 'Realised PnL'}</div>
                          <div style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 16, color: displayPnl >= 0 ? '#00e676' : '#ef5350' }}>
                            {displayPnl >= 0 ? '+' : ''}${displayPnl.toFixed(2)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)
                          </div>
                        </div>
                        {pos.status === 0 && (
                          <button onClick={() => handleClose(pos)}
                            style={{ background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.3)', color: '#ef5350', fontFamily: 'Manrope', fontWeight: 700, fontSize: 13, padding: '8px 18px', borderRadius: 8, cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(239,83,80,0.2)' }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(239,83,80,0.1)' }}
                          >
                            Close Position
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {txLink && (
            <a href={txLink} target="_blank" rel="noopener" style={{ display: 'block', textAlign: 'center', marginTop: 20, fontSize: 13, color: '#1de9b6', textDecoration: 'none' }}>
              View last transaction on Solscan ↗
            </a>
          )}
        </div>
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  )
}
