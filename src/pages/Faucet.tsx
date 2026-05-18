// import { useState, useEffect } from 'react'
// import { useWallet, useConnection } from '@solana/wallet-adapter-react'
// import { useWalletModal } from '@solana/wallet-adapter-react-ui'
// import { AnchorProvider } from '@coral-xyz/anchor'
// import Sidebar from '../components/Sidebar'
// import TopBar from '../components/TopBar'
// import Toast from '../components/Toast'
// import Logo from '../components/Logo'
// import { useWalletData } from '../hooks/useWalletData'
// import {
//   airdropSol,
//   depositUSDC,
//   depositSolAsUsdc,
//   withdrawUSDC,
//   withdrawAsSOL,
//   getProgram,
//   fetchPrices,
// } from '../lib/program'

// // ─── types ───────────────────────────────────────────────────────────────────
// type ToastState = { msg: string; type: 'success' | 'error' | 'loading' } | null
// type Token = 'SOL' | 'USDC'

// // ─── Step indicator ───────────────────────────────────────────────────────────
// function StepBar({ step }: { step: string }) {
//   if (!step) return null
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(29,233,182,0.06)', border: '1px solid rgba(29,233,182,0.18)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#1de9b6' }}>
//       <div style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid #1de9b6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
//       <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
//       {step}
//     </div>
//   )
// }

// // ─── Token toggle ─────────────────────────────────────────────────────────────
// function TokenToggle({ value, onChange }: { value: Token; onChange: (t: Token) => void }) {
//   return (
//     <div style={{ display: 'flex', gap: 3, background: '#0a0f14', borderRadius: 10, padding: 3, marginBottom: 14 }}>
//       {(['USDC', 'SOL'] as Token[]).map(t => (
//         <button key={t} onClick={() => onChange(t)} style={{
//           flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
//           fontFamily: 'Manrope', fontWeight: 700, fontSize: 13, cursor: 'pointer',
//           transition: 'all .15s',
//           background: value === t ? (t === 'USDC' ? '#162a4a' : '#1a1040') : 'transparent',
//           color: value === t ? (t === 'USDC' ? '#2775ca' : '#9945FF') : '#4a6e5a',
//         }}>
//           {t === 'USDC' ? '$ USDC' : '◎ SOL'}
//         </button>
//       ))}
//     </div>
//   )
// }

// // ─── Main component ───────────────────────────────────────────────────────────
// export default function Faucet() {
//   const wallet          = useWallet()
//   const { connection }  = useConnection()
//   const { setVisible }  = useWalletModal()
//   const { data, refreshAfterTx } = useWalletData()

//   const [solPrice, setSolPrice] = useState(150)
//   useEffect(() => { fetchPrices().then(p => setSolPrice(p.SOL)) }, [])

//   // ── Faucet state ──────────────────────────────────────────────────────────
//   const [airdropLoading, setAirdropLoading] = useState(false)
//   const [airdropToast,   setAirdropToast]   = useState<ToastState>(null)
//   const [airdropStep,    setAirdropStep]     = useState('')
//   const [airdropTxLink,  setAirdropTxLink]   = useState('')

//   // ── Deposit state ─────────────────────────────────────────────────────────
//   const [depToken,    setDepToken]    = useState<Token>('USDC')
//   const [depAmt,      setDepAmt]      = useState('')
//   const [depLoading,  setDepLoading]  = useState(false)
//   const [depStep,     setDepStep]     = useState('')
//   const [depToast,    setDepToast]    = useState<ToastState>(null)
//   const [depTxLink,   setDepTxLink]   = useState('')

//   // ── Withdraw state ────────────────────────────────────────────────────────
//   const [witToken,    setWitToken]    = useState<Token>('USDC')
//   const [witAmt,      setWitAmt]      = useState('')
//   const [witLoading,  setWitLoading]  = useState(false)
//   const [witStep,     setWitStep]     = useState('')
//   const [witToast,    setWitToast]    = useState<ToastState>(null)
//   const [witTxLink,   setWitTxLink]   = useState('')

//   // ── Estimated values ──────────────────────────────────────────────────────
//   const depEstUsdc = depToken === 'SOL' ? parseFloat(depAmt || '0') * solPrice : 0
//   const witEstSol  = witToken === 'SOL'  ? parseFloat(witAmt  || '0') / solPrice  : 0

//   // ── Airdrop SOL ───────────────────────────────────────────────────────────
//   const handleAirdrop = async () => {
//     if (!wallet.connected || !wallet.publicKey) { setVisible(true); return }
//     setAirdropLoading(true)
//     setAirdropStep('Requesting 1 SOL airdrop from Solana devnet...')
//     setAirdropToast({ msg: 'Requesting SOL airdrop...', type: 'loading' })
//     setAirdropTxLink('')
//     try {
//       const sig = await airdropSol(connection, wallet.publicKey, 1)
//       setAirdropTxLink('https://solscan.io/tx/' + sig + '?cluster=devnet')
//       setAirdropStep('')
//       setAirdropToast({ msg: '✓ 1 SOL airdropped to your wallet!', type: 'success' })
//       await refreshAfterTx(2500)
//     } catch (e: any) {
//       setAirdropStep('')
//       const msg = e?.message ?? 'Airdrop failed'
//       if (msg.includes('429') || msg.includes('rate')) {
//         setAirdropToast({ msg: '⏳ Rate limited. Visit https://faucet.solana.com for more SOL.', type: 'error' })
//       } else {
//         setAirdropToast({ msg: msg.slice(0, 160), type: 'error' })
//       }
//     } finally {
//       setAirdropLoading(false)
//     }
//   }

//   // ── Deposit ───────────────────────────────────────────────────────────────
//   const handleDeposit = async () => {
//     if (!wallet.connected || !wallet.publicKey) { setVisible(true); return }
//     const amt = parseFloat(depAmt)
//     if (!depAmt || isNaN(amt) || amt <= 0) {
//       setDepToast({ msg: 'Enter a valid amount', type: 'error' }); return
//     }

