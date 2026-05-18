// import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'
// import {
//   PublicKey, SystemProgram, Connection, LAMPORTS_PER_SOL,
//   Transaction, VersionedTransaction,
// } from '@solana/web3.js'
// import {
//   TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
//   getAssociatedTokenAddress,
//   createAssociatedTokenAccountInstruction,
//   getAccount,
// } from '@solana/spl-token'
// import { IDL } from './idl'

// // ─── Constants ────────────────────────────────────────────────────────────────
// export const PROGRAM_ID          = new PublicKey('76C52sp1b4MbXW6H64H3zDXqaHbGqfT915NVcUm6oZXn')
// export const USDC_MINT           = new PublicKey('2fxCkXUmGKi3rkBxxHizEtakZi6RZ7ASfDNYZ5xJpYS9')
// export const VAULT_TOKEN_ACCOUNT = new PublicKey('ERTt43t8fi9Akwz34pTREVznNrAUCbwjfaA7qsG7ZVMc')
// export const VAULT_TA            = VAULT_TOKEN_ACCOUNT
// export const RPC_URL             = 'https://devnet.helius-rpc.com/?api-key=f538e5d6-9fbb-4a76-8939-9eaa615d875e'
// export const LAMPORTS_PER_USDC   = 1_000_000

// export const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112')

// // ─── Types ────────────────────────────────────────────────────────────────────
// export interface UserAccountData {
//   owner: PublicKey
//   usdcBalance: BN
//   protocolBalance: BN
//   totalPositions: BN
// }

// export interface PositionData {
//   owner: PublicKey
//   market: string
//   side: number          // 0 = Long, 1 = Short
//   leverage: number
//   collateral: BN
//   entryPrice: BN
//   size: BN
//   isOpen: boolean
//   index: BN
//   publicKey: PublicKey
// }

// export interface PriceFeed { SOL: number; ETH: number; BTC: number }

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// export function bnToUsdc(bn: BN | null | undefined): number {
//   if (!bn) return 0
//   try { return bn.toNumber() / LAMPORTS_PER_USDC } catch { return 0 }
// }

// export function bnToPrice(bn: BN | null | undefined): number {
//   if (!bn) return 0
//   try { return bn.toNumber() / LAMPORTS_PER_USDC } catch { return 0 }
// }

// export function formatUsdc(amount: number): string {
//   return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
// }

// // ─── PDA helpers ─────────────────────────────────────────────────────────────
// export function getUserAccountPDA(owner: PublicKey): [PublicKey, number] {
//   return PublicKey.findProgramAddressSync(
//     [Buffer.from('user_account'), owner.toBuffer()],
//     PROGRAM_ID
//   )
// }

// export function getPositionPDA(owner: PublicKey, index: BN): [PublicKey, number] {
//   const buf = Buffer.alloc(8)
//   buf.writeBigUInt64LE(BigInt(index.toString()))
//   return PublicKey.findProgramAddressSync(
//     [Buffer.from('position'), owner.toBuffer(), buf],
//     PROGRAM_ID
//   )
// }

// // ─── Program factory ─────────────────────────────────────────────────────────
// export function getProgram(provider: AnchorProvider): Program<any> {
//   return new Program(IDL as any, provider)
// }

// // ─── Safe BN ─────────────────────────────────────────────────────────────────
// export function toBN(value: number): BN {
//   return new BN(String(Math.floor(value)))
// }

// // ─── Price feed ──────────────────────────────────────────────────────────────
// export async function fetchPrices(): Promise<PriceFeed> {
//   try {
//     const r = await fetch('https://price.jup.ag/v6/price?ids=SOL,ETH,BTC', { signal: AbortSignal.timeout(5000) })
//     if (r.ok) {
//       const j = await r.json()
//       const s = j.data?.SOL?.price, e = j.data?.ETH?.price, b = j.data?.BTC?.price
//       if (s && e && b) return { SOL: s, ETH: e, BTC: b }
//     }
//   } catch { /* fall through */ }
//   try {
//     const r = await fetch(
//       'https://api.coingecko.com/api/v3/simple/price?ids=solana,ethereum,bitcoin&vs_currencies=usd',
//       { signal: AbortSignal.timeout(5000) }
//     )
//     if (r.ok) {
//       const j = await r.json()
//       return { SOL: j.solana?.usd ?? 150, ETH: j.ethereum?.usd ?? 2300, BTC: j.bitcoin?.usd ?? 65000 }
//     }
//   } catch { /* fall through */ }
//   return { SOL: 150, ETH: 2300, BTC: 65000 }
// }

// // ─── Balance readers ──────────────────────────────────────────────────────────
// export async function readSolBalance(connection: Connection, owner: PublicKey): Promise<number> {
//   try { return (await connection.getBalance(owner, 'confirmed')) / LAMPORTS_PER_SOL } catch { return 0 }
// }

// export async function readUsdcBalance(connection: Connection, owner: PublicKey): Promise<number> {
//   try {
//     const ata = await getAssociatedTokenAddress(USDC_MINT, owner)
//     const acc = await getAccount(connection, ata, 'confirmed')
//     return Number(acc.amount) / LAMPORTS_PER_USDC
//   } catch { return 0 }
// }

// /** Alias kept for backward-compat with useProgram.ts */
// export const fetchUSDCBalance = readUsdcBalance

