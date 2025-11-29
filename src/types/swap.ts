// Transaction history tracking (not from CDP SDK)
// This is for storing user's swap history in the database/state
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
