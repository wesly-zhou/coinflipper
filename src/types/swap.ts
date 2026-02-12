import { Address, Hex } from './misc';

// Adapted from CDP SDK EVM types
// Docs: https://github.com/coinbase/cdp-sdk/blob/main/typescript/src/client/evm/evm.types.ts

/**
 * Options for getting a swap price.
 */
export interface GetSwapPriceOptions {
  /** The network to get a price from. */
  network: SupportedNetwork;
  /** The token to receive (destination token). */
  toToken: Address;
  /** The token to send (source token). */
  fromToken: Address;
  /** The amount to send in atomic units of the token. */
  fromAmount: bigint;
  /** The address that will perform the swap. */
  taker: Address;
  /** The signer address (only needed if taker is a smart contract). */
  signerAddress?: Address;
  /** The gas price in Wei. */
  gasPrice?: bigint;
  /** The slippage tolerance in basis points (0-10000). */
  slippageBps?: number;
}

/**
 * Result of getting a swap price.
 * All BigInt values are serialized as strings for JSON compatibility.
 */
export interface GetSwapPriceResult {
  /** Whether liquidity is available for the swap. */
  liquidityAvailable: true;
  /** The token to receive (destination token). */
  toToken: Address;
  /** The token to send (source token). */
  fromToken: Address;
  /** The amount to send in atomic units of the token (as string). */
  fromAmount: string;
  /** The amount to receive in atomic units of the token (as string). */
  toAmount: string;
  /** The minimum amount to receive after slippage in atomic units of the token (as string). */
  minToAmount: string;
  /** The block number at which the liquidity conditions were examined (as string). */
  blockNumber: string;
  /** The estimated fees for the swap. */
  fees: SwapFees;
  /** Potential issues discovered during validation. */
  issues: SwapIssues;
  /** The gas estimate for the swap (as string). */
  gas?: string;
  /** The gas price in Wei (as string). */
  gasPrice?: string;
}

/**
 * Options for creating a swap quote between two tokens on an EVM network.
 */
export interface CreateSwapQuoteOptions {
  /** The network to create a swap quote on. */
  network: SupportedNetwork;
  /** The token to receive (destination token). */
  toToken: Address;
  /** The token to send (source token). */
  fromToken: Address;
  /** The amount to send in atomic units of the token. */
  fromAmount: bigint;
  /** The address receiving the output of the swap. */
  taker: Address;
  /** The address signing the swap (only needed if taker is a smart contract, i.e. for smart account swaps). */
  signerAddress?: Address;
  /** The price per unit of gas in wei. */
  gasPrice?: bigint;
  /** The slippage tolerance in basis points (0-10000). */
  slippageBps?: number;
}

/**
 * Options for executing a swap quote.
 */
export interface ExecuteSwapQuoteOptions {
  /** Optional idempotency key for the request. */
  idempotencyKey?: string;
}

/**
 * Result of executing a swap quote.
 */
export interface ExecuteSwapQuoteResult {
  /** The transaction hash of the executed swap (for EOA swaps). */
  transactionHash?: Hex;
  /** The user operation hash of the executed swap (for smart account swaps). */
  userOpHash?: Hex;
  /** The address of the smart account (for smart account swaps). */
  smartAccountAddress?: Address;
}

/**
 * Result of creating a swap quote.
 * All BigInt values are serialized as strings for JSON compatibility.
 */
export interface CreateSwapQuoteResult {
  /** Whether liquidity is available for the swap. */
  liquidityAvailable: true;
  /** The network for which this swap quote was created. */
  network: SupportedNetwork;
  /** The token to receive (destination token). */
  toToken: Address;
  /** The token to send (source token). */
  fromToken: Address;
  /** The amount to send in atomic units of the token (as string). */
  fromAmount: string;
  /** The amount to receive in atomic units of the token (as string). */
  toAmount: string;
  /** The minimum amount to receive after slippage in atomic units of the token (as string). */
  minToAmount: string;
  /** The block number at which the liquidity conditions were examined (as string). */
  blockNumber: string;
  /** The estimated fees for the swap. */
  fees: SwapFees;
  /** Potential issues discovered during validation. */
  issues: SwapIssues;
  /** The transaction to execute the swap. */
  transaction?: {
    /** The contract address to send the transaction to. */
    to: Address;
    /** The transaction data. */
    data: Hex;
    /** The value to send with the transaction in Wei (as string). */
    value: string;
    /** The gas limit for the transaction (as string). */
    gas: string;
    /** The gas price for the transaction in Wei (as string). */
    gasPrice: string;
  };
  /** Permit2 data if required for the swap. */
  permit2?: {
    /** EIP-712 typed data for signing. */
    eip712: any;
  };
  /**
   * Execute the swap using the quote.
   *
   * @param {ExecuteSwapQuoteOptions} options - Options for executing the swap.
   * @returns {Promise<ExecuteSwapQuoteResult>} A promise that resolves to the swap execution result.
   */
  execute: (options?: ExecuteSwapQuoteOptions) => Promise<ExecuteSwapQuoteResult>;
}

/**
 * A fee in a specific token.
 * BigInt values are serialized as strings for JSON compatibility.
 */
export interface TokenFee {
  /** The amount of the fee in atomic units of the token (as string). */
  amount: string;
  /** The contract address of the token that the fee is paid in. */
  token: Address;
}

/**
 * The estimated fees for a swap.
 */
export interface SwapFees {
  /** The estimated gas fee for the swap. */
  gasFee?: TokenFee;
  /** The estimated protocol fee for the swap. */
  protocolFee?: TokenFee;
}

/**
 * Details of allowance issues for a swap.
 * BigInt values are serialized as strings for JSON compatibility.
 */
export interface SwapAllowanceIssue {
  /** The current allowance of the fromToken by the taker (as string). */
  currentAllowance: string;
  /** The address to set the allowance on. */
  spender: Address;
}

/**
 * Details of balance issues for a swap.
 * BigInt values are serialized as strings for JSON compatibility.
 */
export interface SwapBalanceIssue {
  /** The contract address of the token. */
  token: Address;
  /** The current balance of the fromToken by the taker (as string). */
  currentBalance: string;
  /** The amount of the token that the taker must hold (as string). */
  requiredBalance: string;
}

/**
 * Potential issues discovered during swap validation.
 */
export interface SwapIssues {
  /** Details of the allowances that the taker must set. Null if no allowance is required. */
  allowance?: SwapAllowanceIssue;
  /** Details of the balance of the fromToken that the taker must hold. Null if sufficient balance. */
  balance?: SwapBalanceIssue;
  /** True when the transaction cannot be validated (e.g., insufficient balance). */
  simulationIncomplete: boolean;
}

/**
 * Serializable version of CreateSwapQuoteResult for API responses.
 * Excludes the `execute` method (cannot be serialized to JSON).
 */
export type SwapQuoteResponse = Omit<CreateSwapQuoteResult, 'execute'>;

// Transaction history tracking (not from CDP SDK)
export interface SwapTransaction {
  id: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  txHash?: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  network: 'base' | 'ethereum';
}

export type SupportedNetwork = 'base' | 'ethereum';
