import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'
import {
  PublicKey, SystemProgram, Connection, LAMPORTS_PER_SOL,
  Transaction, VersionedTransaction,
} from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token'
import { IDL } from './idl'

// ─── Constants ────────────────────────────────────────────────────────────────
export const PROGRAM_ID          = new PublicKey('76C52sp1b4MbXW6H64H3zDXqaHbGqfT915NVcUm6oZXn')
export const USDC_MINT           = new PublicKey('2fxCkXUmGKi3rkBxxHizEtakZi6RZ7ASfDNYZ5xJpYS9')
export const VAULT_TOKEN_ACCOUNT = new PublicKey('ERTt43t8fi9Akwz34pTREVznNrAUCbwjfaA7qsG7ZVMc')
export const VAULT_TA            = VAULT_TOKEN_ACCOUNT
export const RPC_URL             = 'https://devnet.helius-rpc.com/?api-key=f538e5d6-9fbb-4a76-8939-9eaa615d875e'
export const LAMPORTS_PER_USDC   = 1_000_000

// SOL mint address (native SOL wrapped)
export const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112')

// ─── PDA helpers ─────────────────────────────────────────────────────────────
export function getUserAccountPDA(owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user_account'), owner.toBuffer()],
    PROGRAM_ID
  )
}

export function getPositionPDA(owner: PublicKey, index: BN): [PublicKey, number] {
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64LE(BigInt(index.toString()))
  return PublicKey.findProgramAddressSync(
    [Buffer.from('position'), owner.toBuffer(), buf],
    PROGRAM_ID
  )
}

// ─── Program factory ─────────────────────────────────────────────────────────
export function getProgram(provider: AnchorProvider): Program<any> {
  return new Program(IDL as any, provider)
}

// ─── Safe BN — always use integer strings, never floats ─────────────────────
// Safe integer BN - handles floating point precision correctly
// Always rounds to nearest integer to avoid "100.9999" -> "100" errors
export function toBN(value: number): BN {
  // Use Math.round to avoid floating point like 99.99999 instead of 100
  const intVal = Math.round(value)
  return new BN(intVal.toString(10))
}

// Convert USDC float amount to lamports BN safely
export function usdcToBN(amountUsdc: number): BN {
  // Multiply by 1e6 using integer math to avoid float precision issues
  // e.g., 100.0 * 1000000 = 100000000 (exact)
  const lamports = Math.round(amountUsdc * 1_000_000)
  return new BN(lamports.toString(10))
}

// Convert SOL float to lamports BN safely
export function solToLamportsBN(amountSol: number): BN {
  const lamports = Math.round(amountSol * 1_000_000_000)
  return new BN(lamports.toString(10))
}

// ─── Price feed ──────────────────────────────────────────────────────────────
export interface PriceFeed { SOL: number; ETH: number; BTC: number }

export async function fetchPrices(): Promise<PriceFeed> {
  try {
    const r = await fetch('https://price.jup.ag/v6/price?ids=SOL,ETH,BTC', { signal: AbortSignal.timeout(5000) })
    if (r.ok) {
      const j = await r.json()
      const s = j.data?.SOL?.price, e = j.data?.ETH?.price, b = j.data?.BTC?.price
      if (s && e && b) return { SOL: s, ETH: e, BTC: b }
    }
  } catch { /* fall through */ }
  try {
    const r = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana,ethereum,bitcoin&vs_currencies=usd',
      { signal: AbortSignal.timeout(5000) }
    )
    if (r.ok) {
      const j = await r.json()
      return { SOL: j.solana?.usd ?? 150, ETH: j.ethereum?.usd ?? 2300, BTC: j.bitcoin?.usd ?? 65000 }
    }
  } catch { /* fall through */ }
  return { SOL: 150, ETH: 2300, BTC: 65000 }
}

// ─── Balance readers ──────────────────────────────────────────────────────────
export async function readSolBalance(connection: Connection, owner: PublicKey): Promise<number> {
  try { return (await connection.getBalance(owner, 'confirmed')) / LAMPORTS_PER_SOL } catch { return 0 }
}

