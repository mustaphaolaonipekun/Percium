export const IDL = {
  version: "0.1.0",
  name: "arcium_perp",
  instructions: [
    {
      name: "initializeUser",
      accounts: [
        { name: "userAccount", isMut: true, isSigner: false },
        { name: "owner", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "deposit",
      accounts: [
        { name: "userAccount", isMut: true, isSigner: false },
        { name: "userTokenAccount", isMut: true, isSigner: false },
        { name: "vaultTokenAccount", isMut: true, isSigner: false },
        { name: "owner", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
    {
      name: "withdraw",
      accounts: [
        { name: "userAccount", isMut: true, isSigner: false },
        { name: "userTokenAccount", isMut: true, isSigner: false },
        { name: "vaultTokenAccount", isMut: true, isSigner: false },
        { name: "owner", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
    {
      name: "openPosition",
      accounts: [
        { name: "userAccount", isMut: true, isSigner: false },
        { name: "position", isMut: true, isSigner: false },
        { name: "owner", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "market", type: "string" },
        { name: "side", type: "u8" },
        { name: "leverage", type: "u8" },
        { name: "collateral", type: "u64" },
        { name: "entryPrice", type: "u64" },
        { name: "size", type: "u64" },
      ],
    },
    {
      name: "closePosition",
      accounts: [
        { name: "userAccount", isMut: true, isSigner: false },
        { name: "position", isMut: true, isSigner: false },
        { name: "owner", isMut: true, isSigner: true },
      ],
      args: [{ name: "exitPrice", type: "u64" }],
    },
  ],
  accounts: [
    {
      name: "UserAccount",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "usdcBalance", type: "u64" },
          { name: "protocolBalance", type: "u64" },
          { name: "totalPositions", type: "u64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "PositionAccount",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "market", type: "string" },
          { name: "side", type: "u8" },
          { name: "leverage", type: "u8" },
          { name: "collateral", type: "u64" },
          { name: "entryPrice", type: "u64" },
          { name: "size", type: "u64" },
          { name: "liquidationPrice", type: "u64" },
          { name: "pnl", type: "i64" },
          { name: "status", type: "u8" },
          { name: "index", type: "u64" },
          { name: "bump", type: "u8" },
          { name: "encCollateral", type: { array: ["u8", 32] } },
          { name: "encEntryPrice", type: { array: ["u8", 32] } },
          { name: "encLiquidationPrice", type: { array: ["u8", 32] } },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "InsufficientBalance", msg: "Insufficient protocol balance" },
    { code: 6001, name: "PositionAlreadyClosed", msg: "Position already closed" },
    { code: 6002, name: "Unauthorized", msg: "Unauthorized" },
  ],
} as const;

export type PerciumIDL = typeof IDL;
