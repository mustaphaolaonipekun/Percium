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

// // SOL mint address (native SOL wrapped)
// export const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112')

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

// // ─── Safe BN — always use integer strings, never floats ─────────────────────
// export function toBN(value: number): BN {
//   return new BN(String(Math.floor(value)))
// }

// // ─── Price feed ──────────────────────────────────────────────────────────────
// export interface PriceFeed { SOL: number; ETH: number; BTC: number }

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

// // ─── Ensure user account ─────────────────────────────────────────────────────
// export async function ensureUserAccount(
//   program: Program<any>,
//   owner: PublicKey,
//   connection: Connection
// ): Promise<void> {
//   const [pda] = getUserAccountPDA(owner)
//   const info = await connection.getAccountInfo(pda, 'confirmed')
//   if (!info) {
//     const sig = await program.methods
//       .initializeUser()
//       .accounts({ userAccount: pda, owner, systemProgram: SystemProgram.programId })
//       .rpc()
//     await connection.confirmTransaction(sig, 'confirmed')
//     await new Promise(r => setTimeout(r, 800))
//   }
// }

// // ─── Ensure USDC ATA exists (decodable by wallets) ─
// export async function ensureUsdcAta(
//   connection: Connection,
//   walletAdapter: any,  // full wallet adapter object
//   owner: PublicKey
// ): Promise<PublicKey> {
//   const ata = await getAssociatedTokenAddress(USDC_MINT, owner)
//   try {
//     await getAccount(connection, ata, 'confirmed')
//     return ata  // already exists
//   } catch {
//     // Create it — this is a STANDARD createAssociatedTokenAccount instruction
//     // that all wallets (Phantom, OKX, Solflare) can decode correctly
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
// // Uses Jupiter v6 API — fully decodable by all wallets, shows correct asset changes
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

//   // Step 1: Get quote from Jupiter
//   const quoteUrl = new URL('https://quote-api.jup.ag/v6/quote')
//   quoteUrl.searchParams.set('inputMint', SOL_MINT.toString())
//   quoteUrl.searchParams.set('outputMint', USDC_MINT.toString())
//   quoteUrl.searchParams.set('amount', String(solLamports))
//   quoteUrl.searchParams.set('slippageBps', '100')  // 1% slippage
//   quoteUrl.searchParams.set('onlyDirectRoutes', 'false')

//   const quoteResp = await fetch(quoteUrl.toString(), { signal: AbortSignal.timeout(8000) })
//   if (!quoteResp.ok) {
//     throw new Error('Jupiter quote failed. Jupiter may not support this devnet token pair. Try depositing USDC directly.')
//   }
//   const quote = await quoteResp.json()
//   if (!quote || quote.error) {
//     throw new Error(quote?.error ?? 'No swap route found for SOL → USDC on devnet.')
//   }

//   const outAmount = Number(quote.outAmount) / LAMPORTS_PER_USDC
//   onStep(`Swap route found: ${solAmount} SOL → ~${outAmount.toFixed(2)} USDC. Building transaction...`)

//   // Step 2: Get swap transaction from Jupiter
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

//   if (!swapResp.ok) {
//     throw new Error('Failed to build swap transaction. Please try again.')
//   }
//   const { swapTransaction } = await swapResp.json()

//   onStep('Please approve the swap in your wallet...')

//   // Step 3: Sign and send — Jupiter transactions are FULLY DECODABLE by all wallets
//   // The wallet will show "SOL → USDC" with correct amounts
//   const txBuf = Buffer.from(swapTransaction, 'base64')
//   const vTx = VersionedTransaction.deserialize(txBuf)

//   const signed = await walletAdapter.signTransaction(vTx)
//   const rawTx = signed.serialize()

//   onStep('Sending swap transaction...')
//   const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
//   const sig = await connection.sendRawTransaction(rawTx, {
//     skipPreflight: false,
//     maxRetries: 3,
//   })
//   await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')

//   return { txSig: sig, usdcReceived: outAmount, solSpent: solAmount }
// }

// // ─── SOL Airdrop (devnet only, no wallet signing needed) ─────────────────────
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
//       'Insufficient wallet USDC. You have $' + walletBal.toFixed(2) + ' but need $' + amountUsdc.toFixed(2) + '. Swap SOL to USDC first.'
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

// // ─── Deposit SOL → auto-swap to USDC → deposit to protocol ──────────────────
// // This is the "deposit with SOL" flow: swap SOL→USDC via Jupiter, then deposit
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
//   const needed = solAmount + 0.01  // reserve 0.01 SOL for fees
//   if (solBal < needed) {
//     throw new Error(
//       'Insufficient SOL. You have ' + solBal.toFixed(4) + ' SOL but need ' +
//       needed.toFixed(4) + ' SOL (including 0.01 for fees).'
//     )
//   }

//   // Step 1: Swap SOL → USDC via Jupiter
//   const { txSig: swapSig, usdcReceived } = await swapSolToUsdc(
//     connection, walletAdapter, owner, solAmount, onStep
//   )

//   // Wait for balance to update
//   onStep('Swap confirmed! Waiting for USDC balance...')
//   await new Promise(r => setTimeout(r, 2500))

//   // Step 2: Deposit the USDC received into protocol
//   onStep('Depositing ' + usdcReceived.toFixed(2) + ' USDC to your protocol balance...')
//   await ensureUserAccount(program, owner, connection)

//   const [userPda] = getUserAccountPDA(owner)
//   const userTokenAccount = await getAssociatedTokenAddress(USDC_MINT, owner)

//   // Read actual USDC balance after swap (may differ slightly from quote)
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

// // ─── Withdraw USDC protocol → wallet ────────────────────────────────────────
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
//       'Insufficient protocol balance. You have $' + protoBal.toFixed(2) +
//       ' available but tried to withdraw $' + amountUsdc.toFixed(2) + '.'
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

// // ─── Withdraw USDC protocol → wallet → swap to SOL ───────────────────────────
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

//   // Swap USDC → SOL
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
//   onStep('Swapping $' + amountUsdc.toFixed(2) + ' USDC → ~' + solReceived.toFixed(4) + ' SOL...')

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
//       'Insufficient protocol balance ($' + protoBal.toFixed(2) + '). ' +
//       'Deposit at least $' + collateralUsdc.toFixed(2) + ' USDC first.'
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
//     .accounts({ userAccount: userPda, position: positionPda, owner })
//     .rpc()
// }

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// export function bnToUsdc(bn: BN | null | undefined): number {
//   if (!bn) return 0
//   try { return bn.toNumber() / LAMPORTS_PER_USDC } catch { return 0 }
// }

// export function bnToPrice(bn: BN | null | undefined): number {
//   if (!bn) return 0
//   try { return bn.toNumber() / LAMPORTS_PER_USDC } catch { return 0 }
// }
