import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useNavigate } from 'react-router-dom'
import { useWalletData } from '../hooks/useWalletData'
import { Bell, Settings } from 'lucide-react'

interface Props {
  children?: React.ReactNode
}

export default function TopBar({ children }: Props) {
  const wallet = useWallet()
  const { setVisible } = useWalletModal()
  const { data } = useWalletData()
  const navigate = useNavigate()

  return (
    <div style={{
      height: 52, flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center',
      padding: '0 14px', gap: 0,
      background: '#0d1117',
    }}>
      {children}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {wallet.connected && data.protocolBalance >= 0 && (
          <div style={{ fontSize: 12, color: '#4a6e5a', padding: '0 8px', borderRight: '1px solid rgba(255,255,255,0.06)', marginRight: 4 }}>
            Protocol: <span style={{ color: '#00e676', fontWeight: 700 }}>${data.protocolBalance.toFixed(2)}</span>
          </div>
        )}
        <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, width: 33, height: 33, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4a6e5a', transition: 'all .15s' }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color='#e8f5e9'; el.style.borderColor='rgba(255,255,255,0.15)' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color='#4a6e5a'; el.style.borderColor='rgba(255,255,255,0.07)' }}
        ><Bell size={14} /></button>
        <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, width: 33, height: 33, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4a6e5a', transition: 'all .15s' }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color='#e8f5e9'; el.style.borderColor='rgba(255,255,255,0.15)' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color='#4a6e5a'; el.style.borderColor='rgba(255,255,255,0.07)' }}
        ><Settings size={14} /></button>
        <button
          onClick={() => wallet.connected ? wallet.disconnect() : setVisible(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: wallet.connected ? '#1c2430' : '#0f9b5e',
            border: wallet.connected ? '1px solid rgba(0,230,118,0.22)' : 'none',
            color: '#fff', fontFamily: 'Manrope', fontWeight: 700, fontSize: 13,
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; if (!wallet.connected) el.style.background='#00c853' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; if (!wallet.connected) el.style.background='#0f9b5e' }}
        >
          {wallet.connected ? (
            <><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00e676', flexShrink: 0 }} />{data.shortAddress || wallet.publicKey?.toString().slice(0,4)+'...'+wallet.publicKey?.toString().slice(-4)}</>
          ) : '⬡ Connect Wallet'}
        </button>
      </div>
    </div>
  )
}