export async function readUsdcBalance(connection: Connection, owner: PublicKey): Promise<number> {
  try {
    const ata = await getAssociatedTokenAddress(USDC_MINT, owner)
    const acc = await getAccount(connection, ata, 'confirmed')
    return Number(acc.amount) / LAMPORTS_PER_USDC
  } catch { return 0 }
}

export async function readProtocolBalance(connection: Connection, owner: PublicKey): Promise<number> {
  try {
    const [pda] = getUserAccountPDA(owner)
    const info = await connection.getAccountInfo(pda, 'confirmed')
    if (!info || info.data.length < 56) return 0
    // Layout: [0..8] discriminator | [8..40] owner pubkey | [40..48] usdcBalance | [48..56] protocolBalance
    const protocolBal = Buffer.from(info.data).readBigUInt64LE(48)
    return Number(protocolBal) / LAMPORTS_PER_USDC
  } catch { return 0 }
}

// ─── Ensure user account ─────────────────────────────────────────────────────
export async function ensureUserAccount(
  program: Program<any>,
  owner: PublicKey,
  connection: Connection
): Promise<void> {
  const [pda] = getUserAccountPDA(owner)
  const info = await connection.getAccountInfo(pda, 'confirmed')
  if (!info) {
    const sig = await program.methods
      .initializeUser()
      .accounts({ userAccount: pda, owner, systemProgram: SystemProgram.programId })
      .rpc()
    await connection.confirmTransaction(sig, 'confirmed')
    await new Promise(r => setTimeout(r, 800))
  }
}

// ─── Ensure USDC ATA exists (decodable by wallets) ─
export async function ensureUsdcAta(
  connection: Connection,
  walletAdapter: any,  // full wallet adapter object
  owner: PublicKey
): Promise<PublicKey> {
  const ata = await getAssociatedTokenAddress(USDC_MINT, owner)
  try {
    await getAccount(connection, ata, 'confirmed')
    return ata  // already exists
  } catch {
    // Create it — this is a STANDARD createAssociatedTokenAccount instruction
    // that all wallets (Phantom, OKX, Solflare) can decode correctly
    const tx = new Transaction()
    tx.add(
      createAssociatedTokenAccountInstruction(
        owner, ata, owner, USDC_MINT,
        TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
      )
    )
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
    tx.recentBlockhash = blockhash
    tx.feePayer = owner
    let sig: string
    if (walletAdapter.sendTransaction) {
      sig = await walletAdapter.sendTransaction(tx, connection, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })
    } else {
      const signed = await walletAdapter.signTransaction(tx)
      sig = await connection.sendRawTransaction(signed.serialize(), { preflightCommitment: 'confirmed' })
    }
    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
    return ata
  }
}

// ─── Jupiter Swap: SOL → USDC ────────────────────────────────────────────────
// Uses Jupiter v6 API — fully decodable by all wallets, shows correct asset changes
export interface SwapResult {
  txSig: string
  usdcReceived: number
  solSpent: number
}

