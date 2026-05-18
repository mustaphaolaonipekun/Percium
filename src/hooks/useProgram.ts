import { useMemo, useEffect, useState, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { AnchorProvider } from '@coral-xyz/anchor'
import {
  getProgram,
  fetchUserAccount,
  fetchAllPositions,
  fetchUSDCBalance,
  getUserAccountPDA,
  initializeUser,
  depositUSDC,
  withdrawUSDC,
  openPosition,
  closePosition,
  fetchPrices,
  UserAccountData,
  PositionData,
  PriceFeed,
  bnToUsdc,
  bnToPrice,
  formatUsdc,
} from '../lib/program'
import { PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'

export type { UserAccountData, PositionData, PriceFeed }
export { bnToUsdc, bnToPrice, formatUsdc }

// ─── useProgram ───────────────────────────────────────────────────────────────
export function useProgram() {
  const { connection } = useConnection()
  const wallet = useWallet()

  const provider = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) return null
    return new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' })
  }, [connection, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions])

  const program = useMemo(() => {
    if (!provider) return null
    return getProgram(provider)
  }, [provider])

  return { program, provider, connection, wallet }
}

// ─── useUserAccount ───────────────────────────────────────────────────────────
export function useUserAccount() {
  const { program, wallet, connection } = useProgram()
  const [userAccount, setUserAccount] = useState<UserAccountData | null>(null)
  const [usdcBalance, setUsdcBalance] = useState(0)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!program || !wallet.publicKey) return
    setLoading(true)
    try {
      const [acc, bal] = await Promise.all([
        fetchUserAccount(program, wallet.publicKey),
        fetchUSDCBalance(connection, wallet.publicKey),
      ])
      setUserAccount(acc)
      setUsdcBalance(bal)
    } catch (e) {
      console.error('fetchUserAccount error:', e)
    } finally {
      setLoading(false)
    }
  }, [program, wallet.publicKey, connection])

  useEffect(() => { refresh() }, [refresh])

  return { userAccount, usdcBalance, loading, refresh }
}

// ─── usePositions ─────────────────────────────────────────────────────────────
export function usePositions() {
  const { program, wallet } = useProgram()
  const [positions, setPositions] = useState<PositionData[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async (totalPositions?: number) => {
    if (!program || !wallet.publicKey) return
    setLoading(true)
    try {
      const n = totalPositions ?? 0
      const pos = await fetchAllPositions(program, wallet.publicKey, n)
      setPositions(pos)
    } catch (e) {
      console.error('fetchPositions error:', e)
    } finally {
      setLoading(false)
    }
  }, [program, wallet.publicKey])

  return { positions, loading, refresh }
}

// ─── usePrices ────────────────────────────────────────────────────────────────
export function usePrices() {
  const [prices, setPrices] = useState<PriceFeed>({ SOL: 150, ETH: 2300, BTC: 65000 })

  useEffect(() => {
    const load = async () => {
      const p = await fetchPrices()
      setPrices(p)
    }
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  return prices
}

// ─── useActions ───────────────────────────────────────────────────────────────
export function useActions() {
  const { program, wallet, connection } = useProgram()
  const [txSig, setTxSig] = useState('')

  const ensureInit = useCallback(async () => {
    if (!program || !wallet.publicKey) throw new Error('Not connected')
    const acc = await fetchUserAccount(program, wallet.publicKey)
    if (!acc) {
      const sig = await initializeUser(program, wallet.publicKey)
      console.log('Initialized user account:', sig)
    }
  }, [program, wallet.publicKey])

  const deposit = useCallback(async (amount: number) => {
    if (!program || !wallet.publicKey) throw new Error('Not connected')
    await ensureInit()
    // depositUSDC now requires connection as 3rd argument
    const sig = await depositUSDC(program, wallet.publicKey, connection, amount)
    setTxSig(sig)
    return sig
  }, [program, wallet.publicKey, connection, ensureInit])

  const withdraw = useCallback(async (amount: number) => {
    if (!program || !wallet.publicKey) throw new Error('Not connected')
    // withdrawUSDC now requires connection as 3rd argument
    const sig = await withdrawUSDC(program, wallet.publicKey, connection, amount)
    setTxSig(sig)
    return sig
  }, [program, wallet.publicKey, connection])

  const openPos = useCallback(async (
    market: string,
    side: 0 | 1,
    leverage: number,
    collateral: number,
    entryPrice: number,
    totalPositions: BN
  ) => {
    if (!program || !wallet.publicKey) throw new Error('Not connected')
    await ensureInit()
    // openPosition now requires connection as 3rd argument
    const result = await openPosition(
      program, wallet.publicKey, connection,
      market, side, leverage, collateral, entryPrice, totalPositions
    )
    setTxSig(result.txSig)
    return result
  }, [program, wallet.publicKey, connection, ensureInit])

  const closePos = useCallback(async (positionPda: PublicKey, exitPrice: number) => {
    if (!program || !wallet.publicKey) throw new Error('Not connected')
    // closePosition signature unchanged: (program, owner, positionPda, exitPrice)
    const sig = await closePosition(program, wallet.publicKey, positionPda, exitPrice)
    setTxSig(sig)
    return sig
  }, [program, wallet.publicKey])

  return { deposit, withdraw, openPos, closePos, txSig }
}