//     if (depToken === 'USDC') {
//       // Straight USDC deposit
//       if (data.usdcBalance < amt - 0.001) {
//         setDepToast({ msg: 'Insufficient wallet USDC. You have $' + data.usdcBalance.toFixed(2) + '. Use SOL deposit or get USDC first.', type: 'error' }); return
//       }
//       setDepLoading(true)
//       setDepToast({ msg: 'Depositing USDC...', type: 'loading' })
//       try {
//         const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' })
//         const program  = getProgram(provider)
//         const sig = await depositUSDC(program, wallet.publicKey, connection, amt)
//         setDepTxLink('https://solscan.io/tx/' + sig + '?cluster=devnet')
//         setDepToast({ msg: '✓ $' + amt.toFixed(2) + ' USDC deposited to protocol!', type: 'success' })
//         setDepAmt('')
//         await refreshAfterTx(2500)
//       } catch (e: any) {
//         setDepToast({ msg: e?.message?.slice(0, 200) ?? 'Deposit failed', type: 'error' })
//       } finally {
//         setDepLoading(false)
//       }
//     } else {
//       // SOL → swap to USDC → deposit
//       const needed = amt + 0.01
//       if (data.solBalance < needed) {
//         setDepToast({ msg: 'Insufficient SOL. You have ' + data.solBalance.toFixed(4) + ' SOL but need ' + needed.toFixed(4) + ' (incl. fees).', type: 'error' }); return
//       }
//       setDepLoading(true)
//       setDepToast({ msg: 'Swapping SOL → USDC and depositing...', type: 'loading' })
//       setDepStep('')
//       try {
//         const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' })
//         const program  = getProgram(provider)
//         const { swapSig, depositSig, usdcDeposited } = await depositSolAsUsdc(
//           program, connection, wallet, wallet.publicKey, amt, (step) => setDepStep(step)
//         )
//         setDepTxLink('https://solscan.io/tx/' + depositSig + '?cluster=devnet')
//         setDepStep('')
//         setDepToast({ msg: '✓ Swapped ' + amt + ' SOL → $' + usdcDeposited.toFixed(2) + ' USDC deposited to protocol!', type: 'success' })
//         setDepAmt('')
//         await refreshAfterTx(2500)
//       } catch (e: any) {
//         setDepStep('')
//         setDepToast({ msg: e?.message?.slice(0, 300) ?? 'Swap/deposit failed', type: 'error' })
//       } finally {
//         setDepLoading(false)
//       }
//     }
//   }

//   // ── Withdraw ──────────────────────────────────────────────────────────────
//   const handleWithdraw = async () => {
//     if (!wallet.connected || !wallet.publicKey) { setVisible(true); return }
//     const amt = parseFloat(witAmt)
//     if (!witAmt || isNaN(amt) || amt <= 0) {
//       setWitToast({ msg: 'Enter a valid amount', type: 'error' }); return
//     }
//     if (data.protocolBalance <= 0) {
//       setWitToast({ msg: 'No protocol balance to withdraw. Deposit first.', type: 'error' }); return
//     }
//     if (data.protocolBalance < amt - 0.001) {
//       setWitToast({ msg: 'Insufficient protocol balance. You have $' + data.protocolBalance.toFixed(2) + ' available.', type: 'error' }); return
//     }

//     setWitLoading(true)
//     setWitStep('')

//     if (witToken === 'USDC') {
//       setWitToast({ msg: 'Withdrawing USDC to wallet...', type: 'loading' })
//       try {
//         const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' })
//         const program  = getProgram(provider)
//         const sig = await withdrawUSDC(program, wallet.publicKey, connection, amt)
//         setWitTxLink('https://solscan.io/tx/' + sig + '?cluster=devnet')
//         setWitToast({ msg: '✓ $' + amt.toFixed(2) + ' USDC withdrawn to wallet!', type: 'success' })
//         setWitAmt('')
//         await refreshAfterTx(2500)
//       } catch (e: any) {
//         setWitToast({ msg: e?.message?.slice(0, 200) ?? 'Withdraw failed', type: 'error' })
//       } finally {
//         setWitLoading(false)
//       }
//     } else {
//       // Withdraw USDC then swap to SOL
//       setWitToast({ msg: 'Withdrawing and swapping to SOL...', type: 'loading' })
//       try {
//         const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' })
//         const program  = getProgram(provider)
//         const { swapSig, solReceived } = await withdrawAsSOL(
//           program, connection, wallet, wallet.publicKey, amt, (step) => setWitStep(step)
//         )
//         setWitTxLink('https://solscan.io/tx/' + swapSig + '?cluster=devnet')
//         setWitStep('')
//         setWitToast({ msg: '✓ Withdrawn $' + amt.toFixed(2) + ' USDC → ~' + solReceived.toFixed(4) + ' SOL to wallet!', type: 'success' })
//         setWitAmt('')
//         await refreshAfterTx(2500)
//       } catch (e: any) {
//         setWitStep('')
//         setWitToast({ msg: e?.message?.slice(0, 300) ?? 'Withdraw/swap failed', type: 'error' })
//       } finally {
//         setWitLoading(false)
//       }
//     }
//   }

//   // ── Max helpers ───────────────────────────────────────────────────────────
//   const depMax = () => {
//     if (depToken === 'USDC') setDepAmt(data.usdcBalance.toFixed(2))
//     else setDepAmt(Math.max(0, data.solBalance - 0.01).toFixed(4))
//   }
//   const witMax = () => setWitAmt(data.protocolBalance.toFixed(2))

//   return (
//     <div style={{ display: 'flex', height: '100vh', background: '#0d1117', fontFamily: 'Manrope', overflow: 'hidden' }}>
//       <Sidebar />
//       <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
//         <TopBar />

//         <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>

//           {/* Header */}
//           <div style={{ marginBottom: 24 }}>
//             <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
//               <Logo size={20} color="#1de9b6" />
//               <span style={{ fontSize: 11, fontWeight: 700, color: '#1de9b6', textTransform: 'uppercase', letterSpacing: '2px' }}>Solana Devnet · Real Tokens</span>
//             </div>
//             <h1 style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 30, letterSpacing: '-1px', color: '#e8f5e9', marginBottom: 4 }}>Get Tokens</h1>
//             <p style={{ fontSize: 14, color: '#4a6e5a' }}>Faucet · Deposit · Withdraw · SOL ⇄ USDC via Jupiter</p>
//           </div>