export async function swapSolToUsdc(
  connection: Connection,
  walletAdapter: any,
  owner: PublicKey,
  solAmount: number,
  onStep: (msg: string) => void
): Promise<SwapResult> {
  const solLamports = Math.floor(solAmount * LAMPORTS_PER_SOL)

  onStep('Getting best swap rate from Jupiter...')

  // Step 1: Get quote — try devnet-compatible endpoint first
  const quoteParams = new URLSearchParams({
    inputMint: SOL_MINT.toString(),
    outputMint: USDC_MINT.toString(),
    amount: String(solLamports),
    slippageBps: '150',
    onlyDirectRoutes: 'false',
    asLegacyTransaction: 'false',
  })

  let quote: any = null
  let quoteErr = ''

  // Try Jupiter v6 (mainnet API also serves devnet routes sometimes)
  try {
    const r = await fetch('https://quote-api.jup.ag/v6/quote?' + quoteParams.toString(), {
      signal: AbortSignal.timeout(8000),
    })
    if (r.ok) {
      const j = await r.json()
      if (j && !j.error && j.outAmount) quote = j
      else quoteErr = j?.error ?? 'No route found'
    }
  } catch (e: any) {
    quoteErr = e?.message ?? 'Jupiter request failed'
  }

  if (!quote) {
    throw new Error(
      'Jupiter swap unavailable for this token pair on devnet. ' +
      'Reason: ' + quoteErr + '. ' +
      'To trade: get devnet USDC from the Solana faucet CLI, then deposit USDC directly.'
    )
  }

  const outAmount = Number(quote.outAmount) / LAMPORTS_PER_USDC
  onStep('Route found: ' + solAmount + ' SOL to ~$' + outAmount.toFixed(2) + ' USDC. Building tx...')

  // Step 2: Get swap transaction
  const swapBody = {
    quoteResponse: quote,
    userPublicKey: owner.toString(),
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
    prioritizationFeeLamports: 'auto',
    asLegacyTransaction: false,
  }

  const swapResp = await fetch('https://quote-api.jup.ag/v6/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(swapBody),
    signal: AbortSignal.timeout(10000),
  })
  if (!swapResp.ok) {
    const errText = await swapResp.text().catch(() => '')
    throw new Error('Failed to build swap transaction: ' + errText.slice(0, 100))
  }
  const swapData = await swapResp.json()
  const { swapTransaction } = swapData

  onStep('Please approve the Jupiter swap in your wallet...')

  // Step 3: Deserialize and sign the versioned transaction
  // Use Buffer.from correctly to avoid BN internal issues
  const swapTxBuf = Buffer.from(swapTransaction, 'base64')
  const versionedTx = VersionedTransaction.deserialize(new Uint8Array(swapTxBuf))

  // Get fresh blockhash for the transaction
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
  versionedTx.message.recentBlockhash = blockhash

  // Use walletAdapter.sendTransaction which handles versioned tx correctly
  // This avoids the _bn serialization error from signTransaction
  onStep('Sending swap transaction...')

  let sig: string
  if (walletAdapter.sendTransaction) {
    // Preferred: use sendTransaction (handles versioned tx natively)
    sig = await walletAdapter.sendTransaction(versionedTx, connection, {
      skipPreflight: false,
      maxRetries: 3,
      preflightCommitment: 'confirmed',
    })
  } else {
    // Fallback: sign then send raw
    const signed = await walletAdapter.signTransaction(versionedTx)
    sig = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    })
  }

  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
  return { txSig: sig, usdcReceived: outAmount, solSpent: solAmount }
}

// ─── SOL Airdrop (devnet only, no wallet signing needed) ─────────────────────
export async function airdropSol(
  connection: Connection,
  owner: PublicKey,
  amountSol: number = 1
): Promise<string> {
  const sig = await connection.requestAirdrop(owner, Math.floor(amountSol * LAMPORTS_PER_SOL))
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
  return sig
}

