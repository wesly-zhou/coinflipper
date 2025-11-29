// Utility functions for formatting token amounts
// These help convert between user-friendly decimals and blockchain atomic units

/**
 * Calculate exchange rate from atomic amounts
 * @param fromAmount - Input token amount (atomic units as BigInt)
 * @param fromDecimals - Input token decimals
 * @param toAmount - Output token amount (atomic units as BigInt)
 * @param toDecimals - Output token decimals
 * @returns Exchange rate as a decimal number
 * @example calculateRate(BigInt("1000000000000000000"), BigInt("2543210000")) // 2543.21
 */
export function calculateRate(
    fromAmount: bigint,
    fromDecimals: number,
    toAmount: bigint,
    toDecimals: number
): number {
    // Convert to actual decimal values first
    const fromValue = Number(fromAmount) / Math.pow(10, fromDecimals);
    const toValue = Number(toAmount) / Math.pow(10, toDecimals);
    return toValue / fromValue;
}

/**
 * Convert user input to atomic units for blockchain
 * @param amount - User-friendly decimal string (e.g., "1.5")
 * @param decimals - Token decimals (18 for ETH, 6 for USDC)
 * @returns Amount in atomic units as BigInt
 * @example formatAmountForCdp("1.5", 18) // BigInt("1500000000000000000")
 */
export function formatAmountForCdp(amount: string, decimals: number): bigint {
    // Handle empty or zero amounts
    if (!amount || amount === '0') return BigInt(0);

    const [whole = '0', fraction = ''] = amount.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole + paddedFraction);
}

/**
 * Convert atomic units to user-friendly decimal string
 * @param amount - Amount in atomic units (BigInt from blockchain/SDK)
 * @param decimals - Token decimals (18 for ETH, 6 for USDC)
 * @returns User-friendly decimal string
 * @example formatAmountFromCdp(BigInt("1500000000000000000"), 18) // "1.5"
 * @example formatAmountFromCdp(BigInt("2543210000"), 6) // "2543.21"
 */
export function formatAmountFromCdp(amount: bigint, decimals: number): string {
    const amountString = amount.toString();
    const padded = amountString.padStart(decimals + 1, '0');
    const whole = padded.slice(0, -decimals) || '0';
    const fraction = padded.slice(-decimals);
    return `${whole}.${fraction}`.replace(/\.?0+$/, '');
}