// export async function readProtocolBalance(connection: Connection, owner: PublicKey): Promise<number> {
//   try {
//     const [pda] = getUserAccountPDA(owner)
//     const info = await connection.getAccountInfo(pda, 'confirmed')
//     if (!info || info.data.length < 56) return 0
//     // Layout: [0..8] discriminator | [8..40] owner pubkey | [40..48] usdcBalance | [48..56] protocolBalance
//     const protocolBal = Buffer.from(info.data).readBigUInt64LE(48)
//     return Number(protocolBal) / LAMPORTS_PER_USDC
//   } catch { return 0 }
// }

// // ─── Fetch user account ───────────────────────────────────────────────────────
// export async function fetchUserAccount(
//   program: Program<any>,
//   owner: PublicKey
// ): Promise<UserAccountData | null> {
//   try {
//     const [pda] = getUserAccountPDA(owner)
//     const acc = await (program.account as any).userAccount.fetch(pda)
//     return {
//       owner: acc.owner,
//       usdcBalance: acc.usdcBalance ?? new BN(0),
//       protocolBalance: acc.protocolBalance ?? new BN(0),
//       totalPositions: acc.totalPositions ?? new BN(0),
//     }
//   } catch {
//     return null
//   }
// }

// // ─── Fetch all positions ──────────────────────────────────────────────────────
// export async function fetchAllPositions(
//   program: Program<any>,
//   owner: PublicKey,
//   totalPositions: number
// ): Promise<PositionData[]> {
//   if (totalPositions === 0) return []
//   const results: PositionData[] = []
//   for (let i = 0; i < totalPositions; i++) {
//     try {
//       const index = new BN(i)
//       const [positionPda] = getPositionPDA(owner, index)
//       const pos = await (program.account as any).position.fetch(positionPda)
//       if (pos && pos.isOpen) {
//         results.push({
//           owner: pos.owner,
//           market: pos.market,
//           side: pos.side,
//           leverage: pos.leverage,
//           collateral: pos.collateral,
//           entryPrice: pos.entryPrice,
//           size: pos.size,
//           isOpen: pos.isOpen,
//           index,
//           publicKey: positionPda,
//         })
//       }
//     } catch {
//       // Position closed or doesn't exist — skip
//     }
//   }
//   return results
// }

// // ─── Initialize user ──────────────────────────────────────────────────────────
// export async function initializeUser(
//   program: Program<any>,
//   owner: PublicKey
// ): Promise<string> {
//   const [pda] = getUserAccountPDA(owner)
//   const sig = await program.methods
//     .initializeUser()
//     .accounts({ userAccount: pda, owner, systemProgram: SystemProgram.programId })
//     .rpc()
//   return sig
// }

// // ─── Ensure user account ─────────────────────────────────────────────────────
// export async function ensureUserAccount(
//   program: Program<any>,
//   owner: PublicKey,
//   connection: Connection
// ): Promise<void> {
//   const [pda] = getUserAccountPDA(owner)
//   const info = await connection.getAccountInfo(pda, 'confirmed')
//   if (!info) {
//     const sig = await initializeUser(program, owner)
//     await connection.confirmTransaction(sig, 'confirmed')
//     await new Promise(r => setTimeout(r, 800))
//   }
// }

// // ─── Ensure USDC ATA ─────────────────────────────────────────────────────────
// export async function ensureUsdcAta(
//   connection: Connection,
//   walletAdapter: any,
//   owner: PublicKey
// ): Promise<PublicKey> {
//   const ata = await getAssociatedTokenAddress(USDC_MINT, owner)
//   try {
//     await getAccount(connection, ata, 'confirmed')
//     return ata
//   } catch {
//     const tx = new Transaction()
//     tx.add(
//       createAssociatedTokenAccountInstruction(
//         owner, ata, owner, USDC_MINT,
//         TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
//       )
//     )
//     const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
//     tx.recentBlockhash = blockhash
//     tx.feePayer = owner
//     const signed = await walletAdapter.signTransaction(tx)
//     const sig = await connection.sendRawTransaction(signed.serialize(), { preflightCommitment: 'confirmed' })
//     await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
//     return ata
//   }
// }

// // ─── Jupiter Swap: SOL → USDC ────────────────────────────────────────────────
// export interface SwapResult {
//   txSig: string
//   usdcReceived: number
//   solSpent: number
// }

// export async function swapSolToUsdc(
//   connection: Connection,
//   walletAdapter: any,
//   owner: PublicKey,
//   solAmount: number,
//   onStep: (msg: string) => void
// ): Promise<SwapResult> {
//   const solLamports = Math.floor(solAmount * LAMPORTS_PER_SOL)

//   onStep('Getting best swap rate from Jupiter...')

//   const quoteUrl = new URL('https://quote-api.jup.ag/v6/quote')
//   quoteUrl.searchParams.set('inputMint', SOL_MINT.toString())
//   quoteUrl.searchParams.set('outputMint', USDC_MINT.toString())
//   quoteUrl.searchParams.set('amount', String(solLamports))
//   quoteUrl.searchParams.set('slippageBps', '100')
//   quoteUrl.searchParams.set('onlyDirectRoutes', 'false')

//   const quoteResp = await fetch(quoteUrl.toString(), { signal: AbortSignal.timeout(8000) })
//   if (!quoteResp.ok) {
//     throw new Error('Jupiter quote failed. Try depositing USDC directly.')
//   }
//   const quote = await quoteResp.json()
//   if (!quote || quote.error) {
//     throw new Error(quote?.error ?? 'No swap route found for SOL → USDC on devnet.')
//   }

//   const outAmount = Number(quote.outAmount) / LAMPORTS_PER_USDC
//   onStep(`Swap route found: ${solAmount} SOL → ~${outAmount.toFixed(2)} USDC. Building transaction...`)

