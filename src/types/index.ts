// Central export point for app types
// Import using: import { Token, SwapTransaction } from '@/types'

export * from './token'; // Token data structure
export * from './swap'; // Swap transaction history

// NOTE: For CDP SDK swap types, import directly from the SDK:
// import type { GetSwapPriceResult } from '@coinbase/cdp-sdk/client/evm/evm.types'
