
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildArciumClient = buildArciumClient;
exports.initAllCompDefs = initAllCompDefs;
exports.encryptPosition = encryptPosition;
exports.computeLiquidation = computeLiquidation;
exports.computePnL = computePnL;
const anchor = __importStar(require("@coral-xyz/anchor"));
const client_1 = require("@arcium-hq/client");
const mpc_sdk_1 = require("@arcium-hq/mpc-sdk");
const crypto_1 = require("crypto");
/**
setup
 * @param provider  Anchor provider (pre-configured with wallet + connection)
 * @param programId Your deployed arcium-perp program ID
 */
async function buildArciumClient(provider, programId) {
    const env = (0, client_1.getArciumEnv)();
    const privateKey = mpc_sdk_1.x25519.utils.randomSecretKey();
    const publicKey = mpc_sdk_1.x25519.getPublicKey(privateKey);
    const mxePub = await (0, client_1.getMXEPublicKeyWithRetry)(provider, programId);
    const shared = mpc_sdk_1.x25519.getSharedSecret(privateKey, mxePub);
    const cipher = new mpc_sdk_1.RescueCipher(shared);
    return { env, privateKey, publicKey, cipher };
}
function awaitProgramEvent(
program, eventName) {
    return new Promise((resolve) => {
        const id = program.addEventListener(eventName, (event, _slot, _signature) => {
            program.removeEventListener(id);
            resolve(event);
        });
    });
}
function arciumQueueAccounts(
env, programId, computationOffset, ixName) {
    return {
        computationAccount: (0, client_1.getComputationAccAddress)(env.arciumClusterOffset, computationOffset),
        clusterAccount: (0, client_1.getClusterAccAddress)(env.arciumClusterOffset),
        mxeAccount: (0, client_1.getMXEAccAddress)(programId),
        mempoolAccount: (0, client_1.getMempoolAccAddress)(env.arciumClusterOffset),
        executingPool: (0, client_1.getExecutingPoolAccAddress)(env.arciumClusterOffset),
        compDefAccount: (0, client_1.getCompDefAccAddress)(programId, Buffer.from((0, client_1.getCompDefAccOffset)(ixName)).readUInt32LE()),
    };
}

async function initAllCompDefs(
program, payer, env) {
    const programId = program.programId;
    const mxeAccount = (0, client_1.getMXEAccAddress)(programId);
    for (const ixPair of [
        { method: "initEncryptPositionCompDef", name: "encrypt_position" },
        { method: "initComputeLiquidationCompDef", name: "compute_liquidation" },
        { method: "initComputePnlCompDef", name: "compute_pnl" },
    ]) {
        try {
            const compDefAccount = (0, client_1.getCompDefAccAddress)(programId, Buffer.from((0, client_1.getCompDefAccOffset)(ixPair.name)).readUInt32LE());
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await program.methods[ixPair.method]()
                .accountsPartial({ payer: payer.publicKey, compDefAccount, mxeAccount })
                .signers([payer])
                .rpc({ commitment: "confirmed" });
            console.log(`[arcium] CompDef '${ixPair.name}' initialised`);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes("already in use")) {
                console.log(`[arcium] CompDef '${ixPair.name}' already exists — skipping`);
            }
            else {
                throw e;
            }
        }
    }
}

// encryptingPosition
async function encryptPosition(
program, provider, client, positionPda, positionIndex, collateral, entryPrice) {
    const nonce = (0, crypto_1.randomBytes)(16);
    const nonceBN = new anchor.BN((0, mpc_sdk_1.deserializeLE)(nonce).toString());
    const plaintext = [collateral, entryPrice];
    const ciphertext = client.cipher.encrypt(plaintext, nonce);
    const computationOffset = new anchor.BN((0, crypto_1.randomBytes)(8), "hex");
    const txSig = await program.methods
        .arciumEncryptPosition(computationOffset, Array.from(ciphertext[0]), Array.from(ciphertext[1]), Array.from(client.publicKey), nonceBN)
        .accountsPartial({
        payer: provider.wallet.publicKey,
        position: positionPda,
        ...arciumQueueAccounts(client.env, program.programId, computationOffset, "encrypt_position"),
    })
        .rpc({ skipPreflight: true, commitment: "confirmed" });
    console.log(`[arcium] encryptPosition queued: ${txSig}`);
    return { computationOffset, txSig };
}

//  computing liquidation price 
async function computeLiquidation(
program, provider, client, positionPda, entryPrice, leverage, side) {
    const nonce = (0, crypto_1.randomBytes)(16);
    const nonceBN = new anchor.BN((0, mpc_sdk_1.deserializeLE)(nonce).toString());
    const ciphertext = client.cipher.encrypt([entryPrice, BigInt(leverage)], nonce);
    const computationOffset = new anchor.BN((0, crypto_1.randomBytes)(8), "hex");
    const eventPromise = awaitProgramEvent(program, "liquidationComputedEvent");
    await program.methods
        .arciumComputeLiquidation(computationOffset, Array.from(ciphertext[0]), // enc_entry_price
    Array.from(ciphertext[1]), // enc_leverage
    side, Array.from(client.publicKey), nonceBN)
        .accountsPartial({
        payer: provider.wallet.publicKey,
        position: positionPda,
        ...arciumQueueAccounts(client.env, program.programId, computationOffset, "compute_liquidation"),
    })
        .rpc({ skipPreflight: true, commitment: "confirmed" });
    // Wait for MXE to finalise
    await (0, client_1.awaitComputationFinalization)(provider, computationOffset, program.programId, "confirmed");
    const event = await eventPromise;
    const resultNonce = new Uint8Array(event.nonce);
    const decrypted = client.cipher.decrypt([event.encLiquidationPrice], resultNonce);
    return {
        encLiquidationPrice: event.encLiquidationPrice,
        nonce: resultNonce,
        liquidationPrice: decrypted[0],
    };
}
/**
   computing pnl
 * @param encCollateral   32-byte ciphertext from PositionAccount
 * @param encEntryPrice   32-byte ciphertext from PositionAccount
 */
async function computePnL(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
program, provider, client, positionPda, encCollateral, encEntryPrice, exitPrice, leverage, side) {
    const nonce = (0, crypto_1.randomBytes)(16);
    const nonceBN = new anchor.BN((0, mpc_sdk_1.deserializeLE)(nonce).toString());
    const computationOffset = new anchor.BN((0, crypto_1.randomBytes)(8), "hex");
    const eventPromise = awaitProgramEvent(program, "pnlComputedEvent");
    await program.methods
        .arciumComputePnl(computationOffset, encCollateral, encEntryPrice, new anchor.BN(exitPrice.toString()), leverage, side, Array.from(client.publicKey), nonceBN)
        .accountsPartial({
        payer: provider.wallet.publicKey,
        position: positionPda,
        ...arciumQueueAccounts(client.env, program.programId, computationOffset, "compute_pnl"),
    })
        .rpc({ skipPreflight: true, commitment: "confirmed" });
    await (0, client_1.awaitComputationFinalization)(provider, computationOffset, program.programId, "confirmed");
    const event = await eventPromise;
    const resultNonce = new Uint8Array(event.nonce);
    const raw = client.cipher.decrypt([event.encPnl], resultNonce)[0];
    const pnl = BigInt.asIntN(64, raw);
    return {
        encPnl: event.encPnl,
        nonce: resultNonce,
        pnl,
    };
}
