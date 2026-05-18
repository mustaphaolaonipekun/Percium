import { useState, useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useConnection } from '@solana/wallet-adapter-react'
import { AnchorProvider } from '@coral-xyz/anchor'
import { BN } from '@coral-xyz/anchor'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import Toast from '../components/Toast'
import { useWalletData } from '../hooks/useWalletData'
import { useOrderBook } from '../hooks/useOrderBook'
import { getProgram, getUserAccountPDA, getPositionPDA, fetchPrices, LAMPORTS_PER_USDC, toBN, usdcToBN, openPosition as openPositionOnChain, closePosition as closePositionOnChain, ensureUserAccount, readProtocolBalance } from '../lib/program'
import { PublicKey } from '@solana/web3.js'

const MARKETS = [
  { label: 'SOL/USDC', key: 'SOL' },
  { label: 'ETH/USDC', key: 'ETH' },
  { label: 'BTC/USDC', key: 'BTC' },
]

interface Candle { time: number; open: number; high: number; low: number; close: number }

function genCandles(base: number): Candle[] {
  const out: Candle[] = []
  let p = base
  const now = Math.floor(Date.now() / 1000)
  for (let i = 240; i >= 0; i--) {
    const t = now - i * 900
    const o = p, c = (Math.random() - 0.48) * base * 0.006
    const h = o + Math.abs(c) + Math.random() * base * 0.003
    const l = o - Math.abs(c) - Math.random() * base * 0.003
    const cl = o + c
    p = cl
    out.push({ time: t, open: +o.toFixed(2), high: +h.toFixed(2), low: +l.toFixed(2), close: +cl.toFixed(2) })
  }
  return out
}