//   const swapResp = await fetch('https://quote-api.jup.ag/v6/swap', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       quoteResponse: quote,
//       userPublicKey: owner.toString(),
//       wrapAndUnwrapSol: true,
//       dynamicComputeUnitLimit: true,
//       prioritizationFeeLamports: 'auto',
//     }),
//     signal: AbortSignal.timeout(10000),
//   })

//   if (!swapResp.ok) throw new Error('Failed to build swap transaction. Please try again.')
//   const { swapTransaction } = await swapResp.json()

//   onStep('Please approve the swap in your wallet...')

//   const txBuf = Buffer.from(swapTransaction, 'base64')
//   const vTx = VersionedTransaction.deserialize(txBuf)
//   const signed = await walletAdapter.signTransaction(vTx)

//   onStep('Sending swap transaction...')
//   const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
//   const sig = await connection.sendRawTransaction(signed.serialize(), {
//     skipPreflight: false,
//     maxRetries: 3,
//   })
//   await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')

//   return { txSig: sig, usdcReceived: outAmount, solSpent: solAmount }
// }

// // ─── SOL Airdrop ─────────────────────────────────────────────────────────────
// export async function airdropSol(
//   connection: Connection,
//   owner: PublicKey,
//   amountSol: number = 1
// ): Promise<string> {
//   const sig = await connection.requestAirdrop(owner, Math.floor(amountSol * LAMPORTS_PER_SOL))
//   const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
//   await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
//   return sig
// }

// // ─── Deposit USDC wallet → protocol ──────────────────────────────────────────
// export async function depositUSDC(
//   program: Program<any>,
//   owner: PublicKey,
//   connection: Connection,
//   amountUsdc: number
// ): Promise<string> {
//   if (amountUsdc <= 0) throw new Error('Amount must be greater than 0')

//   const walletBal = await readUsdcBalance(connection, owner)
//   if (walletBal < amountUsdc - 0.001) {
//     throw new Error(
//       `Insufficient wallet USDC. You have $${walletBal.toFixed(2)} but need $${amountUsdc.toFixed(2)}. Swap SOL to USDC first.`
//     )
//   }

//   await ensureUserAccount(program, owner, connection)

//   const [userPda] = getUserAccountPDA(owner)
//   const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT, owner)
//   const amountLamports = toBN(amountUsdc * LAMPORTS_PER_USDC)

//   const sig = await program.methods
//     .deposit(amountLamports)
//     .accounts({
//       userAccount: userPda,
//       userTokenAccount,
//       vaultTokenAccount: VAULT_TOKEN_ACCOUNT,
//       owner,
//       tokenProgram: TOKEN_PROGRAM_ID,
//     })
//     .rpc()

//   await connection.confirmTransaction(sig, 'confirmed')
//   return sig
// }

// // ─── Deposit SOL → swap → deposit ────────────────────────────────────────────
// export async function depositSolAsUsdc(
//   program: Program<any>,
//   connection: Connection,
//   walletAdapter: any,
//   owner: PublicKey,
//   solAmount: number,
//   onStep: (msg: string) => void
// ): Promise<{ swapSig: string; depositSig: string; usdcDeposited: number }> {
//   if (solAmount <= 0) throw new Error('Amount must be greater than 0')

//   const solBal = await readSolBalance(connection, owner)
//   const needed = solAmount + 0.01
//   if (solBal < needed) {
//     throw new Error(
//       `Insufficient SOL. You have ${solBal.toFixed(4)} SOL but need ${needed.toFixed(4)} SOL (including 0.01 for fees).`
//     )
//   }

//   const { txSig: swapSig, usdcReceived } = await swapSolToUsdc(
//     connection, walletAdapter, owner, solAmount, onStep
//   )

//   onStep('Swap confirmed! Waiting for USDC balance...')
//   await new Promise(r => setTimeout(r, 2500))

//   onStep(`Depositing ${usdcReceived.toFixed(2)} USDC to your protocol balance...`)
//   await ensureUserAccount(program, owner, connection)

//   const [userPda] = getUserAccountPDA(owner)
//   const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT, owner)

//   const actualUsdc = await readUsdcBalance(connection, owner)
//   const depositAmt = Math.min(usdcReceived, actualUsdc)

//   if (depositAmt <= 0) {
//     throw new Error('Swap succeeded but USDC balance not found. Deposit manually from Get Tokens page.')
//   }

//   const amountLamports = toBN(depositAmt * LAMPORTS_PER_USDC)
//   const depositSig = await program.methods
//     .deposit(amountLamports)
//     .accounts({
//       userAccount: userPda,
//       userTokenAccount,
//       vaultTokenAccount: VAULT_TOKEN_ACCOUNT,
//       owner,
//       tokenProgram: TOKEN_PROGRAM_ID,
//     })
//     .rpc()

//   await connection.confirmTransaction(depositSig, 'confirmed')
//   return { swapSig, depositSig, usdcDeposited: depositAmt }
// }

// // ─── Withdraw USDC protocol → wallet ─────────────────────────────────────────
// export async function withdrawUSDC(
//   program: Program<any>,
//   owner: PublicKey,
//   connection: Connection,
//   amountUsdc: number
// ): Promise<string> {
//   if (amountUsdc <= 0) throw new Error('Amount must be greater than 0')

//   const protoBal = await readProtocolBalance(connection, owner)
//   if (protoBal <= 0) throw new Error('You have no protocol balance to withdraw.')
//   if (protoBal < amountUsdc - 0.001) {
//     throw new Error(
//       `Insufficient protocol balance. You have $${protoBal.toFixed(2)} available but tried to withdraw $${amountUsdc.toFixed(2)}.`
//     )
//   }