//           {/* Balance bar */}
//           <div style={{ background: '#161b22', border: '1px solid rgba(0,230,118,0.1)', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
//             {[
//               { icon: '◎', bg: '#9945FF', label: 'SOL Balance',     val: data.solBalance.toFixed(4) + ' SOL', color: '#e8f5e9' },
//               { icon: '$', bg: '#2775ca', label: 'Wallet USDC',     val: '$' + data.usdcBalance.toFixed(2),  color: '#e8f5e9' },
//               { icon: 'P', bg: '#0f9b5e', label: 'Protocol Balance', val: '$' + data.protocolBalance.toFixed(2), color: '#00e676' },
//             ].map((item, i) => (
//               <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, padding: '0 20px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
//                 <div style={{ width: 32, height: 32, borderRadius: 8, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{item.icon}</div>
//                 <div>
//                   <div style={{ fontSize: 11, color: '#4a6e5a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
//                   <div style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 18, color: item.color }}>{item.val}</div>
//                 </div>
//               </div>
//             ))}
//           </div>

//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, maxWidth: 1100 }}>

//             {/* ── FAUCET ── */}
//             <div style={{ background: '#161b22', border: '1px solid rgba(0,230,118,0.14)', borderRadius: 16, padding: 22, position: 'relative', overflow: 'hidden' }}>
//               <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, background: 'radial-gradient(circle,rgba(0,200,83,0.07) 0%,transparent 70%)', pointerEvents: 'none' }} />
//               <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
//                 <Logo size={18} color="#00e676" />
//                 <div style={{ fontWeight: 800, fontSize: 14, color: '#e8f5e9' }}>Get Free SOL</div>
//               </div>
//               <p style={{ fontSize: 12, color: '#4a6e5a', marginBottom: 18, lineHeight: 1.6 }}>
//                 Airdrop 1 devnet SOL directly to your wallet — no wallet signature required. Then swap SOL to USDC using the Deposit panel.
//               </p>

//               {/* What you get */}
//               <div style={{ background: '#0a0f14', borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
//                 <div style={{ fontSize: 11, fontWeight: 700, color: '#4a6e5a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>What you receive</div>
//                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                     <div style={{ width: 26, height: 26, borderRadius: 7, background: '#9945FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>◎</div>
//                     <div>
//                       <div style={{ fontSize: 12, fontWeight: 600, color: '#e8f5e9' }}>Devnet SOL</div>
//                       <div style={{ fontSize: 10, color: '#4a6e5a' }}>No wallet signing required</div>
//                     </div>
//                   </div>
//                   <span style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 16, color: '#9945FF' }}>1 SOL</span>
//                 </div>
//                 <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(0,200,83,0.06)', borderRadius: 7, fontSize: 11, color: '#81c784' }}>
//                   💡 After airdrop, use <strong>Deposit</strong> → Switch to <strong>SOL</strong> → swap SOL to USDC automatically via Jupiter
//                 </div>
//               </div>

//               <StepBar step={airdropStep} />

//               <button onClick={handleAirdrop} disabled={airdropLoading}
//                 style={{ width: '100%', padding: '12px', background: airdropLoading ? '#0a5c34' : '#9945FF', border: 'none', borderRadius: 10, fontFamily: 'Manrope', fontWeight: 800, fontSize: 13, color: airdropLoading ? '#4a6e5a' : '#fff', cursor: airdropLoading ? 'not-allowed' : 'pointer', transition: 'all .2s', marginBottom: 8 }}
//                 onMouseEnter={e => { if (!airdropLoading) (e.currentTarget as HTMLElement).style.background = '#7c3dcf' }}
//                 onMouseLeave={e => { if (!airdropLoading) (e.currentTarget as HTMLElement).style.background = '#9945FF' }}>
//                 {airdropLoading ? 'Airdropping...' : '◎ Airdrop 1 SOL to Wallet'}
//               </button>

//               {airdropTxLink && (
//                 <a href={airdropTxLink} target="_blank" rel="noopener" style={{ display: 'block', textAlign: 'center', fontSize: 11, color: '#1de9b6', textDecoration: 'none' }}>View tx ↗</a>
//               )}

//               {!wallet.connected && (
//                 <button onClick={() => setVisible(true)} style={{ width: '100%', marginTop: 8, padding: '10px', background: '#0f9b5e', border: 'none', borderRadius: 9, fontFamily: 'Manrope', fontWeight: 700, fontSize: 13, color: '#fff', cursor: 'pointer' }}>
//                   Connect Wallet First
//                 </button>
//               )}

//               {/* External faucets */}
//               <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
//                 <div style={{ fontSize: 11, fontWeight: 700, color: '#4a6e5a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>More Faucets</div>
//                 {[
//                   { label: 'faucet.solana.com', url: 'https://faucet.solana.com', desc: 'Up to 5 SOL/day' },
//                   { label: 'QuickNode Faucet', url: 'https://faucet.quicknode.com/solana/devnet', desc: 'Fast & reliable' },
//                 ].map(l => (
//                   <a key={l.url} href={l.url} target="_blank" rel="noopener"
//                     style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none' }}>
//                     <div>
//                       <div style={{ fontSize: 12, fontWeight: 600, color: '#e8f5e9' }}>{l.label}</div>
//                       <div style={{ fontSize: 10, color: '#4a6e5a' }}>{l.desc}</div>
//                     </div>
//                     <span style={{ color: '#1de9b6', fontSize: 12 }}>↗</span>
//                   </a>
//                 ))}
//               </div>
//             </div>

//             {/* ── DEPOSIT ── */}
//             <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 22 }}>
//               <div style={{ fontWeight: 800, fontSize: 14, color: '#e8f5e9', marginBottom: 4 }}>Deposit to Protocol</div>
//               <div style={{ fontSize: 12, color: '#4a6e5a', marginBottom: 14, lineHeight: 1.5 }}>
//                 Add funds to your trading balance. Deposit USDC directly or deposit SOL and we swap it to USDC automatically via Jupiter.
//               </div>