export default function Dex() {
  const wallet = useWallet()
  const { connection } = useConnection()
  const { setVisible } = useWalletModal()
  const { data: walletData, refresh: refreshWallet, refreshAfterTx } = useWalletData()

  const [market, setMarket] = useState('SOL/USDC')
  const [prices, setPrices] = useState({ SOL: 150, ETH: 2300, BTC: 65000 })
  const [displayPrice, setDisplayPrice] = useState(150)
  const [side, setSide] = useState<'buy'|'sell'>('buy')
  const [activeTab, setActiveTab] = useState<'swap'|'limit'>('swap')
  const [leverage, setLeverage] = useState(5)
  const [collateral, setCollateral] = useState('')
  const [slippage, setSlippage] = useState('1%')
  const [timeframe, setTimeframe] = useState('15m')
  const [bottomTab, setBottomTab] = useState('Positions')
  const [obTab, setObTab] = useState('Order Book')
  const [positions, setPositions] = useState<any[]>([])
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'|'loading'}|null>(null)
  const [txLink, setTxLink] = useState('')

  const chartRef = useRef<HTMLDivElement>(null)
  const seriesRef = useRef<any>(null)
  const candlesRef = useRef<Candle[]>([])
  const chartCreatedRef = useRef(false)

  const book = useOrderBook(displayPrice)

  // Load prices
  useEffect(() => {
    fetchPrices().then(p => { setPrices(p); setDisplayPrice(p.SOL) })
    const t = setInterval(() => fetchPrices().then(p => setPrices(p)), 15000)
    return () => clearInterval(t)
  }, [])

  // Update display price when market changes
  useEffect(() => {
    const key = MARKETS.find(m => m.label === market)?.key as keyof typeof prices
    const p = prices[key] || 150
    setDisplayPrice(p)
    candlesRef.current = genCandles(p)
    chartCreatedRef.current = false
  }, [market])

  useEffect(() => {
    const key = MARKETS.find(m => m.label === market)?.key as keyof typeof prices
    setDisplayPrice(prices[key] || 150)
  }, [prices])

  // Init chart
  useEffect(() => {
    if (!chartRef.current || chartCreatedRef.current) return
    let chart: any = null
    chartCreatedRef.current = true

    const init = async () => {
      try {
        const LW = await import('lightweight-charts')
        if (!chartRef.current) return
        chart = LW.createChart(chartRef.current, {
          width: chartRef.current.offsetWidth || 600,
          height: chartRef.current.offsetHeight || 400,
          layout: { background: { color: '#0d1117' }, textColor: '#4a6e5a' },
          grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
          crosshair: { mode: 1 },
          rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
          timeScale: { borderColor: 'rgba(255,255,255,0.06)', timeVisible: true, secondsVisible: false },
        })
        const series = chart.addCandlestickSeries({
          upColor: '#00c853', downColor: '#ef5350',
          borderUpColor: '#00c853', borderDownColor: '#ef5350',
          wickUpColor: '#00c853', wickDownColor: '#ef5350',
        })
        if (!candlesRef.current.length) candlesRef.current = genCandles(displayPrice)
        series.setData(candlesRef.current)
        chart.timeScale().fitContent()
        seriesRef.current = series

        const ro = new ResizeObserver(() => {
          if (chartRef.current && chart) {
            chart.resize(chartRef.current.offsetWidth, chartRef.current.offsetHeight)
          }
        })
        ro.observe(chartRef.current)
      } catch (e) { console.warn('chart init:', e) }
    }
    init()
    return () => { if (chart) { try { chart.remove() } catch {} }; chartCreatedRef.current = false }
  }, [market])

  // Live tick
  useEffect(() => {
    const t = setInterval(() => {
      if (!seriesRef.current || !candlesRef.current.length) return
      const last = candlesRef.current[candlesRef.current.length - 1]
      const delta = (Math.random() - 0.492) * displayPrice * 0.002
      const nc = +(last.close + delta).toFixed(2)
      const updated = { ...last, close: nc, high: Math.max(last.high, nc), low: Math.min(last.low, nc) }
      candlesRef.current[candlesRef.current.length - 1] = updated
      try { seriesRef.current.update(updated) } catch {}
      setDisplayPrice(nc)
    }, 1500)
    return () => clearInterval(t)
  }, [market, displayPrice > 0])

  // Fetch positions
  const loadPositions = async () => {
    if (!wallet.publicKey) return
    try {
      const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' })
      const program = getProgram(provider)
      const [userPda] = getUserAccountPDA(wallet.publicKey)
      const info = await connection.getAccountInfo(userPda)
      if (!info) return
      const userAcc = await (program.account as any).userAccount.fetch(userPda)
      const total = userAcc.totalPositions.toNumber()
      const all: any[] = []
      for (let i = 0; i < total; i++) {
        try {
          const [pda] = getPositionPDA(wallet.publicKey, new BN(String(i)))
          const pos = await (program.account as any).positionAccount.fetch(pda)
          all.push({ ...pos, pda, index: i })
        } catch {}
      }
      setPositions(all)
    } catch (e) { console.warn('loadPositions:', e) }
  }

  useEffect(() => { if (wallet.connected) loadPositions() }, [wallet.connected, wallet.publicKey])

  const showToast = (msg: string, type: 'success'|'error'|'loading') => {
    setToast({ msg, type })
    if (type !== 'loading') setTimeout(() => setToast(null), 4500)
  }

  const handleTrade = async () => {
    if (!wallet.connected) { setVisible(true); return }
    if (!collateral || parseFloat(collateral) <= 0) { showToast('Enter collateral amount', 'error'); return }
    const col = parseFloat(collateral)
    if (col > walletData.protocolBalance && walletData.protocolBalance > 0) {
      showToast('Exceeds protocol balance. Deposit more USDC first.', 'error'); return
    }

    showToast('Submitting to Solana...', 'loading')
    try {
      const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' })
      const program = getProgram(provider)
      const pk = wallet.publicKey!

      // Ensure user account exists
      await ensureUserAccount(program, pk, connection)

      // Get current position index from on-chain account
      const [userPda] = getUserAccountPDA(pk)
      const userAcc = await (program.account as any).userAccount.fetch(userPda)
      const posIndex = new BN(userAcc.totalPositions.toString())

      const mktSide: 0|1 = side === 'buy' ? 0 : 1

      // Use new openPosition which validates balance and uses safe BN
      const { txSig } = await openPositionOnChain(
        program, pk, connection,
        market, mktSide, leverage, col, displayPrice, posIndex
      )

      setTxLink(`https://solscan.io/tx/${txSig}?cluster=devnet`)
      showToast('✓ Position opened — encrypted via Arcium MXE', 'success')
      setCollateral('')
      await loadPositions()
      await refreshAfterTx(2500)
    } catch (e: any) {
      const msg = e?.message?.includes('Insufficient')
        ? e.message
        : e?.message?.includes('0x1')
          ? 'Not enough SOL for fees. Get SOL from the faucet.'
          : e?.message?.slice(0, 160) ?? 'Transaction failed'
      showToast(msg, 'error')
    }
  }

  const handleClose = async (pos: any) => {
    if (!wallet.connected) { setVisible(true); return }
    showToast('Closing position...', 'loading')
    try {
      const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' })
      const program = getProgram(provider)
      const pk = wallet.publicKey!
      const txSig = await closePositionOnChain(program, pk, pos.pda, displayPrice)
      setTxLink(`https://solscan.io/tx/${txSig}?cluster=devnet`)
      showToast('✓ Position closed. PnL settled on-chain.', 'success')
      await loadPositions()
      await refreshAfterTx(2500)
    } catch (e: any) {
      showToast(e?.message?.slice(0, 160) ?? 'Close failed', 'error')
    }
  }

  const openPositions = positions.filter(p => p.status === 0)
  const closedPositions = positions.filter(p => p.status === 1)
  const shownPositions = bottomTab === 'Positions' ? openPositions : bottomTab === 'Order History' ? closedPositions : []

  const estSize = (parseFloat(collateral||'0') * leverage).toFixed(2)
  const estLiq = side==='buy'
    ? (displayPrice * (1 - 1/leverage * 0.9)).toFixed(2)
    : (displayPrice * (1 + 1/leverage * 0.9)).toFixed(2)

  return (
    <div style={{ display:'flex', height:'100vh', background:'#0d1117', fontFamily:'Manrope', overflow:'hidden' }}>
      <Sidebar />
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* TOP BAR */}
        <TopBar>
          {/* Market selector */}
          <div style={{ position:'relative', marginRight:14 }}>
            <select value={market} onChange={e => setMarket(e.target.value)}
              style={{ background:'#1c2430', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'6px 28px 6px 12px', color:'#e8f5e9', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Manrope', appearance:'none', WebkitAppearance:'none' }}>
              {MARKETS.map(m => <option key={m.label} value={m.label}>{m.label}</option>)}
            </select>
            <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:'#4a6e5a', fontSize:10, pointerEvents:'none' }}>▾</span>
          </div>
          {[
            { label:'Price', value:`${displayPrice.toFixed(2)} USDC`, up:true },
            { label:'24h Change', value:'+0.19%', up:true },
            { label:'24h Volume', value:'$0.00' },
            { label:'24h High', value:`$${(displayPrice*1.004).toFixed(2)}` },
            { label:'24h Low', value:`$${(displayPrice*0.996).toFixed(2)}` },
          ].map(s => (
            <div key={s.label} style={{ display:'flex', flexDirection:'column', padding:'0 13px', borderLeft:'1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize:10, color:'#4a6e5a', textTransform:'uppercase', letterSpacing:'0.5px' }}>{s.label}</span>
              <span style={{ fontSize:13, fontWeight:600, color:s.up!==undefined?'#00c853':'#e8f5e9' }}>{s.value}</span>
            </div>
          ))}
        </TopBar>

        {/* BODY */}
        <div style={{ flex:1, display:'flex', minHeight:0 }}>

          {/* CHART */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', borderRight:'1px solid rgba(255,255,255,0.06)', minWidth:0 }}>
            {/* Toolbar */}
            <div style={{ height:42, flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', padding:'0 12px', gap:4 }}>
              {['1m','5m','15m','1h','4h','1d'].map(t => (
                <button key={t} onClick={() => setTimeframe(t)} style={{ padding:'4px 9px', borderRadius:6, fontSize:12, cursor:'pointer', background:t===timeframe?'#1c2430':'transparent', border:'none', color:t===timeframe?'#e8f5e9':'#4a6e5a', fontFamily:'Manrope', transition:'all .15s' }}>{t}</button>
              ))}
              <div style={{ marginLeft:'auto', fontSize:11, color:'#4a6e5a' }}>
                <span style={{ color:'#7c4dff' }}>⬟</span> Powered by <a href="https://www.tradingview.com" target="_blank" rel="noopener" style={{ color:'#1de9b6' }}>TradingView</a>
              </div>
            </div>
            <div ref={chartRef} style={{ flex:1, minHeight:0 }} />
          </div>

          {/* ORDER BOOK */}
          <div style={{ width:260, flexShrink:0, display:'flex', flexDirection:'column', borderRight:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
              {['Order Book','Trades'].map(t => (
                <div key={t} onClick={() => setObTab(t)} style={{ flex:1, padding:'11px 0', textAlign:'center', fontSize:13, cursor:'pointer', color:t===obTab?'#e8f5e9':'#4a6e5a', borderBottom:`2px solid ${t===obTab?'#00e676':'transparent'}`, transition:'all .15s' }}>{t}</div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', padding:'6px 12px', fontSize:10, color:'#4a6e5a', textTransform:'uppercase', letterSpacing:'0.5px', flexShrink:0 }}>
              <span>Price</span><span style={{ textAlign:'right' }}>Size</span><span style={{ textAlign:'right' }}>Total</span>
            </div>
            <div style={{ flex:1, overflowY:'auto', minHeight:0 }}>
              {[...book.asks].reverse().map((row,i) => (
                <div key={i} style={{ position:'relative', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', padding:'2px 12px', cursor:'pointer' }}>
                  <div style={{ position:'absolute', right:0, top:0, bottom:0, background:'#ef5350', opacity:0.07, width:`${Math.min(80,(row.total/(book.asks[0]?.total||1))*80)}%` }} />
                  <span style={{ fontSize:11, color:'#ef5350', zIndex:1 }}>{row.price.toFixed(2)}</span>
                  <span style={{ fontSize:11, color:'#81c784', textAlign:'right', zIndex:1 }}>{row.size.toFixed(3)}</span>
                  <span style={{ fontSize:11, color:'#4a6e5a', textAlign:'right', zIndex:1 }}>{row.total.toFixed(0)}</span>
                </div>
              ))}
              <div style={{ padding:'6px 12px', background:'#1c2430', fontSize:12, textAlign:'center', color:'#81c784', flexShrink:0 }}>
                Mid: {displayPrice.toFixed(2)} · Spread: {book.spread.toFixed(3)}
              </div>
              {book.bids.map((row,i) => (
                <div key={i} style={{ position:'relative', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', padding:'2px 12px', cursor:'pointer' }}>
                  <div style={{ position:'absolute', right:0, top:0, bottom:0, background:'#00c853', opacity:0.07, width:`${Math.min(80,(row.total/(book.bids[0]?.total||1))*80)}%` }} />
                  <span style={{ fontSize:11, color:'#00c853', zIndex:1 }}>{row.price.toFixed(2)}</span>
                  <span style={{ fontSize:11, color:'#81c784', textAlign:'right', zIndex:1 }}>{row.size.toFixed(3)}</span>
                  <span style={{ fontSize:11, color:'#4a6e5a', textAlign:'right', zIndex:1 }}>{row.total.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TRADE PANEL */}
          <div style={{ width:288, flexShrink:0, display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
              {(['swap','limit'] as const).map(t => (
                <div key={t} onClick={() => setActiveTab(t)} style={{ flex:1, padding:'13px 0', textAlign:'center', fontSize:14, fontWeight:600, cursor:'pointer', color:t===activeTab?'#fff':'#4a6e5a', borderBottom:`2px solid ${t===activeTab?'#00e676':'transparent'}`, transition:'all .15s', textTransform:'capitalize' }}>
                  {t==='swap'?'Swap':'Limit'}
                </div>
              ))}
            </div>
            <div style={{ flex:1, padding:15, overflowY:'auto' }}>
              {/* Buy/Sell */}
              <div style={{ display:'flex', gap:3, background:'#0a0f14', borderRadius:10, padding:3, marginBottom:14 }}>
                {(['buy','sell'] as const).map(s => (
                  <button key={s} onClick={() => setSide(s)} style={{ flex:1, padding:'9px 0', borderRadius:8, border:'none', fontFamily:'Manrope', fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .15s', background:side===s?(s==='buy'?'#0d3b26':'#3b1414'):'transparent', color:side===s?(s==='buy'?'#00e676':'#ef5350'):'#4a6e5a' }}>
                    {s==='buy'?'Buy / Long':'Sell / Short'}
                  </button>
                ))}
              </div>

              {/* Collateral */}
              <div style={{ fontSize:11, fontWeight:600, color:'#4a6e5a', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6, display:'flex', justifyContent:'space-between' }}>
                <span>Collateral (USDC)</span>
                <span style={{ color:'#00e676', cursor:'pointer', fontWeight:700 }} onClick={() => setCollateral(walletData.protocolBalance.toFixed(2))}>MAX</span>
              </div>
              <div style={{ background:'#0a0f14', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'10px 13px', display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <input type="number" value={collateral} onChange={e => setCollateral(e.target.value)} placeholder="0.00"
                  style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#e8f5e9', fontSize:15, fontFamily:'Manrope' }}
                />
                <span style={{ fontSize:12, fontWeight:600, color:'#4a6e5a' }}>USDC</span>
              </div>
              <div style={{ fontSize:11, color:'#4a6e5a', marginBottom:12 }}>
                Protocol: <span style={{ color:'#00e676' }}>${walletData.protocolBalance.toFixed(2)}</span>
              </div>

              {/* Leverage */}
              <div style={{ fontSize:11, fontWeight:600, color:'#4a6e5a', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6, display:'flex', justifyContent:'space-between' }}>
                <span>Leverage</span><span style={{ color:'#e8f5e9', fontWeight:700 }}>{leverage}×</span>
              </div>
              <input type="range" min={1} max={20} value={leverage} onChange={e => setLeverage(+e.target.value)} style={{ marginBottom:4 }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#4a6e5a', marginBottom:14 }}>
                {['1×','5×','10×','15×','20×'].map(l => <span key={l}>{l}</span>)}
              </div>

              {/* Trade info */}
              {parseFloat(collateral||'0') > 0 && (
                <div style={{ background:'#0a0f14', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 13px', marginBottom:14, fontSize:12, color:'#4a6e5a' }}>
                  {[['Entry Price',`$${displayPrice.toFixed(2)}`],['Position Size',`$${estSize}`],['Liq. Price (est.)',`$${estLiq}`]].map(([l,v]) => (
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span>{l}</span>
                      <span style={{ color: l.includes('Liq') ? '#ef5350' : '#e8f5e9' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Slippage */}
              <div style={{ fontSize:11, fontWeight:600, color:'#4a6e5a', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Max Slippage</div>
              <div style={{ display:'flex', gap:5, marginBottom:16 }}>
                {['0%','0.25%','0.5%','1%','2%'].map(s => (
                  <button key={s} onClick={() => setSlippage(s)} style={{ flex:1, padding:'5px 2px', borderRadius:7, cursor:'pointer', border:`1px solid ${slippage===s?'#0f9b5e':'rgba(255,255,255,0.07)'}`, background:slippage===s?'rgba(0,200,83,0.08)':'transparent', color:slippage===s?'#00e676':'#4a6e5a', fontSize:11, fontFamily:'Manrope' }}>{s}</button>
                ))}
              </div>

              {/* Submit */}
              <button onClick={handleTrade}
                style={{ width:'100%', padding:'13px 0', background:side==='buy'?'#0d8f44':'#8f1a1a', border:'none', borderRadius:10, fontFamily:'Manrope', fontWeight:800, fontSize:14, color:'#fff', cursor:'pointer', marginBottom:12, transition:'all .15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = side==='buy'?'#0f9b5e':'#c0392b' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = side==='buy'?'#0d8f44':'#8f1a1a' }}
              >
                {wallet.connected ? (side==='buy'?'Open Long Position':'Open Short Position') : 'Connect Wallet'}
              </button>

              {/* Arcium note */}
              <div style={{ background:'rgba(124,77,255,0.08)', border:'1px solid rgba(124,77,255,0.2)', borderRadius:8, padding:'9px 12px', fontSize:11, color:'#b39ddb', lineHeight:1.5 }}>
                🔒 Encrypted via <strong>Arcium MXE</strong>. Position, collateral &amp; liquidation price are private.
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ORDERS */}
        <div style={{ height:200, flexShrink:0, borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
            {['Positions','Open Orders','Order History'].map(t => (
              <div key={t} onClick={() => setBottomTab(t)} style={{ padding:'9px 18px', fontSize:13, cursor:'pointer', color:t===bottomTab?'#e8f5e9':'#4a6e5a', borderBottom:`2px solid ${t===bottomTab?'#00e676':'transparent'}`, transition:'all .15s' }}>
                {t}{t==='Positions'&&openPositions.length>0?<span style={{ background:'#0f9b5e',color:'#fff',borderRadius:10,fontSize:10,padding:'1px 6px',marginLeft:4,fontWeight:700 }}>{openPositions.length}</span>:null}
              </div>
            ))}
            {txLink && (
              <a href={txLink} target="_blank" rel="noopener" style={{ marginLeft:'auto', marginRight:16, fontSize:12, color:'#1de9b6', textDecoration:'none' }}>View last tx ↗</a>
            )}
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>{['Market','Side','Collateral','Entry','Liq. Price','PnL','Leverage','Status','Action'].map(h => (
                  <th key={h} style={{ fontSize:10, color:'#4a6e5a', padding:'6px 14px', textAlign:'left', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.5px', position:'sticky', top:0, background:'#0d1117' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {shownPositions.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign:'center', padding:'22px 14px', color:'#4a6e5a', fontSize:13 }}>
                    {wallet.connected ? 'No positions. Place a trade above.' : 'Connect wallet to view positions.'}
                  </td></tr>
                )}
                {shownPositions.map((pos,i) => {
                  const ep = pos.entryPrice.toNumber() / 1_000_000
                  const liq = pos.liquidationPrice.toNumber() / 1_000_000
                  const col = pos.collateral.toNumber() / 1_000_000
                  const pnl = pos.pnl ? pos.pnl.toNumber() / 1_000_000 : 0
                  return (
                    <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding:'6px 14px', fontSize:12, color:'#e8f5e9', fontWeight:600 }}>{pos.market}</td>
                      <td style={{ padding:'6px 14px', fontSize:12, color:pos.side===0?'#00e676':'#ef5350', fontWeight:700 }}>{pos.side===0?'LONG':'SHORT'}</td>
                      <td style={{ padding:'6px 14px', fontSize:12, color:'#81c784' }}>${col.toFixed(2)}</td>
                      <td style={{ padding:'6px 14px', fontSize:12, color:'#e8f5e9' }}>${ep.toFixed(2)}</td>
                      <td style={{ padding:'6px 14px', fontSize:12, color:'#ef5350' }}>${liq.toFixed(2)}</td>
                      <td style={{ padding:'6px 14px', fontSize:12, color:pnl>=0?'#00e676':'#ef5350', fontWeight:700 }}>{pnl>=0?'+':''}${pnl.toFixed(2)}</td>
                      <td style={{ padding:'6px 14px', fontSize:12, color:'#81c784' }}>{pos.leverage}×</td>
                      <td style={{ padding:'6px 14px' }}>
                        <span style={{ background:pos.status===0?'rgba(0,200,83,0.12)':'rgba(255,255,255,0.06)', color:pos.status===0?'#00e676':'#81c784', padding:'2px 8px', borderRadius:100, fontSize:10, fontWeight:600 }}>
                          {pos.status===0?'Open':'Closed'}
                        </span>
                      </td>
                      <td style={{ padding:'6px 14px' }}>
                        {pos.status===0 && (
                          <button onClick={() => handleClose(pos)} style={{ background:'rgba(239,83,80,0.12)', border:'1px solid rgba(239,83,80,0.3)', color:'#ef5350', fontFamily:'Manrope', fontWeight:600, fontSize:11, padding:'4px 10px', borderRadius:6, cursor:'pointer' }}>Close</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  )
}
