import { Token, SupportedNetwork } from '@/types';

export const SUPPORTED_NETWORKS: { id: SupportedNetwork; name: string; chainId: number }[] = [
    { id: 'base', name: 'Base', chainId: 8453 },
    { id: 'ethereum', name: 'Ethereum', chainId: 1 },
];

export const DEFAULT_NETWORK: SupportedNetwork = 'base';

// Token list URLs (CoinGecko)
export const TOKEN_LIST_URLS = {
    base: 'https://tokens.coingecko.com/base/all.json',
    ethereum: 'https://tokens.coingecko.com/ethereum/all.json',
};

// Fallback tokens in case CoinGecko API is down
export const FALLBACK_TOKENS: Record<SupportedNetwork, Token[]> = {
    base: [
        {
            id: 'base-eth',
            symbol: 'ETH',
                name: 'Ethereum',
                address: '0x4200000000000000000000000000000000000006',
                decimals: 18,
                network: 'base',
                logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
        },
        {
            id: 'base-usdc',
            symbol: 'USDC',
            name: 'USD Coin',
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            decimals: 6,
            network: 'base',
            logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
        },
        {
            id: 'base-dai',
            symbol: 'DAI',
            name: 'Dai Stablecoin',
            address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
            decimals: 18,
            network: 'base',
            logoUrl: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
        },
    ],
    ethereum: [
        {
            id: 'ethereum-eth',
            symbol: 'ETH',
            name: 'Ethereum',
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            decimals: 18,
            network: 'ethereum',
            logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
        },
        {
            id: 'ethereum-usdc',
            symbol: 'USDC',
            name: 'USD Coin',
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            decimals: 6,
            network: 'ethereum',
            logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
        },
        {
            id: 'ethereum-usdt',
            symbol: 'USDT',
            name: 'Tether USD',
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            decimals: 6,
            network: 'ethereum',
            logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
        },
        {
            id: 'ethereum-dai',
            symbol: 'DAI',
            name: 'Dai Stablecoin',
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            decimals: 18,
            network: 'ethereum',
            logoUrl: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
        },
    ],
};