import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { AnchorProvider } from '@coral-xyz/anchor'
import { BN } from '@coral-xyz/anchor'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import Toast from '../components/Toast'
import { useWalletData } from '../hooks/useWalletData'
import { getProgram, getUserAccountPDA, getPositionPDA, LAMPORTS_PER_USDC, depositUSDC, withdrawUSDC } from '../lib/program'
import { TrendingUp } from 'lucide-react'

export default function Portfolio() {
  const wallet = useWallet()
  const { connection } = useConnection()
  const { setVisible } = useWalletModal()
  const { data: walletData, refresh, refreshAfterTx } = useWalletData()
  const [positions, setPositions] = useState<any[]>([])
  const [bottomTab, setBottomTab] = useState('Positions')
  const [chartTab, setChartTab] = useState('Account Value')
  const [showModal, setShowModal] = useState(false)
  const [depositAmt, setDepositAmt] = useState('')
  const [withdrawAmt, setWithdrawAmt] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'loading' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' | 'loading') => {
    setToast({ msg, type })
    if (type !== 'loading') setTimeout(() => setToast(null), 4500)
  }

  const loadPositions = async () => {
    if (!wallet.publicKey) return
    try {
      const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' })
      const program = getProgram(provider)
      const [userPda] = getUserAccountPDA(wallet.publicKey)
      const info = await connection.getAccountInfo(userPda)
      if (!info) { setPositions([]); return }
      const userAcc = await (program.account as any).userAccount.fetch(userPda)
      const total = userAcc.totalPositions.toNumber()
      const all: any[] = []
      for (let i = 0; i < total; i++) {
        try {
          const [pda] = getPositionPDA(wallet.publicKey, new BN(String(i)))
          const pos = await (program.account as any).positionAccount.fetch(pda)
          all.push({ ...pos, pda, index: i })
        } catch { }
      }
      setPositions(all)
    } catch (e) { console.warn(e) }
  }

  useEffect(() => {
    if (wallet.connected) loadPositions()
    else setPositions([])
  }, [wallet.connected, wallet.publicKey])

  const handleDeposit = async () => {
    if (!wallet.connected || !wallet.publicKey) { setVisible(true); return }
    const amt = parseFloat(depositAmt)
    if (!depositAmt || isNaN(amt) || amt <= 0) return
    if (walletData.usdcBalance < amt - 0.001) {
      showToast(`Insufficient wallet USDC. You have $${walletData.usdcBalance.toFixed(2)}. Go to Get Tokens to mint more.`, 'error'); return
    }
    showToast('Depositing...', 'loading')
    try {
      const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' })
      const program = getProgram(provider)
      const sig = await depositUSDC(program, wallet.publicKey, connection, amt)
      showToast(`✓ $${amt.toFixed(2)} USDC deposited to protocol!`, 'success')
      setDepositAmt('')
      await refreshAfterTx(2500)
    } catch (e: any) { showToast(e?.message?.slice(0, 200) ?? 'Deposit failed', 'error') }
  }

  const handleWithdraw = async () => {
    if (!wallet.connected || !wallet.publicKey) { setVisible(true); return }
    const amt = parseFloat(withdrawAmt)
    if (!withdrawAmt || isNaN(amt) || amt <= 0) return
    if (walletData.protocolBalance <= 0) {
      showToast('You have no protocol balance to withdraw.', 'error'); return
    }
    if (walletData.protocolBalance < amt - 0.001) {
      showToast(`Insufficient protocol balance. You have $${walletData.protocolBalance.toFixed(2)} available.`, 'error'); return
    }
    showToast('Withdrawing...', 'loading')
    try {
      const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' })
      const program = getProgram(provider)
      const sig = await withdrawUSDC(program, wallet.publicKey, connection, amt)
      showToast(`✓ $${amt.toFixed(2)} USDC withdrawn to wallet!`, 'success')
      setWithdrawAmt('')
      await refreshAfterTx(2500)
    } catch (e: any) { showToast(e?.message?.slice(0, 200) ?? 'Withdraw failed', 'error') }
  }

  const openPositions = positions.filter(p => p.status === 0)
  const closedPositions = positions.filter(p => p.status === 1)
  const totalPnl = positions.reduce((s, p) => s + (p.pnl?.toNumber() ?? 0) / LAMPORTS_PER_USDC, 0)
  const totalVolume = positions.reduce((s, p) => s + (p.collateral?.toNumber() ?? 0) / LAMPORTS_PER_USDC * (p.leverage ?? 1), 0)
  const shownPositions = bottomTab === 'Positions' ? openPositions : bottomTab === 'Order History' ? closedPositions : []

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0d1117', fontFamily: 'Manrope' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar />
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>
          <h1 style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 34, letterSpacing: '-1px', color: '#e8f5e9', marginBottom: 28 }}>Portfolio</h1>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 18, marginBottom: 24 }}>
            <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 22 }}>
              <div style={{ fontSize: 11, color: '#4a6e5a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 18 }}>Perp</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4a6e5a', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>30 Day Volume</div>
              <div style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 34, color: '#e8f5e9', letterSpacing: '-1px', marginBottom: 18 }}>${totalVolume.toFixed(2)}</div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4a6e5a', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>Current Account Value</div>
              <div style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 26, color: '#e8f5e9', marginBottom: 18 }}>${walletData.protocolBalance.toFixed(2)}</div>
              <button onClick={() => wallet.connected ? setShowModal(true) : setVisible(true)}
                style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.14)', color: '#e8f5e9', fontFamily: 'Manrope', fontWeight: 600, fontSize: 13, borderRadius: 10, cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#00e676'; el.style.color = '#00e676' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.14)'; el.style.color = '#e8f5e9' }}
              >Deposit / Withdraw</button>
            </div>

            <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 18 }}>
                <TrendingUp size={13} color="#4a6e5a" />
                <span style={{ fontSize: 11, color: '#4a6e5a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>30d</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4a6e5a', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>Volume</div>
              <div style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 26, color: '#e8f5e9', marginBottom: 18 }}>${totalVolume.toFixed(2)}</div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4a6e5a', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>Trade PnL</div>
              <div style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 26, color: totalPnl >= 0 ? '#00e676' : '#ef5350', marginBottom: 8 }}>{totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}</div>
              <div style={{ fontSize: 11, color: '#4a6e5a', lineHeight: 1.6 }}>May exceed account losses due to leverage &amp; liquidation.</div>
            </div>

            <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 22 }}>
              <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 18, marginLeft: -4 }}>
                {['Account Value', 'PnL'].map(t => (
                  <div key={t} onClick={() => setChartTab(t)} style={{ padding: '6px 14px', fontSize: 13, cursor: 'pointer', color: t === chartTab ? '#e8f5e9' : '#4a6e5a', borderBottom: `2px solid ${t === chartTab ? '#00e676' : 'transparent'}`, marginBottom: -1 }}>{t}</div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 130, color: '#4a6e5a', gap: 8 }}>
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ opacity: 0.32 }}>
                  <polyline points="4,40 14,26 22,32 32,16 40,22" stroke="#4a6e5a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: 14 }}>No account value data</span>
              </div>
            </div>
          </div>

          {wallet.connected && (
            <div style={{ background: '#161b22', border: '1px solid rgba(0,230,118,0.1)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
              {[
                { label: 'Wallet Address', value: walletData.address ? `${walletData.address.slice(0,6)}...${walletData.address.slice(-6)}` : '—', color: '#1de9b6' },
                { label: 'Wallet USDC', value: `$${walletData.usdcBalance.toFixed(2)}`, color: '#e8f5e9' },
                { label: 'SOL Balance', value: `${walletData.solBalance.toFixed(4)} SOL`, color: '#e8f5e9' },
                { label: 'Protocol Balance', value: `$${walletData.protocolBalance.toFixed(2)}`, color: '#00e676' },
              ].map((item, i) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: i > 0 ? 28 : 0 }}>
                  {i > 0 && <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.06)', marginRight: 28 }} />}
                  <div>
                    <div style={{ fontSize: 10, color: '#4a6e5a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontFamily: item.label === 'Wallet Address' ? 'monospace' : 'Manrope', fontWeight: 700, fontSize: 14, color: item.color }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Open Orders', 'Positions', 'Order History'].map(t => (
                <div key={t} onClick={() => setBottomTab(t)} style={{ padding: '13px 18px', fontSize: 13, cursor: 'pointer', color: t === bottomTab ? '#e8f5e9' : '#4a6e5a', borderBottom: `2px solid ${t === bottomTab ? '#00e676' : 'transparent'}`, transition: 'all .15s' }}>
                  {t}{t === 'Positions' && openPositions.length > 0 ? ` (${openPositions.length})` : ''}
                </div>
              ))}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Market', 'Side', 'Collateral', 'Entry', 'Liq. Price', 'PnL', 'Leverage', 'Status'].map(h => (
                  <th key={h} style={{ fontSize: 11, color: '#4a6e5a', padding: '10px 18px', textAlign: 'left', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {shownPositions.map((pos, i) => {
                  const pnl = (pos.pnl?.toNumber() ?? 0) / LAMPORTS_PER_USDC
                  const col = (pos.collateral?.toNumber() ?? 0) / LAMPORTS_PER_USDC
                  const ep = (pos.entryPrice?.toNumber() ?? 0) / LAMPORTS_PER_USDC
                  const liq = (pos.liquidationPrice?.toNumber() ?? 0) / LAMPORTS_PER_USDC
                  return (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 18px', fontSize: 13, color: '#e8f5e9', fontWeight: 600 }}>{pos.market}</td>
                      <td style={{ padding: '10px 18px', fontSize: 13, color: pos.side === 0 ? '#00e676' : '#ef5350', fontWeight: 700 }}>{pos.side === 0 ? 'LONG' : 'SHORT'}</td>
                      <td style={{ padding: '10px 18px', fontSize: 13, color: '#81c784' }}>${col.toFixed(2)}</td>
                      <td style={{ padding: '10px 18px', fontSize: 13, color: '#e8f5e9' }}>${ep.toFixed(2)}</td>
                      <td style={{ padding: '10px 18px', fontSize: 13, color: '#ef5350' }}>${liq.toFixed(2)}</td>
                      <td style={{ padding: '10px 18px', fontSize: 13, color: pnl >= 0 ? '#00e676' : '#ef5350', fontWeight: 700 }}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</td>
                      <td style={{ padding: '10px 18px', fontSize: 13, color: '#81c784' }}>{pos.leverage}×</td>
                      <td style={{ padding: '10px 18px' }}>
                        <span style={{ background: pos.status === 0 ? 'rgba(0,200,83,0.12)' : 'rgba(255,255,255,0.06)', color: pos.status === 0 ? '#00e676' : '#81c784', padding: '2px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>
                          {pos.status === 0 ? 'Open' : 'Closed'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {shownPositions.length === 0 && (
                  <tr><td colSpan={8}><div style={{ padding: '50px 20px', textAlign: 'center', color: '#4a6e5a', fontSize: 14 }}>
                    {wallet.connected ? 'No positions yet.' : 'Connect your wallet to view your portfolio.'}
                  </div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: '#161b22', border: '1px solid rgba(0,230,118,0.2)', borderRadius: 18, padding: 28, width: 380, position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: 'none', color: '#4a6e5a', fontSize: 17, cursor: 'pointer' }}>✕</button>
            <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 6, color: '#e8f5e9' }}>Deposit / Withdraw</h3>
            <p style={{ fontSize: 13, color: '#4a6e5a', marginBottom: 20 }}>Wallet: <span style={{ color: '#e8f5e9' }}>${walletData.usdcBalance.toFixed(2)}</span> · Protocol: <span style={{ color: '#00e676' }}>${walletData.protocolBalance.toFixed(2)}</span></p>
            {[{ label: 'Deposit USDC', val: depositAmt, set: setDepositAmt, fn: handleDeposit, btnStyle: { background: '#0f9b5e', color: '#fff', border: 'none' }, btnLabel: 'Deposit' },
              { label: 'Withdraw USDC', val: withdrawAmt, set: setWithdrawAmt, fn: handleWithdraw, btnStyle: { background: '#3b1414', color: '#ef5350', border: '1px solid rgba(239,83,80,0.3)' }, btnLabel: 'Withdraw' }
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4a6e5a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{item.label}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" value={item.val} onChange={e => item.set(e.target.value)} placeholder="Amount"
                    style={{ flex: 1, background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 12px', color: '#e8f5e9', fontSize: 14, fontFamily: 'Manrope' }} />
                  <button onClick={item.fn} style={{ ...item.btnStyle as any, borderRadius: 8, fontFamily: 'Manrope', fontWeight: 700, fontSize: 13, padding: '9px 18px', cursor: 'pointer' }}>{item.btnLabel}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  )
}