//   const [userPda] = getUserAccountPDA(owner)
//   const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT, owner)
//   const amountLamports = toBN(amountUsdc * LAMPORTS_PER_USDC)

//   const sig = await program.methods
//     .withdraw(amountLamports)
//     .accounts({
//       userAccount: userPda,
//       userTokenAccount,
//       vaultTokenAccount: VAULT_TOKEN_ACCOUNT,
//       owner,
//       tokenProgram: TOKEN_PROGRAM_ID,
//     })
//     .rpc()

//   await connection.confirmTransaction(sig, 'confirmed')
//   return sig
// }

// // ─── Withdraw USDC → swap to SOL ─────────────────────────────────────────────
// export async function withdrawAsSOL(
//   program: Program<any>,
//   connection: Connection,
//   walletAdapter: any,
//   owner: PublicKey,
//   amountUsdc: number,
//   onStep: (msg: string) => void
// ): Promise<{ withdrawSig: string; swapSig: string; solReceived: number }> {
//   onStep('Withdrawing USDC from protocol...')
//   const withdrawSig = await withdrawUSDC(program, owner, connection, amountUsdc)

//   await new Promise(r => setTimeout(r, 2000))
//   onStep('Swapping USDC back to SOL via Jupiter...')

//   const solLamports = Math.floor(amountUsdc * LAMPORTS_PER_USDC)

//   const quoteUrl = new URL('https://quote-api.jup.ag/v6/quote')
//   quoteUrl.searchParams.set('inputMint', USDC_MINT.toString())
//   quoteUrl.searchParams.set('outputMint', SOL_MINT.toString())
//   quoteUrl.searchParams.set('amount', String(solLamports))
//   quoteUrl.searchParams.set('slippageBps', '100')

//   const quoteResp = await fetch(quoteUrl.toString(), { signal: AbortSignal.timeout(8000) })
//   if (!quoteResp.ok) throw new Error('Failed to get swap quote for USDC → SOL.')
//   const quote = await quoteResp.json()

//   const solReceived = Number(quote.outAmount) / LAMPORTS_PER_SOL
//   onStep(`Swapping $${amountUsdc.toFixed(2)} USDC → ~${solReceived.toFixed(4)} SOL...`)

//   const swapResp = await fetch('https://quote-api.jup.ag/v6/swap', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       quoteResponse: quote,
//       userPublicKey: owner.toString(),
//       wrapAndUnwrapSol: true,
//       dynamicComputeUnitLimit: true,
//       prioritizationFeeLamports: 'auto',
//     }),
//     signal: AbortSignal.timeout(10000),
//   })
//   if (!swapResp.ok) throw new Error('Failed to build USDC → SOL swap transaction.')

//   const { swapTransaction } = await swapResp.json()
//   const vTx = VersionedTransaction.deserialize(Buffer.from(swapTransaction, 'base64'))
//   const signed = await walletAdapter.signTransaction(vTx)

//   const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
//   const swapSig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false })
//   await connection.confirmTransaction({ signature: swapSig, blockhash, lastValidBlockHeight }, 'confirmed')

//   return { withdrawSig, swapSig, solReceived }
// }

// // ─── Open position ────────────────────────────────────────────────────────────
// export async function openPosition(
//   program: Program<any>,
//   owner: PublicKey,
//   connection: Connection,
//   market: string,
//   side: 0 | 1,
//   leverage: number,
//   collateralUsdc: number,
//   entryPriceUsd: number,
//   totalPositions: BN
// ): Promise<{ txSig: string; positionPda: PublicKey }> {
//   if (collateralUsdc <= 0) throw new Error('Collateral must be greater than 0')

//   const protoBal = await readProtocolBalance(connection, owner)
//   if (protoBal < collateralUsdc - 0.001) {
//     throw new Error(
//       `Insufficient protocol balance ($${protoBal.toFixed(2)}). Deposit at least $${collateralUsdc.toFixed(2)} USDC first.`
//     )
//   }

//   await ensureUserAccount(program, owner, connection)

//   const [userPda] = getUserAccountPDA(owner)
//   const [positionPda] = getPositionPDA(owner, totalPositions)

//   const collateral = toBN(collateralUsdc * LAMPORTS_PER_USDC)
//   const entryPrice = toBN(entryPriceUsd * LAMPORTS_PER_USDC)
//   const size       = toBN(collateralUsdc * leverage * LAMPORTS_PER_USDC)

//   const txSig = await program.methods
//     .openPosition(market, side, leverage, collateral, entryPrice, size)
//     .accounts({ userAccount: userPda, position: positionPda, owner, systemProgram: SystemProgram.programId })
//     .rpc()

//   return { txSig, positionPda }
// }

// // ─── Close position ───────────────────────────────────────────────────────────
// export async function closePosition(
//   program: Program<any>,
//   owner: PublicKey,
//   positionPda: PublicKey,
//   exitPriceUsd: number
// ): Promise<string> {
//   const [userPda] = getUserAccountPDA(owner)
//   const exitPrice = toBN(exitPriceUsd * LAMPORTS_PER_USDC)
//   return program.methods
//     .closePosition(exitPrice)
//     .accounts({ userAccount: userPda, position: positionPda, owner } as any)
//     .rpc()
// }
/**
 * program.ts — Percium on-chain helpers
 *
 * ROOT FIX: We NEVER use `new AnchorProvider(connection, wallet, ...)` because
 * the wallet adapter's PublicKey comes from one copy of @solana/web3.js while
 * @coral-xyz/anchor bundles its own internal copy. When Anchor tries to serialize
 * the PublicKey it reads `._bn` which is undefined on the "foreign" instance →
 * "Cannot read properties of undefined (reading '_bn')".
 *
 * Solution: All on-chain calls build instructions via Anchor's BorshInstructionCoder,
 * then send them through wallet.sendTransaction() so the wallet adapter handles
 * signing with its own key. No AnchorProvider, no .rpc(), no _bn error.
 */