// ─── Deposit USDC wallet → protocol ──────────────────────────────────────────
export async function depositUSDC(
  program: Program<any>,
  owner: PublicKey,
  connection: Connection,
  amountUsdc: number
): Promise<string> {
  if (amountUsdc <= 0) throw new Error('Amount must be greater than 0')

  const walletBal = await readUsdcBalance(connection, owner)
  if (walletBal < amountUsdc - 0.001) {
    throw new Error(
      'Insufficient wallet USDC. You have $' + walletBal.toFixed(2) + ' but need $' + amountUsdc.toFixed(2) + '. Swap SOL to USDC first.'
    )
  }

  await ensureUserAccount(program, owner, connection)

  const [userPda] = getUserAccountPDA(owner)
  const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT, owner)
  const amountLamports = usdcToBN(amountUsdc)

  const sig = await program.methods
    .deposit(amountLamports)
    .accounts({
      userAccount: userPda,
      userTokenAccount,
      vaultTokenAccount: VAULT_TOKEN_ACCOUNT,
      owner,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc()

  await connection.confirmTransaction(sig, 'confirmed')
  return sig
}

// ─── Deposit SOL → auto-swap to USDC → deposit to protocol ──────────────────
// This is the "deposit with SOL" flow: swap SOL→USDC via Jupiter, then deposit
export async function depositSolAsUsdc(
  program: Program<any>,
  connection: Connection,
  walletAdapter: any,
  owner: PublicKey,
  solAmount: number,
  onStep: (msg: string) => void
): Promise<{ swapSig: string; depositSig: string; usdcDeposited: number }> {
  if (solAmount <= 0) throw new Error('Amount must be greater than 0')

  const solBal = await readSolBalance(connection, owner)
  const needed = solAmount + 0.01  // reserve 0.01 SOL for fees
  if (solBal < needed) {
    throw new Error(
      'Insufficient SOL. You have ' + solBal.toFixed(4) + ' SOL but need ' +
      needed.toFixed(4) + ' SOL (including 0.01 for fees).'
    )
  }

  // Step 1: Swap SOL → USDC via Jupiter
  const { txSig: swapSig, usdcReceived } = await swapSolToUsdc(
    connection, walletAdapter, owner, solAmount, onStep
  )

  // Wait for balance to update
  onStep('Swap confirmed! Waiting for USDC balance...')
  await new Promise(r => setTimeout(r, 2500))

  // Step 2: Deposit the USDC received into protocol
  onStep('Depositing ' + usdcReceived.toFixed(2) + ' USDC to your protocol balance...')
  await ensureUserAccount(program, owner, connection)

  const [userPda] = getUserAccountPDA(owner)
  const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT, owner)

  // Read actual USDC balance after swap (may differ slightly from quote)
  const actualUsdc = await readUsdcBalance(connection, owner)
  const depositAmt = Math.min(usdcReceived, actualUsdc)

  if (depositAmt <= 0) {
    throw new Error('Swap succeeded but USDC balance not found. Deposit manually from Get Tokens page.')
  }

  const amountLamports = usdcToBN(depositAmt)
  const depositSig = await program.methods
    .deposit(amountLamports)
    .accounts({
      userAccount: userPda,
      userTokenAccount,
      vaultTokenAccount: VAULT_TOKEN_ACCOUNT,
      owner,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc()

  await connection.confirmTransaction(depositSig, 'confirmed')
  return { swapSig, depositSig, usdcDeposited: depositAmt }
}

// ─── Withdraw USDC protocol → wallet ────────────────────────────────────────
export async function withdrawUSDC(
  program: Program<any>,
  owner: PublicKey,
  connection: Connection,
  amountUsdc: number
): Promise<string> {
  if (amountUsdc <= 0) throw new Error('Amount must be greater than 0')

  const protoBal = await readProtocolBalance(connection, owner)
  if (protoBal <= 0) throw new Error('You have no protocol balance to withdraw.')
  if (protoBal < amountUsdc - 0.001) {
    throw new Error(
      'Insufficient protocol balance. You have $' + protoBal.toFixed(2) +
      ' available but tried to withdraw $' + amountUsdc.toFixed(2) + '.'
    )
  }

  const [userPda] = getUserAccountPDA(owner)
  const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT, owner)
  const amountLamports = usdcToBN(amountUsdc)

  const sig = await program.methods
    .withdraw(amountLamports)
    .accounts({
      userAccount: userPda,
      userTokenAccount,
      vaultTokenAccount: VAULT_TOKEN_ACCOUNT,
      owner,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc()

  await connection.confirmTransaction(sig, 'confirmed')
  return sig
}

// ─── Withdraw USDC protocol → wallet → swap to SOL ───────────────────────────
export async function withdrawAsSOL(
  program: Program<any>,
  connection: Connection,
  walletAdapter: any,
  owner: PublicKey,
  amountUsdc: number,
  onStep: (msg: string) => void
): Promise<{ withdrawSig: string; swapSig: string; solReceived: number }> {
  onStep('Withdrawing USDC from protocol...')
  const withdrawSig = await withdrawUSDC(program, owner, connection, amountUsdc)

  await new Promise(r => setTimeout(r, 2000))
  onStep('Swapping USDC back to SOL via Jupiter...')

  // Swap USDC → SOL
  const solLamports = Math.floor(amountUsdc * LAMPORTS_PER_USDC)

  const quoteUrl = new URL('https://quote-api.jup.ag/v6/quote')
  quoteUrl.searchParams.set('inputMint', USDC_MINT.toString())
  quoteUrl.searchParams.set('outputMint', SOL_MINT.toString())
  quoteUrl.searchParams.set('amount', String(solLamports))
  quoteUrl.searchParams.set('slippageBps', '100')

  const quoteResp = await fetch(quoteUrl.toString(), { signal: AbortSignal.timeout(8000) })
  if (!quoteResp.ok) throw new Error('Failed to get swap quote for USDC → SOL.')
  const quote = await quoteResp.json()

  const solReceived = Number(quote.outAmount) / LAMPORTS_PER_SOL
  onStep('Swapping $' + amountUsdc.toFixed(2) + ' USDC → ~' + solReceived.toFixed(4) + ' SOL...')

  const swapResp = await fetch('https://quote-api.jup.ag/v6/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: owner.toString(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
    signal: AbortSignal.timeout(10000),
  })
  if (!swapResp.ok) throw new Error('Failed to build USDC → SOL swap transaction.')

  const { swapTransaction } = await swapResp.json()
  const witTxBuf = Buffer.from(swapTransaction, 'base64')
  const witVersionedTx = VersionedTransaction.deserialize(new Uint8Array(witTxBuf))
  const { blockhash: witBh, lastValidBlockHeight: witLvh } = await connection.getLatestBlockhash('confirmed')
  witVersionedTx.message.recentBlockhash = witBh

  let swapSig: string
  if (walletAdapter.sendTransaction) {
    swapSig = await walletAdapter.sendTransaction(witVersionedTx, connection, {
      skipPreflight: false, maxRetries: 3, preflightCommitment: 'confirmed',
    })
  } else {
    const signed = await walletAdapter.signTransaction(witVersionedTx)
    swapSig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false })
  }
  await connection.confirmTransaction({ signature: swapSig, blockhash: witBh, lastValidBlockHeight: witLvh }, 'confirmed')

  return { withdrawSig, swapSig, solReceived }
}