//               <TokenToggle value={depToken} onChange={setDepToken} />

//               {/* SOL → USDC info */}
//               {depToken === 'SOL' && (
//                 <div style={{ background: 'rgba(153,69,255,0.07)', border: '1px solid rgba(153,69,255,0.2)', borderRadius: 9, padding: '9px 12px', marginBottom: 12, fontSize: 12, color: '#c4a0ff', lineHeight: 1.5 }}>
//                   <strong>SOL → USDC via Jupiter</strong><br/>
//                   Your SOL will be swapped to USDC at the best market rate, then deposited to your protocol balance. Wallet shows a decodable Jupiter swap (not "unknown").
//                   {parseFloat(depAmt) > 0 && (
//                     <div style={{ marginTop: 6, color: '#00e676', fontWeight: 700 }}>
//                       ~{depAmt} SOL ≈ ${depEstUsdc.toFixed(2)} USDC at current price
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* USDC no balance */}
//               {depToken === 'USDC' && wallet.connected && data.usdcBalance === 0 && (
//                 <div style={{ background: 'rgba(255,215,64,0.07)', border: '1px solid rgba(255,215,64,0.18)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#ffd740' }}>
//                   ⚠ No wallet USDC. Switch to SOL deposit — we will swap it for you →
//                 </div>
//               )}

//               <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
//                 <div style={{ flex: 1, background: '#0a0f14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
//                   <input type="number" value={depAmt} onChange={e => setDepAmt(e.target.value)} placeholder="0.00"
//                     style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e8f5e9', fontSize: 15, fontFamily: 'Manrope' }} />
//                   <span style={{ fontSize: 12, fontWeight: 700, color: depToken === 'SOL' ? '#9945FF' : '#2775ca' }}>{depToken}</span>
//                 </div>
//                 <button onClick={depMax}
//                   style={{ background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,230,118,0.22)', color: '#00e676', fontFamily: 'Manrope', fontWeight: 700, fontSize: 12, padding: '0 12px', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}>
//                   MAX
//                 </button>
//               </div>

//               <div style={{ fontSize: 11, color: '#4a6e5a', marginBottom: 14 }}>
//                 Available: <span style={{ color: '#e8f5e9', fontWeight: 600 }}>
//                   {depToken === 'SOL' ? data.solBalance.toFixed(4) + ' SOL' : '$' + data.usdcBalance.toFixed(2) + ' USDC'}
//                 </span>
//               </div>

//               <StepBar step={depStep} />

//               <button onClick={handleDeposit} disabled={depLoading}
//                 style={{ width: '100%', padding: '12px', background: depLoading ? '#0a5c34' : '#0f9b5e', border: 'none', borderRadius: 10, fontFamily: 'Manrope', fontWeight: 700, fontSize: 14, color: depLoading ? '#4a6e5a' : '#fff', cursor: depLoading ? 'not-allowed' : 'pointer', transition: 'all .15s' }}
//                 onMouseEnter={e => { if (!depLoading) (e.currentTarget as HTMLElement).style.background = '#00c853' }}
//                 onMouseLeave={e => { if (!depLoading) (e.currentTarget as HTMLElement).style.background = '#0f9b5e' }}>
//                 {depLoading ? 'Processing...' : depToken === 'SOL' ? '◎ Swap SOL → USDC & Deposit' : '$ Deposit USDC to Protocol'}
//               </button>

//               {depTxLink && (
//                 <a href={depTxLink} target="_blank" rel="noopener" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 11, color: '#1de9b6', textDecoration: 'none' }}>View transaction ↗</a>
//               )}
//             </div>

//             {/* ── WITHDRAW ── */}
//             <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 22 }}>
//               <div style={{ fontWeight: 800, fontSize: 14, color: '#e8f5e9', marginBottom: 4 }}>Withdraw from Protocol</div>
//               <div style={{ fontSize: 12, color: '#4a6e5a', marginBottom: 14, lineHeight: 1.5 }}>
//                 Move your trading balance back to wallet. Withdraw as USDC directly or receive SOL via a Jupiter swap.
//               </div>

//               <TokenToggle value={witToken} onChange={setWitToken} />

//               {/* SOL withdraw info */}
//               {witToken === 'SOL' && (
//                 <div style={{ background: 'rgba(153,69,255,0.07)', border: '1px solid rgba(153,69,255,0.2)', borderRadius: 9, padding: '9px 12px', marginBottom: 12, fontSize: 12, color: '#c4a0ff', lineHeight: 1.5 }}>
//                   <strong>USDC → SOL via Jupiter</strong><br/>
//                   We withdraw USDC from protocol then swap to SOL at best rate.
//                   {parseFloat(witAmt) > 0 && (
//                     <div style={{ marginTop: 6, color: '#9945FF', fontWeight: 700 }}>
//                       ${witAmt} USDC ≈ {witEstSol.toFixed(4)} SOL at current price
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* No protocol balance */}
//               {wallet.connected && data.protocolBalance === 0 && (
//                 <div style={{ background: 'rgba(239,83,80,0.07)', border: '1px solid rgba(239,83,80,0.18)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#ef9090' }}>
//                   No protocol balance. Deposit funds first.
//                 </div>
//               )}

//               <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
//                 <div style={{ flex: 1, background: '#0a0f14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
//                   <input type="number" value={witAmt} onChange={e => setWitAmt(e.target.value)} placeholder="0.00"
//                     style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e8f5e9', fontSize: 15, fontFamily: 'Manrope' }} />
//                   <span style={{ fontSize: 12, fontWeight: 700, color: '#4a6e5a' }}>USDC</span>
//                 </div>
//                 <button onClick={witMax}
//                   style={{ background: 'rgba(239,83,80,0.08)', border: '1px solid rgba(239,83,80,0.25)', color: '#ef5350', fontFamily: 'Manrope', fontWeight: 700, fontSize: 12, padding: '0 12px', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}>
//                   MAX
//                 </button>
//               </div>

//               <div style={{ fontSize: 11, color: '#4a6e5a', marginBottom: 14 }}>
//                 Protocol balance: <span style={{ color: '#00e676', fontWeight: 600 }}>${data.protocolBalance.toFixed(2)} USDC</span>
//               </div>

