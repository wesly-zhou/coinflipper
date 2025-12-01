// Utility functions for formatting token amounts
// These help convert between user-friendly decimals and blockchain atomic units

/**
 * Calculate exchange rate from atomic amounts
 * @param fromAmount - Input token amount (atomic units as BigInt or string)
 * @param fromDecimals - Input token decimals
 * @param toAmount - Output token amount (atomic units as BigInt or string)
 * @param toDecimals - Output token decimals
 * @returns Exchange rate as a decimal number
 * @example calculateRate(BigInt("1000000000000000000"), 18, BigInt("2543210000"), 6) // 2543.21
 */
export function calculateExchangeRate(
  fromAmount: bigint | string,
  fromDecimals: number,
  toAmount: bigint | string,
  toDecimals: number
): number {
  const fromBigInt = typeof fromAmount === 'string' ? BigInt(fromAmount) : fromAmount;
  const toBigInt = typeof toAmount === 'string' ? BigInt(toAmount) : toAmount;
  const fromValue = Number(fromBigInt) / Math.pow(10, fromDecimals);
  const toValue = Number(toBigInt) / Math.pow(10, toDecimals);
  if (fromValue === 0) return 0;
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
 * Format token amount with optional precision
 * Accepts both BigInt (from CDP SDK) and string (from API responses)
 * Converts atomic units to user-friendly decimal string
 * @param amount - Amount in atomic units (BigInt or string)
 * @param decimals - Token decimals (18 for ETH, 6 for USDC)
 * @param displayDecimals - Optional number of decimal places to show (default: auto, removes trailing zeros)
 * @returns Formatted token amount string
 * @example formatTokenAmount(BigInt("1500000000000000000"), 18) // "1.5"
 * @example formatTokenAmount(BigInt("1500000000000000000"), 18, 6) // "1.500000"
 * @example formatTokenAmount("1500000000000000000", 18) // "1.5"
 */
export function formatTokenAmount(
  amount: bigint | string,
  decimals: number,
  displayDecimals?: number
): string {
  const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;
  
  // Convert atomic units to decimal string
  const amountString = amountBigInt.toString();
  const padded = amountString.padStart(decimals + 1, '0');
  const whole = padded.slice(0, -decimals) || '0';
  const fraction = padded.slice(-decimals);
  const formatted = `${whole}.${fraction}`.replace(/\.?0+$/, '');

  if (displayDecimals === undefined) {
    return formatted; // Auto-format (removes trailing zeros)
  }

  const [wholePart, fractionPart = ''] = formatted.split('.');
  let fractionalStr = fractionPart.padEnd(displayDecimals, '0').slice(0, displayDecimals);

  // Remove trailing zeros if displayDecimals is set
  if (displayDecimals > 0) {
    fractionalStr = fractionalStr.replace(/0+$/, '');
    return fractionalStr ? `${wholePart}.${fractionalStr}` : wholePart;
  }

  return wholePart;
}

/**
 * Calculate price impact (slippage) percentage
 * Price impact = (expected - minimum) / expected * 100
 * @param expectedAmount - Expected output amount (atomic units as BigInt or string)
 * @param minimumAmount - Minimum output amount after slippage (atomic units as BigInt or string)
 * @returns Price impact as a percentage (e.g., 0.5 for 0.5%)
 * @example calculatePriceImpact(BigInt("1000000"), BigInt("995000")) // 0.5 (0.5% slippage)
 */
export function calculatePriceImpact(
  expectedAmount: bigint | string,
  minimumAmount: bigint | string
): number {
  const expectedBigInt = typeof expectedAmount === 'string' ? BigInt(expectedAmount) : expectedAmount;
  const minimumBigInt = typeof minimumAmount === 'string' ? BigInt(minimumAmount) : minimumAmount;

  if (expectedBigInt === BigInt(0)) {
    return 0;
  }
  const difference = expectedBigInt - minimumBigInt;
  const impact = (Number(difference) / Number(expectedBigInt)) * 100;
  return Math.max(0, impact); // Ensure non-negative
}


/**
 * Format USD currency
 * @param amount - Amount as number or string
 * @returns Formatted USD string (e.g., "$1,234.56")
 * @example formatUsd(1234.56) // "$1,234.56"
 * @example formatUsd("1234.56") // "$1,234.56"
 */
export function formatUsd(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format a number with commas and optional decimal places
 * @param num - Number or string to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string (e.g., "1,234.56")
 * @example formatNumber(1234.56) // "1,234.56"
 * @example formatNumber(1234.5678, 4) // "1,234.5678"
 */
export function formatNumber(num: number | string, decimals: number = 2): string {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Shorten an address for display
 * Shows "0x" + 2 characters + "..." + 4 characters at the end
 * @param address - Full Ethereum address
 * @returns Shortened address (e.g., "0x12...7890")
 * @example shortenAddress("0x1234567890123456789012345678901234567890") // "0x12...7890"
 */
export function shortenAddress(address: string): string {
  if (!address || address.length < 8) return address;
  // Show "0x" + 2 chars + "..." + 4 chars at end
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