// ─── Open position ────────────────────────────────────────────────────────────
export async function openPosition(
  program: Program<any>,
  owner: PublicKey,
  connection: Connection,
  market: string,
  side: 0 | 1,
  leverage: number,
  collateralUsdc: number,
  entryPriceUsd: number,
  totalPositions: BN
): Promise<{ txSig: string; positionPda: PublicKey }> {
  if (collateralUsdc <= 0) throw new Error('Collateral must be greater than 0')

  const protoBal = await readProtocolBalance(connection, owner)
  if (protoBal < collateralUsdc - 0.001) {
    throw new Error(
      'Insufficient protocol balance ($' + protoBal.toFixed(2) + '). ' +
      'Deposit at least $' + collateralUsdc.toFixed(2) + ' USDC first.'
    )
  }

  await ensureUserAccount(program, owner, connection)

  const [userPda] = getUserAccountPDA(owner)
  const [positionPda] = getPositionPDA(owner, totalPositions)

  const collateral = usdcToBN(collateralUsdc)
  const entryPrice = usdcToBN(entryPriceUsd)
  const size = usdcToBN(collateralUsdc * leverage)

  const txSig = await program.methods
    .openPosition(market, side, leverage, collateral, entryPrice, size)
    .accounts({ userAccount: userPda, position: positionPda, owner, systemProgram: SystemProgram.programId })
    .rpc()

  return { txSig, positionPda }
}

// ─── Close position ───────────────────────────────────────────────────────────
export async function closePosition(
  program: Program<any>,
  owner: PublicKey,
  positionPda: PublicKey,
  exitPriceUsd: number
): Promise<string> {
  const [userPda] = getUserAccountPDA(owner)
  const exitPrice = usdcToBN(exitPriceUsd)
  return program.methods
    .closePosition(exitPrice)
    .accounts({ userAccount: userPda, position: positionPda, owner })
    .rpc()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function bnToUsdc(bn: BN | null | undefined): number {
  if (!bn) return 0
  try { return bn.toNumber() / LAMPORTS_PER_USDC } catch { return 0 }
}

export function bnToPrice(bn: BN | null | undefined): number {
  if (!bn) return 0
  try { return bn.toNumber() / LAMPORTS_PER_USDC } catch { return 0 }
}