//               <StepBar step={witStep} />

//               <button onClick={handleWithdraw} disabled={witLoading || data.protocolBalance === 0}
//                 style={{ width: '100%', padding: '12px', background: '#3b1414', border: '1px solid rgba(239,83,80,0.3)', borderRadius: 10, fontFamily: 'Manrope', fontWeight: 700, fontSize: 14, color: (witLoading || data.protocolBalance === 0) ? '#5a2020' : '#ef5350', cursor: (witLoading || data.protocolBalance === 0) ? 'not-allowed' : 'pointer', transition: 'all .15s' }}
//                 onMouseEnter={e => { if (!witLoading && data.protocolBalance > 0) (e.currentTarget as HTMLElement).style.background = '#5a1a1a' }}
//                 onMouseLeave={e => { if (!witLoading && data.protocolBalance > 0) (e.currentTarget as HTMLElement).style.background = '#3b1414' }}>
//                 {witLoading ? 'Processing...' : witToken === 'SOL' ? '◎ Withdraw → Swap to SOL' : '$ Withdraw USDC to Wallet'}
//               </button>

//               {witTxLink && (
//                 <a href={witTxLink} target="_blank" rel="noopener" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 11, color: '#1de9b6', textDecoration: 'none' }}>View transaction ↗</a>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {airdropToast && <Toast message={airdropToast.msg} type={airdropToast.type} onDone={() => setAirdropToast(null)} />}
//       {depToast     && <Toast message={depToast.msg}     type={depToast.type}     onDone={() => setDepToast(null)} />}
//       {witToast     && <Toast message={witToast.msg}     type={witToast.type}     onDone={() => setWitToast(null)} />}
//     </div>
//   )
// }

import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import Toast from '../components/Toast'
import Logo from '../components/Logo'
import { useWalletData } from '../hooks/useWalletData'
import {
  airdropSol,
  depositUSDC,
  depositSolAsUsdc,
  withdrawUSDC,
  withdrawAsSOL,
  fetchPrices,
} from '../lib/program'

// ─── types ───────────────────────────────────────────────────────────────────
type ToastState = { msg: string; type: 'success' | 'error' | 'loading' } | null
type Token = 'SOL' | 'USDC'

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ step }: { step: string }) {
  if (!step) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(29,233,182,0.06)', border: '1px solid rgba(29,233,182,0.18)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#1de9b6' }}>
      <div style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid #1de9b6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {step}
    </div>
  )
}