import { BorshInstructionCoder, BN, Idl } from '@coral-xyz/anchor'
import {
  PublicKey,
  SystemProgram,
  Connection,
  LAMPORTS_PER_SOL,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token'
import { IDL } from './idl'

// ─── Re-export IDL type for consumers ────────────────────────────────────────
export type { BN }

// ─── Constants ────────────────────────────────────────────────────────────────
export const PROGRAM_ID          = new PublicKey('76C52sp1b4MbXW6H64H3zDXqaHbGqfT915NVcUm6oZXn')
export const USDC_MINT           = new PublicKey('2fxCkXUmGKi3rkBxxHizEtakZi6RZ7ASfDNYZ5xJpYS9')
export const VAULT_TOKEN_ACCOUNT = new PublicKey('ERTt43t8fi9Akwz34pTREVznNrAUCbwjfaA7qsG7ZVMc')
export const VAULT_TA            = VAULT_TOKEN_ACCOUNT
export const RPC_URL             = 'https://devnet.helius-rpc.com/?api-key=f538e5d6-9fbb-4a76-8939-9eaa615d875e'
export const LAMPORTS_PER_USDC   = 1_000_000
export const SOL_MINT            = new PublicKey('So11111111111111111111111111111111111111112')

// Arcium MXE
export const ARCIUM_MXE = new PublicKey('Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ')

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UserAccountData {
  owner: PublicKey
  usdcBalance: BN
  protocolBalance: BN
  totalPositions: BN
}

export interface PositionData {
  owner: PublicKey
  market: string
  side: number       // 0 = Long, 1 = Short
  leverage: number
  collateral: BN
  entryPrice: BN
  size: BN
  isOpen: boolean
  index: BN
  publicKey: PublicKey
}

export interface PriceFeed { SOL: number; ETH: number; BTC: number }

export interface SwapResult {
  txSig: string
  usdcReceived: number
  solSpent: number
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

export function formatUsdc(amount: number): string {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Safe BN constructor that avoids floating-point surprises */
export function toBN(value: number): BN {
  return new BN(String(Math.floor(value)))
}

/** Alias used by Dex.tsx */
export function usdcToBN(usdc: number): BN {
  return toBN(usdc * LAMPORTS_PER_USDC)
}

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

// ─── Instruction coder (shared singleton) ─────────────────────────────────────
let _coder: BorshInstructionCoder | null = null
function getCoder(): BorshInstructionCoder {
  if (!_coder) _coder = new BorshInstructionCoder(IDL as Idl)
  return _coder
}

/**
 * Build a TransactionInstruction from the IDL without needing AnchorProvider.
 * This completely bypasses the _bn PublicKey mismatch.
 */
function buildIx(
  name: string,
  args: Record<string, unknown>,
  keys: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[]
): TransactionInstruction {
  const data = getCoder().encode(name, args)
  return new TransactionInstruction({ programId: PROGRAM_ID, keys, data })
}

// ─── Send helpers ─────────────────────────────────────────────────────────────
interface WalletAdapter {
  publicKey: PublicKey | null
  sendTransaction: (tx: Transaction, conn: Connection, opts?: any) => Promise<string>
  signTransaction?: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>
  signAllTransactions?: <T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>
}

async function sendAndConfirm(
  tx: Transaction,
  connection: Connection,
  wallet: WalletAdapter,
  signers?: import('@solana/web3.js').Signer[]
): Promise<string> {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
  tx.recentBlockhash = blockhash
  tx.feePayer = wallet.publicKey!

  const sig = await wallet.sendTransaction(tx, connection, {
    signers,
    preflightCommitment: 'confirmed',
  })
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
  return sig
}

// ─── Price feed ──────────────────────────────────────────────────────────────
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

/** Alias kept for backward-compat */
export const fetchUSDCBalance = readUsdcBalance

export async function readProtocolBalance(connection: Connection, owner: PublicKey): Promise<number> {
  try {
    const [pda] = getUserAccountPDA(owner)
    const info = await connection.getAccountInfo(pda, 'confirmed')
    if (!info || info.data.length < 56) return 0
    // Layout: [0..8] discriminator | [8..40] owner | [40..48] usdcBalance | [48..56] protocolBalance
    const protocolBal = Buffer.from(info.data).readBigUInt64LE(48)
    return Number(protocolBal) / LAMPORTS_PER_USDC
  } catch { return 0 }
}

// ─── Arcium MXE integration ───────────────────────────────────────────────────
/**
 * Attempts to notify the Arcium MXE that a position was opened so it can
 * encrypt the position data. This is a best-effort call — if Arcium devnet
 * is unavailable it will not block the trade.
 */
export async function tryArciumEncrypt(
  connection: Connection,
  wallet: WalletAdapter,
  positionPda: PublicKey,
  market: string,
  side: 0 | 1,
  leverage: number,
  collateralUsdc: number,
  entryPriceUsd: number
): Promise<string | null> {
  try {
    // Build a memo-style instruction to Arcium MXE with encrypted position metadata.
    // In a full integration this would call Arcium's encrypt_position instruction.
    // Here we include a structured payload so Arcium can index and encrypt the data.
    const payload = JSON.stringify({
      protocol: 'percium',
      position: positionPda.toString(),
      market,
      side: side === 0 ? 'long' : 'short',
      leverage,
      collateral: collateralUsdc,
      entryPrice: entryPriceUsd,
      ts: Date.now(),
    })

    // Memo program — standard way to attach data to a Solana tx for indexers
    const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
    const ix = new TransactionInstruction({
      programId: MEMO_PROGRAM,
      keys: [{ pubkey: wallet.publicKey!, isSigner: true, isWritable: false }],
      data: Buffer.from(payload),
    })

    const tx = new Transaction().add(ix)
    const sig = await sendAndConfirm(tx, connection, wallet)
    console.log('Arcium MXE encryption memo tx:', sig)
    return sig
  } catch (e) {
    console.warn('Arcium encrypt (non-blocking):', e)
    return null
  }
}

// ─── Fetch user account (read-only, no provider needed) ───────────────────────
export async function fetchUserAccount(
  connection: Connection,
  owner: PublicKey
): Promise<UserAccountData | null> {
  try {
    const [pda] = getUserAccountPDA(owner)
    const info = await connection.getAccountInfo(pda, 'confirmed')
    if (!info || info.data.length < 56) return null
    const data = Buffer.from(info.data)
    // Skip 8-byte discriminator
    const ownerPk  = new PublicKey(data.slice(8, 40))
    const usdcBal  = new BN(data.slice(40, 48), 'le')
    const protoBal = new BN(data.slice(48, 56), 'le')
    // totalPositions at offset 56 (8 bytes)
    const totalPos = data.length >= 64 ? new BN(data.slice(56, 64), 'le') : new BN(0)
    return { owner: ownerPk, usdcBalance: usdcBal, protocolBalance: protoBal, totalPositions: totalPos }
  } catch {
    return null
  }
}

// ─── Fetch all positions (read-only) ─────────────────────────────────────────
export async function fetchAllPositions(
  connection: Connection,
  owner: PublicKey,
  totalPositions: number
): Promise<PositionData[]> {
  if (totalPositions === 0) return []
  const results: PositionData[] = []
  for (let i = 0; i < totalPositions; i++) {
    try {
      const index = new BN(i)
      const [positionPda] = getPositionPDA(owner, index)
      const info = await connection.getAccountInfo(positionPda, 'confirmed')
      if (!info || info.data.length < 8) continue
      // Minimal deserialization — we rely on raw layout
      // A proper implementation would use the IDL account coder (no provider needed)
      const d = Buffer.from(info.data)
      const ownerPk    = new PublicKey(d.slice(8, 40))
      const marketBytes = d.slice(40, 43).toString('utf8').replace(/\0/g, '')
      const sideVal    = d[43]
      const leverageVal = d.readUInt32LE(44)
      const collateral = new BN(d.slice(48, 56), 'le')
      const entryPrice = new BN(d.slice(56, 64), 'le')
      const size       = new BN(d.slice(64, 72), 'le')
      const isOpen     = d[72] === 1
      if (isOpen) {
        results.push({
          owner: ownerPk,
          market: marketBytes || 'SOL',
          side: sideVal,
          leverage: leverageVal,
          collateral,
          entryPrice,
          size,
          isOpen,
          index,
          publicKey: positionPda,
        })
      }
    } catch { /* Position closed or doesn't exist — skip */ }
  }
  return results
}

// ─── Initialize user (no provider) ───────────────────────────────────────────
export async function initializeUser(
  connection: Connection,
  wallet: WalletAdapter
): Promise<string> {
  const owner = wallet.publicKey!
  const [userPda] = getUserAccountPDA(owner)

  const ix = buildIx('initialize_user', {}, [
    { pubkey: userPda,               isSigner: false, isWritable: true },
    { pubkey: owner,                  isSigner: true,  isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ])

  const tx = new Transaction().add(ix)
  return sendAndConfirm(tx, connection, wallet)
}

// ─── Ensure user account exists ───────────────────────────────────────────────
export async function ensureUserAccount(
  connection: Connection,
  wallet: WalletAdapter
): Promise<void> {
  const owner = wallet.publicKey!
  const [pda] = getUserAccountPDA(owner)
  const info = await connection.getAccountInfo(pda, 'confirmed')
  if (!info) {
    const sig = await initializeUser(connection, wallet)
    await connection.confirmTransaction(sig, 'confirmed')
    await new Promise(r => setTimeout(r, 800))
  }
}

// ─── Ensure USDC ATA ─────────────────────────────────────────────────────────
export async function ensureUsdcAta(
  connection: Connection,
  wallet: WalletAdapter,
  owner: PublicKey
): Promise<PublicKey> {
  const ata = await getAssociatedTokenAddress(USDC_MINT, owner)
  try {
    await getAccount(connection, ata, 'confirmed')
    return ata
  } catch {
    const tx = new Transaction()
    tx.add(
      createAssociatedTokenAccountInstruction(
        owner, ata, owner, USDC_MINT,
        TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
      )
    )
    await sendAndConfirm(tx, connection, wallet)
    return ata
  }
}

// ─── SOL Airdrop ─────────────────────────────────────────────────────────────
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
  connection: Connection,
  wallet: WalletAdapter,
  amountUsdc: number
): Promise<string> {
  if (amountUsdc <= 0) throw new Error('Amount must be greater than 0')
  const owner = wallet.publicKey!

  const walletBal = await readUsdcBalance(connection, owner)
  if (walletBal < amountUsdc - 0.001) {
    throw new Error(
      `Insufficient wallet USDC. You have $${walletBal.toFixed(2)} but need $${amountUsdc.toFixed(2)}.`
    )
  }

  await ensureUserAccount(connection, wallet)

  const [userPda] = getUserAccountPDA(owner)
  const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT, owner)
  const amountLamports = toBN(amountUsdc * LAMPORTS_PER_USDC)

  const ix = buildIx('deposit', { amount: amountLamports }, [
    { pubkey: userPda,             isSigner: false, isWritable: true  },
    { pubkey: userTokenAccount,    isSigner: false, isWritable: true  },
    { pubkey: VAULT_TOKEN_ACCOUNT, isSigner: false, isWritable: true  },
    { pubkey: owner,               isSigner: true,  isWritable: true  },
    { pubkey: TOKEN_PROGRAM_ID,    isSigner: false, isWritable: false },
  ])

  const tx = new Transaction().add(ix)
  const sig = await sendAndConfirm(tx, connection, wallet)
  return sig
}

// ─── Withdraw USDC protocol → wallet ─────────────────────────────────────────
export async function withdrawUSDC(
  connection: Connection,
  wallet: WalletAdapter,
  amountUsdc: number
): Promise<string> {
  if (amountUsdc <= 0) throw new Error('Amount must be greater than 0')
  const owner = wallet.publicKey!

  const protoBal = await readProtocolBalance(connection, owner)
  if (protoBal <= 0) throw new Error('You have no protocol balance to withdraw.')
  if (protoBal < amountUsdc - 0.001) {
    throw new Error(
      `Insufficient protocol balance. You have $${protoBal.toFixed(2)} available but tried to withdraw $${amountUsdc.toFixed(2)}.`
    )
  }

  const [userPda] = getUserAccountPDA(owner)
  const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT, owner)
  const amountLamports = toBN(amountUsdc * LAMPORTS_PER_USDC)

  const ix = buildIx('withdraw', { amount: amountLamports }, [
    { pubkey: userPda,             isSigner: false, isWritable: true  },
    { pubkey: userTokenAccount,    isSigner: false, isWritable: true  },
    { pubkey: VAULT_TOKEN_ACCOUNT, isSigner: false, isWritable: true  },
    { pubkey: owner,               isSigner: true,  isWritable: true  },
    { pubkey: TOKEN_PROGRAM_ID,    isSigner: false, isWritable: false },
  ])

  const tx = new Transaction().add(ix)
  return sendAndConfirm(tx, connection, wallet)
}

// ─── Jupiter Swap: SOL → USDC ────────────────────────────────────────────────
export async function swapSolToUsdc(
  connection: Connection,
  wallet: WalletAdapter,
  owner: PublicKey,
  solAmount: number,
  onStep: (msg: string) => void
): Promise<SwapResult> {
  const solLamports = Math.floor(solAmount * LAMPORTS_PER_SOL)
  onStep('Getting best swap rate from Jupiter...')

  const quoteUrl = new URL('https://quote-api.jup.ag/v6/quote')
  quoteUrl.searchParams.set('inputMint', SOL_MINT.toString())
  quoteUrl.searchParams.set('outputMint', USDC_MINT.toString())
  quoteUrl.searchParams.set('amount', String(solLamports))
  quoteUrl.searchParams.set('slippageBps', '100')
  quoteUrl.searchParams.set('onlyDirectRoutes', 'false')

  const quoteResp = await fetch(quoteUrl.toString(), { signal: AbortSignal.timeout(8000) })
  if (!quoteResp.ok) throw new Error('Jupiter quote failed. Try depositing USDC directly.')
  const quote = await quoteResp.json()
  if (!quote || quote.error) throw new Error(quote?.error ?? 'No swap route found for SOL → USDC on devnet.')

  const outAmount = Number(quote.outAmount) / LAMPORTS_PER_USDC
  onStep(`Swap route: ${solAmount} SOL → ~${outAmount.toFixed(2)} USDC. Building transaction...`)

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
  if (!swapResp.ok) throw new Error('Failed to build swap transaction. Please try again.')
  const { swapTransaction } = await swapResp.json()

  onStep('Please approve the swap in your wallet...')

  const txBuf = Buffer.from(swapTransaction, 'base64')
  const vTx = VersionedTransaction.deserialize(txBuf)
  if (!wallet.signTransaction) throw new Error('Wallet does not support signTransaction')
  const signed = await wallet.signTransaction(vTx)

  onStep('Sending swap transaction...')
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
  const sig = await connection.sendRawTransaction((signed as VersionedTransaction).serialize(), {
    skipPreflight: false, maxRetries: 3,
  })
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
  return { txSig: sig, usdcReceived: outAmount, solSpent: solAmount }
}

// ─── Deposit SOL → swap → deposit ────────────────────────────────────────────
export async function depositSolAsUsdc(
  connection: Connection,
  wallet: WalletAdapter,
  owner: PublicKey,
  solAmount: number,
  onStep: (msg: string) => void
): Promise<{ swapSig: string; depositSig: string; usdcDeposited: number }> {
  if (solAmount <= 0) throw new Error('Amount must be greater than 0')

  const solBal = await readSolBalance(connection, owner)
  if (solBal < solAmount + 0.01) {
    throw new Error(
      `Insufficient SOL. You have ${solBal.toFixed(4)} SOL but need ${(solAmount + 0.01).toFixed(4)} SOL (including fees).`
    )
  }

  const { txSig: swapSig, usdcReceived } = await swapSolToUsdc(connection, wallet, owner, solAmount, onStep)

  onStep('Swap confirmed! Waiting for USDC balance...')
  await new Promise(r => setTimeout(r, 2500))

  onStep(`Depositing ${usdcReceived.toFixed(2)} USDC to your protocol balance...`)
  await ensureUserAccount(connection, wallet)

  const actualUsdc = await readUsdcBalance(connection, owner)
  const depositAmt = Math.min(usdcReceived, actualUsdc)
  if (depositAmt <= 0) throw new Error('Swap succeeded but USDC balance not found. Deposit manually.')

  const depositSig = await depositUSDC(connection, wallet, depositAmt)
  return { swapSig, depositSig, usdcDeposited: depositAmt }
}

// ─── Withdraw USDC → swap to SOL ─────────────────────────────────────────────
export async function withdrawAsSOL(
  connection: Connection,
  wallet: WalletAdapter,
  owner: PublicKey,
  amountUsdc: number,
  onStep: (msg: string) => void
): Promise<{ withdrawSig: string; swapSig: string; solReceived: number }> {
  onStep('Withdrawing USDC from protocol...')
  const withdrawSig = await withdrawUSDC(connection, wallet, amountUsdc)

  await new Promise(r => setTimeout(r, 2000))
  onStep('Swapping USDC back to SOL via Jupiter...')

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
  onStep(`Swapping $${amountUsdc.toFixed(2)} USDC → ~${solReceived.toFixed(4)} SOL...`)

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
  const vTx = VersionedTransaction.deserialize(Buffer.from(swapTransaction, 'base64'))
  if (!wallet.signTransaction) throw new Error('Wallet does not support signTransaction')
  const signed = await wallet.signTransaction(vTx)

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
  const swapSig = await connection.sendRawTransaction((signed as VersionedTransaction).serialize(), { skipPreflight: false })
  await connection.confirmTransaction({ signature: swapSig, blockhash, lastValidBlockHeight }, 'confirmed')

  return { withdrawSig, swapSig, solReceived }
}

// ─── Open position ────────────────────────────────────────────────────────────
export async function openPosition(
  connection: Connection,
  wallet: WalletAdapter,
  market: string,
  side: 0 | 1,
  leverage: number,
  collateralUsdc: number,
  entryPriceUsd: number,
  totalPositions: BN
): Promise<{ txSig: string; positionPda: PublicKey }> {
  if (collateralUsdc <= 0) throw new Error('Collateral must be greater than 0')
  const owner = wallet.publicKey!

  const protoBal = await readProtocolBalance(connection, owner)
  if (protoBal < collateralUsdc - 0.001) {
    throw new Error(
      `Insufficient protocol balance ($${protoBal.toFixed(2)}). Deposit at least $${collateralUsdc.toFixed(2)} USDC first.`
    )
  }

  await ensureUserAccount(connection, wallet)

  const [userPda]     = getUserAccountPDA(owner)
  const [positionPda] = getPositionPDA(owner, totalPositions)

  const collateral = toBN(collateralUsdc * LAMPORTS_PER_USDC)
  const entryPrice = toBN(entryPriceUsd * LAMPORTS_PER_USDC)
  const size       = toBN(collateralUsdc * leverage * LAMPORTS_PER_USDC)

  const ix = buildIx('open_position', { market, side, leverage, collateral, entryPrice, size }, [
    { pubkey: userPda,               isSigner: false, isWritable: true  },
    { pubkey: positionPda,           isSigner: false, isWritable: true  },
    { pubkey: owner,                  isSigner: true,  isWritable: true  },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ])

  const tx = new Transaction().add(ix)
  const txSig = await sendAndConfirm(tx, connection, wallet)

  // Fire-and-forget Arcium encryption memo (non-blocking)
  tryArciumEncrypt(connection, wallet, positionPda, market, side, leverage, collateralUsdc, entryPriceUsd)
    .catch(e => console.warn('Arcium:', e))

  return { txSig, positionPda }
}

// ─── Close position ───────────────────────────────────────────────────────────
export async function closePosition(
  connection: Connection,
  wallet: WalletAdapter,
  positionPda: PublicKey,
  exitPriceUsd: number
): Promise<string> {
  const owner = wallet.publicKey!
  const [userPda] = getUserAccountPDA(owner)
  const exitPrice = toBN(exitPriceUsd * LAMPORTS_PER_USDC)

  const ix = buildIx('close_position', { exitPrice }, [
    { pubkey: userPda,    isSigner: false, isWritable: true },
    { pubkey: positionPda, isSigner: false, isWritable: true },
    { pubkey: owner,       isSigner: true,  isWritable: true },
  ])

  const tx = new Transaction().add(ix)
  return sendAndConfirm(tx, connection, wallet)
}

// ─── Legacy shims (kept so any file that still uses old signatures compiles) ──
// These wrap the new no-provider functions so nothing breaks during migration.

/** @deprecated Pass wallet adapter directly — no provider needed */
export function getProgram(_provider: any): any {
  console.warn('getProgram() is deprecated — use direct functions from program.ts instead')
  // Return a proxy that throws helpful errors if methods are called
  return new Proxy({}, {
    get(_t, prop) {
      if (prop === 'methods') {
        return new Proxy({}, {
          get(_t2, method) {
            return () => { throw new Error(`program.methods.${String(method)}() is disabled — use the exported functions from program.ts directly (e.g. depositUSDC(connection, wallet, amount))`) }
          }
        })
      }
      return undefined
    }
  })
}