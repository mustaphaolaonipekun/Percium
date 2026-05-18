// import { useState, useEffect, useCallback, useRef } from 'react'
// import { useConnection, useWallet } from '@solana/wallet-adapter-react'
// import { PublicKey } from '@solana/web3.js'
// import { readSolBalance, readUsdcBalance, readProtocolBalance, PROGRAM_ID, USDC_MINT } from '../lib/program'

// // Re-export for convenience so other files can import from one place
// export { USDC_MINT, PROGRAM_ID }
// export const VAULT_TA = new PublicKey('ERTt43t8fi9Akwz34pTREVznNrAUCbwjfaA7qsG7ZVMc')

// export interface WalletData {
//   solBalance:      number
//   usdcBalance:     number
//   protocolBalance: number
//   address:         string
//   shortAddress:    string
// }

// const EMPTY: WalletData = {
//   solBalance: 0, usdcBalance: 0, protocolBalance: 0,
//   address: '', shortAddress: '',
// }

// export function useWalletData() {
//   const { connection } = useConnection()
//   const wallet         = useWallet()
//   const [data, setData]     = useState<WalletData>(EMPTY)
//   const [loading, setLoading] = useState(false)
//   const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
//   const mountedRef  = useRef(true)

//   useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

//   const refresh = useCallback(async () => {
//     if (!wallet.publicKey) { setData(EMPTY); return }

//     setLoading(true)
//     try {
//       const pk   = wallet.publicKey
//       const addr = pk.toString()

//       const [sol, usdc, proto] = await Promise.allSettled([
//         readSolBalance(connection, pk),
//         readUsdcBalance(connection, pk),
//         readProtocolBalance(connection, pk),
//       ])

//       if (!mountedRef.current) return

//       setData({
//         solBalance:      sol.status   === 'fulfilled' ? sol.value   : 0,
//         usdcBalance:     usdc.status  === 'fulfilled' ? usdc.value  : 0,
//         protocolBalance: proto.status === 'fulfilled' ? proto.value : 0,
//         address:         addr,
//         shortAddress:    addr.slice(0, 4) + '...' + addr.slice(-4),
//       })
//     } catch (e) {
//       console.warn('useWalletData refresh error:', e)
//       // Keep last known data - do not wipe to zero on transient errors
//     } finally {
//       if (mountedRef.current) setLoading(false)
//     }
//   }, [connection, wallet.publicKey?.toString()])

//   // Refresh on connect/disconnect, and poll every 10s
//   useEffect(() => {
//     if (intervalRef.current) clearInterval(intervalRef.current)

//     if (wallet.publicKey) {
//       refresh()
//       intervalRef.current = setInterval(refresh, 10_000)
//     } else {
//       setData(EMPTY)
//     }

//     return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
//   }, [wallet.publicKey?.toString()])  // only re-run when address changes

//   // Refresh with a delay after a tx (gives chain time to confirm)
//   const refreshAfterTx = useCallback(async (delayMs = 2500) => {
//     await new Promise(r => setTimeout(r, delayMs))
//     await refresh()
//   }, [refresh])

//   return { data, loading, refresh, refreshAfterTx }
// }
import { useState, useEffect, useCallback, useRef } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { readSolBalance, readUsdcBalance, readProtocolBalance, PROGRAM_ID, USDC_MINT } from '../lib/program'

// Re-export for convenience
export { USDC_MINT, PROGRAM_ID }
export const VAULT_TA = new PublicKey('ERTt43t8fi9Akwz34pTREVznNrAUCbwjfaA7qsG7ZVMc')

export interface WalletData {
  solBalance:      number
  usdcBalance:     number
  protocolBalance: number
  address:         string
  shortAddress:    string
}

const EMPTY: WalletData = {
  solBalance: 0, usdcBalance: 0, protocolBalance: 0,
  address: '', shortAddress: '',
}

export function useWalletData() {
  const { connection } = useConnection()
  const wallet         = useWallet()
  const [data, setData]       = useState<WalletData>(EMPTY)
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef  = useRef(true)

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  const refresh = useCallback(async () => {
    if (!wallet.publicKey) { setData(EMPTY); return }

    setLoading(true)
    try {
      const pk   = wallet.publicKey
      const addr = pk.toString()

      const [sol, usdc, proto] = await Promise.allSettled([
        readSolBalance(connection, pk),
        readUsdcBalance(connection, pk),
        readProtocolBalance(connection, pk),
      ])

      if (!mountedRef.current) return

      setData({
        solBalance:      sol.status   === 'fulfilled' ? sol.value   : 0,
        usdcBalance:     usdc.status  === 'fulfilled' ? usdc.value  : 0,
        protocolBalance: proto.status === 'fulfilled' ? proto.value : 0,
        address:         addr,
        shortAddress:    addr.slice(0, 4) + '...' + addr.slice(-4),
      })
    } catch (e) {
      console.warn('useWalletData refresh error:', e)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [connection, wallet.publicKey?.toString()])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    if (wallet.publicKey) {
      refresh()
      intervalRef.current = setInterval(refresh, 10_000)
    } else {
      setData(EMPTY)
    }

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [wallet.publicKey?.toString()])

  const refreshAfterTx = useCallback(async (delayMs = 2500) => {
    await new Promise(r => setTimeout(r, delayMs))
    await refresh()
  }, [refresh])

  return { data, loading, refresh, refreshAfterTx }
}
