import { useEffect, useState } from 'react'

interface Props {
  message: string
  type?: 'success' | 'error' | 'loading'
  onDone?: () => void
}

export default function Toast({ message, type = 'success', onDone }: Props) {
  const [visible, setVisible] = useState(true)
  const duration = type === 'error' ? 7000 : type === 'loading' ? 999999 : 4500

  useEffect(() => {
    setVisible(true)
    if (type === 'loading') return
    const t = setTimeout(() => { setVisible(false); onDone?.() }, duration)
    return () => clearTimeout(t)
  }, [message, type])

  if (!visible) return null

  const borderColor = type === 'error' ? '#ef5350' : type === 'loading' ? '#ffd740' : '#00e676'
  const icon = type === 'error' ? '✕' : type === 'loading' ? null : '✓'
  const iconColor = type === 'error' ? '#ef5350' : '#00e676'

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: '#0d2e22', border: `1px solid ${borderColor}`,
      color: '#e8f5e9', padding: '13px 18px', borderRadius: 12,
      fontSize: 13, fontFamily: 'Manrope', fontWeight: 500,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-start', gap: 10,
      maxWidth: 380, lineHeight: 1.55,
    }}>
      {type === 'loading' ? (
        <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #ffd740', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0, marginTop: 1 }} />
      ) : (
        <span style={{ color: iconColor, fontWeight: 700, flexShrink: 0 }}>{icon}</span>
      )}
      <span style={{ whiteSpace: 'pre-line' }}>{message}</span>
      {type !== 'loading' && (
        <button onClick={() => { setVisible(false); onDone?.() }}
          style={{ background: 'transparent', border: 'none', color: '#4a6e5a', cursor: 'pointer', fontSize: 14, marginLeft: 6, flexShrink: 0, lineHeight: 1 }}>✕</button>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