// ─── Token toggle ─────────────────────────────────────────────────────────────
function TokenToggle({ value, onChange }: { value: Token; onChange: (t: Token) => void }) {
  return (
    <div style={{ display: 'flex', gap: 3, background: '#0a0f14', borderRadius: 10, padding: 3, marginBottom: 14 }}>
      {(['USDC', 'SOL'] as Token[]).map(t => (
        <button key={t} onClick={() => onChange(t)} style={{
          flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
          fontFamily: 'Manrope', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          transition: 'all .15s',
          background: value === t ? (t === 'USDC' ? '#162a4a' : '#1a1040') : 'transparent',
          color: value === t ? (t === 'USDC' ? '#2775ca' : '#9945FF') : '#4a6e5a',
        }}>
          {t === 'USDC' ? '$ USDC' : '◎ SOL'}
        </button>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Faucet() {
  const wallet          = useWallet()
  const { connection }  = useConnection()
  const { setVisible }  = useWalletModal()
  const { data, refreshAfterTx } = useWalletData()

  const [solPrice, setSolPrice] = useState(150)
  useEffect(() => { fetchPrices().then(p => setSolPrice(p.SOL)) }, [])

  // ── Faucet state ──────────────────────────────────────────────────────────
  const [airdropLoading, setAirdropLoading] = useState(false)
  const [airdropToast,   setAirdropToast]   = useState<ToastState>(null)
  const [airdropStep,    setAirdropStep]     = useState('')
  const [airdropTxLink,  setAirdropTxLink]   = useState('')

  // ── Deposit state ─────────────────────────────────────────────────────────
  const [depToken,    setDepToken]    = useState<Token>('USDC')
  const [depAmt,      setDepAmt]      = useState('')
  const [depLoading,  setDepLoading]  = useState(false)
  const [depStep,     setDepStep]     = useState('')
  const [depToast,    setDepToast]    = useState<ToastState>(null)
  const [depTxLink,   setDepTxLink]   = useState('')

  // ── Withdraw state ────────────────────────────────────────────────────────
  const [witToken,    setWitToken]    = useState<Token>('USDC')
  const [witAmt,      setWitAmt]      = useState('')
  const [witLoading,  setWitLoading]  = useState(false)
  const [witStep,     setWitStep]     = useState('')
  const [witToast,    setWitToast]    = useState<ToastState>(null)
  const [witTxLink,   setWitTxLink]   = useState('')

  // ── Estimated values ──────────────────────────────────────────────────────
  const depEstUsdc = depToken === 'SOL' ? parseFloat(depAmt || '0') * solPrice : 0
  const witEstSol  = witToken === 'SOL'  ? parseFloat(witAmt  || '0') / solPrice  : 0

  // ── Airdrop SOL ───────────────────────────────────────────────────────────
  const handleAirdrop = async () => {
    if (!wallet.connected || !wallet.publicKey) { setVisible(true); return }
    setAirdropLoading(true)
    setAirdropStep('Requesting 1 SOL airdrop from Solana devnet...')
    setAirdropToast({ msg: 'Requesting SOL airdrop...', type: 'loading' })
    setAirdropTxLink('')
    try {
      const sig = await airdropSol(connection, wallet.publicKey, 1)
      setAirdropTxLink('https://solscan.io/tx/' + sig + '?cluster=devnet')
      setAirdropStep('')
      setAirdropToast({ msg: '✓ 1 SOL airdropped to your wallet!', type: 'success' })
      await refreshAfterTx(2500)
    } catch (e: any) {
      setAirdropStep('')
      const msg = e?.message ?? 'Airdrop failed'
      if (msg.includes('429') || msg.includes('rate')) {
        setAirdropToast({ msg: '⏳ Rate limited. Visit https://faucet.solana.com for more SOL.', type: 'error' })
      } else {
        setAirdropToast({ msg: msg.slice(0, 160), type: 'error' })
      }
    } finally {
      setAirdropLoading(false)
    }
  }

  // ── Deposit ───────────────────────────────────────────────────────────────
  const handleDeposit = async () => {
    if (!wallet.connected || !wallet.publicKey) { setVisible(true); return }
    const amt = parseFloat(depAmt)
    if (!depAmt || isNaN(amt) || amt <= 0) {
      setDepToast({ msg: 'Enter a valid amount', type: 'error' }); return
    }

    if (depToken === 'USDC') {
      if (data.usdcBalance < amt - 0.001) {
        setDepToast({ msg: 'Insufficient wallet USDC. You have $' + data.usdcBalance.toFixed(2) + '. Use SOL deposit or get USDC first.', type: 'error' }); return
      }
      setDepLoading(true)
      setDepToast({ msg: 'Depositing USDC...', type: 'loading' })
      try {
        // ✓ No AnchorProvider — wallet adapter passed directly
        const sig = await depositUSDC(connection, wallet as any, amt)
        setDepTxLink('https://solscan.io/tx/' + sig + '?cluster=devnet')
        setDepToast({ msg: '✓ $' + amt.toFixed(2) + ' USDC deposited to protocol!', type: 'success' })
        setDepAmt('')
        await refreshAfterTx(2500)
      } catch (e: any) {
        setDepToast({ msg: e?.message?.slice(0, 200) ?? 'Deposit failed', type: 'error' })
      } finally {
        setDepLoading(false)
      }
    } else {
      // SOL → swap to USDC → deposit
      const needed = amt + 0.01
      if (data.solBalance < needed) {
        setDepToast({ msg: 'Insufficient SOL. You have ' + data.solBalance.toFixed(4) + ' SOL but need ' + needed.toFixed(4) + ' (incl. fees).', type: 'error' }); return
      }
      setDepLoading(true)
      setDepToast({ msg: 'Swapping SOL → USDC and depositing...', type: 'loading' })
      setDepStep('')
      try {
        // ✓ No AnchorProvider — wallet adapter passed directly
        const { swapSig, depositSig, usdcDeposited } = await depositSolAsUsdc(
          connection, wallet as any, wallet.publicKey, amt, (step) => setDepStep(step)
        )
        setDepTxLink('https://solscan.io/tx/' + depositSig + '?cluster=devnet')
        setDepStep('')
        setDepToast({ msg: '✓ Swapped ' + amt + ' SOL → $' + usdcDeposited.toFixed(2) + ' USDC deposited to protocol!', type: 'success' })
        setDepAmt('')
        await refreshAfterTx(2500)
      } catch (e: any) {
        setDepStep('')
        setDepToast({ msg: e?.message?.slice(0, 300) ?? 'Swap/deposit failed', type: 'error' })
      } finally {
        setDepLoading(false)
      }
    }
  }

  // ── Withdraw ──────────────────────────────────────────────────────────────
  const handleWithdraw = async () => {
    if (!wallet.connected || !wallet.publicKey) { setVisible(true); return }
    const amt = parseFloat(witAmt)
    if (!witAmt || isNaN(amt) || amt <= 0) {
      setWitToast({ msg: 'Enter a valid amount', type: 'error' }); return
    }
    if (data.protocolBalance <= 0) {
      setWitToast({ msg: 'No protocol balance to withdraw. Deposit first.', type: 'error' }); return
    }
    if (data.protocolBalance < amt - 0.001) {
      setWitToast({ msg: 'Insufficient protocol balance. You have $' + data.protocolBalance.toFixed(2) + ' available.', type: 'error' }); return
    }

    setWitLoading(true)
    setWitStep('')

    if (witToken === 'USDC') {
      setWitToast({ msg: 'Withdrawing USDC to wallet...', type: 'loading' })
      try {
        // ✓ No AnchorProvider — wallet adapter passed directly
        const sig = await withdrawUSDC(connection, wallet as any, amt)
        setWitTxLink('https://solscan.io/tx/' + sig + '?cluster=devnet')
        setWitToast({ msg: '✓ $' + amt.toFixed(2) + ' USDC withdrawn to wallet!', type: 'success' })
        setWitAmt('')
        await refreshAfterTx(2500)
      } catch (e: any) {
        setWitToast({ msg: e?.message?.slice(0, 200) ?? 'Withdraw failed', type: 'error' })
      } finally {
        setWitLoading(false)
      }
    } else {
      setWitToast({ msg: 'Withdrawing and swapping to SOL...', type: 'loading' })
      try {
        // ✓ No AnchorProvider — wallet adapter passed directly
        const { swapSig, solReceived } = await withdrawAsSOL(
          connection, wallet as any, wallet.publicKey, amt, (step) => setWitStep(step)
        )
        setWitTxLink('https://solscan.io/tx/' + swapSig + '?cluster=devnet')
        setWitStep('')
        setWitToast({ msg: '✓ Withdrawn $' + amt.toFixed(2) + ' USDC → ~' + solReceived.toFixed(4) + ' SOL to wallet!', type: 'success' })
        setWitAmt('')
        await refreshAfterTx(2500)
      } catch (e: any) {
        setWitStep('')
        setWitToast({ msg: e?.message?.slice(0, 300) ?? 'Withdraw/swap failed', type: 'error' })
      } finally {
        setWitLoading(false)
      }
    }
  }

  // ── Max helpers ───────────────────────────────────────────────────────────
  const depMax = () => {
    if (depToken === 'USDC') setDepAmt(data.usdcBalance.toFixed(2))
    else setDepAmt(Math.max(0, data.solBalance - 0.01).toFixed(4))
  }
  const witMax = () => setWitAmt(data.protocolBalance.toFixed(2))

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0d1117', fontFamily: 'Manrope', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar />

        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Logo size={20} color="#1de9b6" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1de9b6', textTransform: 'uppercase', letterSpacing: '2px' }}>Solana Devnet · Real Tokens</span>
            </div>
            <h1 style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 30, letterSpacing: '-1px', color: '#e8f5e9', marginBottom: 4 }}>Get Tokens</h1>
            <p style={{ fontSize: 14, color: '#4a6e5a' }}>Faucet · Deposit · Withdraw · SOL ⇄ USDC via Jupiter</p>
          </div>

          {/* Balance bar */}
          <div style={{ background: '#161b22', border: '1px solid rgba(0,230,118,0.1)', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
            {[
              { icon: '◎', bg: '#9945FF', label: 'SOL Balance',      val: data.solBalance.toFixed(4) + ' SOL',   color: '#e8f5e9' },
              { icon: '$', bg: '#2775ca', label: 'Wallet USDC',       val: '$' + data.usdcBalance.toFixed(2),     color: '#e8f5e9' },
              { icon: 'P', bg: '#0f9b5e', label: 'Protocol Balance',  val: '$' + data.protocolBalance.toFixed(2), color: '#00e676' },
            ].map((item, i) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, padding: '0 20px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 11, color: '#4a6e5a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                  <div style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 18, color: item.color }}>{item.val}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, maxWidth: 1100 }}>

            {/* ── FAUCET ── */}
            <div style={{ background: '#161b22', border: '1px solid rgba(0,230,118,0.14)', borderRadius: 16, padding: 22, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, background: 'radial-gradient(circle,rgba(0,200,83,0.07) 0%,transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Logo size={18} color="#00e676" />
                <div style={{ fontWeight: 800, fontSize: 14, color: '#e8f5e9' }}>Get Free SOL</div>
              </div>
              <p style={{ fontSize: 12, color: '#4a6e5a', marginBottom: 18, lineHeight: 1.6 }}>
                Airdrop 1 devnet SOL directly to your wallet — no wallet signature required. Then swap SOL to USDC using the Deposit panel.
              </p>

              <div style={{ background: '#0a0f14', borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4a6e5a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>What you receive</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: '#9945FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>◎</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#e8f5e9' }}>Devnet SOL</div>
                      <div style={{ fontSize: 10, color: '#4a6e5a' }}>No wallet signing required</div>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: 16, color: '#9945FF' }}>1 SOL</span>
                </div>
                <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(0,200,83,0.06)', borderRadius: 7, fontSize: 11, color: '#81c784' }}>
                  💡 After airdrop, use <strong>Deposit</strong> → Switch to <strong>SOL</strong> → swap SOL to USDC automatically via Jupiter
                </div>
              </div>

              <StepBar step={airdropStep} />

              <button onClick={handleAirdrop} disabled={airdropLoading}
                style={{ width: '100%', padding: '12px', background: airdropLoading ? '#0a5c34' : '#9945FF', border: 'none', borderRadius: 10, fontFamily: 'Manrope', fontWeight: 800, fontSize: 13, color: airdropLoading ? '#4a6e5a' : '#fff', cursor: airdropLoading ? 'not-allowed' : 'pointer', transition: 'all .2s', marginBottom: 8 }}
                onMouseEnter={e => { if (!airdropLoading) (e.currentTarget as HTMLElement).style.background = '#7c3dcf' }}
                onMouseLeave={e => { if (!airdropLoading) (e.currentTarget as HTMLElement).style.background = '#9945FF' }}>
                {airdropLoading ? 'Airdropping...' : '◎ Airdrop 1 SOL to Wallet'}
              </button>

              {airdropTxLink && (
                <a href={airdropTxLink} target="_blank" rel="noopener" style={{ display: 'block', textAlign: 'center', fontSize: 11, color: '#1de9b6', textDecoration: 'none' }}>View tx ↗</a>
              )}

              {!wallet.connected && (
                <button onClick={() => setVisible(true)} style={{ width: '100%', marginTop: 8, padding: '10px', background: '#0f9b5e', border: 'none', borderRadius: 9, fontFamily: 'Manrope', fontWeight: 700, fontSize: 13, color: '#fff', cursor: 'pointer' }}>
                  Connect Wallet First
                </button>
              )}

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4a6e5a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>More Faucets</div>
                {[
                  { label: 'faucet.solana.com', url: 'https://faucet.solana.com', desc: 'Up to 5 SOL/day' },
                  { label: 'QuickNode Faucet', url: 'https://faucet.quicknode.com/solana/devnet', desc: 'Fast & reliable' },
                ].map(l => (
                  <a key={l.url} href={l.url} target="_blank" rel="noopener"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#e8f5e9' }}>{l.label}</div>
                      <div style={{ fontSize: 10, color: '#4a6e5a' }}>{l.desc}</div>
                    </div>
                    <span style={{ color: '#1de9b6', fontSize: 12 }}>↗</span>
                  </a>
                ))}
              </div>
            </div>

            {/* ── DEPOSIT ── */}
            <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 22 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#e8f5e9', marginBottom: 4 }}>Deposit to Protocol</div>
              <div style={{ fontSize: 12, color: '#4a6e5a', marginBottom: 14, lineHeight: 1.5 }}>
                Add funds to your trading balance. Deposit USDC directly or deposit SOL and we swap it to USDC automatically via Jupiter.
              </div>

              <TokenToggle value={depToken} onChange={setDepToken} />

              {depToken === 'SOL' && (
                <div style={{ background: 'rgba(153,69,255,0.07)', border: '1px solid rgba(153,69,255,0.2)', borderRadius: 9, padding: '9px 12px', marginBottom: 12, fontSize: 12, color: '#c4a0ff', lineHeight: 1.5 }}>
                  <strong>SOL → USDC via Jupiter</strong><br />
                  Your SOL will be swapped to USDC at the best market rate, then deposited to your protocol balance.
                  {parseFloat(depAmt) > 0 && (
                    <div style={{ marginTop: 6, color: '#00e676', fontWeight: 700 }}>
                      ~{depAmt} SOL ≈ ${depEstUsdc.toFixed(2)} USDC at current price
                    </div>
                  )}
                </div>
              )}

              {depToken === 'USDC' && wallet.connected && data.usdcBalance === 0 && (
                <div style={{ background: 'rgba(255,215,64,0.07)', border: '1px solid rgba(255,215,64,0.18)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#ffd740' }}>
                  ⚠ No wallet USDC. Switch to SOL deposit — we will swap it for you →
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, background: '#0a0f14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" value={depAmt} onChange={e => setDepAmt(e.target.value)} placeholder="0.00"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e8f5e9', fontSize: 15, fontFamily: 'Manrope' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: depToken === 'SOL' ? '#9945FF' : '#2775ca' }}>{depToken}</span>
                </div>
                <button onClick={depMax}
                  style={{ background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,230,118,0.22)', color: '#00e676', fontFamily: 'Manrope', fontWeight: 700, fontSize: 12, padding: '0 12px', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  MAX
                </button>
              </div>

              <div style={{ fontSize: 11, color: '#4a6e5a', marginBottom: 14 }}>
                Available: <span style={{ color: '#e8f5e9', fontWeight: 600 }}>
                  {depToken === 'SOL' ? data.solBalance.toFixed(4) + ' SOL' : '$' + data.usdcBalance.toFixed(2) + ' USDC'}
                </span>
              </div>

              <StepBar step={depStep} />

              <button onClick={handleDeposit} disabled={depLoading}
                style={{ width: '100%', padding: '12px', background: depLoading ? '#0a5c34' : '#0f9b5e', border: 'none', borderRadius: 10, fontFamily: 'Manrope', fontWeight: 700, fontSize: 14, color: depLoading ? '#4a6e5a' : '#fff', cursor: depLoading ? 'not-allowed' : 'pointer', transition: 'all .15s' }}
                onMouseEnter={e => { if (!depLoading) (e.currentTarget as HTMLElement).style.background = '#00c853' }}
                onMouseLeave={e => { if (!depLoading) (e.currentTarget as HTMLElement).style.background = '#0f9b5e' }}>
                {depLoading ? 'Processing...' : depToken === 'SOL' ? '◎ Swap SOL → USDC & Deposit' : '$ Deposit USDC to Protocol'}
              </button>

              {depTxLink && (
                <a href={depTxLink} target="_blank" rel="noopener" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 11, color: '#1de9b6', textDecoration: 'none' }}>View transaction ↗</a>
              )}
            </div>

            {/* ── WITHDRAW ── */}
            <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 22 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#e8f5e9', marginBottom: 4 }}>Withdraw from Protocol</div>
              <div style={{ fontSize: 12, color: '#4a6e5a', marginBottom: 14, lineHeight: 1.5 }}>
                Move your trading balance back to wallet. Withdraw as USDC directly or receive SOL via a Jupiter swap.
              </div>

              <TokenToggle value={witToken} onChange={setWitToken} />

              {witToken === 'SOL' && (
                <div style={{ background: 'rgba(153,69,255,0.07)', border: '1px solid rgba(153,69,255,0.2)', borderRadius: 9, padding: '9px 12px', marginBottom: 12, fontSize: 12, color: '#c4a0ff', lineHeight: 1.5 }}>
                  <strong>USDC → SOL via Jupiter</strong><br />
                  We withdraw USDC from protocol then swap to SOL at best rate.
                  {parseFloat(witAmt) > 0 && (
                    <div style={{ marginTop: 6, color: '#9945FF', fontWeight: 700 }}>
                      ${witAmt} USDC ≈ {witEstSol.toFixed(4)} SOL at current price
                    </div>
                  )}
                </div>
              )}

              {wallet.connected && data.protocolBalance === 0 && (
                <div style={{ background: 'rgba(239,83,80,0.07)', border: '1px solid rgba(239,83,80,0.18)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#ef9090' }}>
                  No protocol balance. Deposit funds first.
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, background: '#0a0f14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" value={witAmt} onChange={e => setWitAmt(e.target.value)} placeholder="0.00"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e8f5e9', fontSize: 15, fontFamily: 'Manrope' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#4a6e5a' }}>USDC</span>
                </div>
                <button onClick={witMax}
                  style={{ background: 'rgba(239,83,80,0.08)', border: '1px solid rgba(239,83,80,0.25)', color: '#ef5350', fontFamily: 'Manrope', fontWeight: 700, fontSize: 12, padding: '0 12px', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  MAX
                </button>
              </div>

              <div style={{ fontSize: 11, color: '#4a6e5a', marginBottom: 14 }}>
                Protocol balance: <span style={{ color: '#00e676', fontWeight: 600 }}>${data.protocolBalance.toFixed(2)} USDC</span>
              </div>

              <StepBar step={witStep} />

              <button onClick={handleWithdraw} disabled={witLoading || data.protocolBalance === 0}
                style={{ width: '100%', padding: '12px', background: '#3b1414', border: '1px solid rgba(239,83,80,0.3)', borderRadius: 10, fontFamily: 'Manrope', fontWeight: 700, fontSize: 14, color: (witLoading || data.protocolBalance === 0) ? '#5a2020' : '#ef5350', cursor: (witLoading || data.protocolBalance === 0) ? 'not-allowed' : 'pointer', transition: 'all .15s' }}
                onMouseEnter={e => { if (!witLoading && data.protocolBalance > 0) (e.currentTarget as HTMLElement).style.background = '#5a1a1a' }}
                onMouseLeave={e => { if (!witLoading && data.protocolBalance > 0) (e.currentTarget as HTMLElement).style.background = '#3b1414' }}>
                {witLoading ? 'Processing...' : witToken === 'SOL' ? '◎ Withdraw → Swap to SOL' : '$ Withdraw USDC to Wallet'}
              </button>

              {witTxLink && (
                <a href={witTxLink} target="_blank" rel="noopener" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 11, color: '#1de9b6', textDecoration: 'none' }}>View transaction ↗</a>
              )}
            </div>
          </div>
        </div>
      </div>

      {airdropToast && <Toast message={airdropToast.msg} type={airdropToast.type} onDone={() => setAirdropToast(null)} />}
      {depToast     && <Toast message={depToast.msg}     type={depToast.type}     onDone={() => setDepToast(null)} />}
      {witToast     && <Toast message={witToast.msg}     type={witToast.type}     onDone={() => setWitToast(null)} />}
    </div>
  )
}
