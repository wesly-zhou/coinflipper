import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.swapTransaction.deleteMany();

  // Insert sample transactions
  const transactions = await Promise.all([
    prisma.swapTransaction.create({
      data: {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        fromToken: '0x4200000000000000000000000000000000000006',
        toToken: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        fromSymbol: 'WETH',
        toSymbol: 'USDC',
        fromAmount: '0.5',
        toAmount: '1250.00',
        txHash: '0xabc123def456789000000000000000000000000000000000000000000000001',
        status: 'completed',
        network: 'base',
      },
    }),
    prisma.swapTransaction.create({
      data: {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        fromToken: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        toToken: '0x4200000000000000000000000000000000000006',
        fromSymbol: 'USDC',
        toSymbol: 'WETH',
        fromAmount: '500.00',
        toAmount: '0.2',
        txHash: '0xabc123def456789000000000000000000000000000000000000000000000002',
        status: 'completed',
        network: 'base',
      },
    }),
    prisma.swapTransaction.create({
      data: {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        fromToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        toToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        fromSymbol: 'WETH',
        toSymbol: 'USDC',
        fromAmount: '1.0',
        toAmount: '2500.00',
        txHash: '0xabc123def456789000000000000000000000000000000000000000000000003',
        status: 'completed',
        network: 'ethereum',
      },
    }),
    prisma.swapTransaction.create({
      data: {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        fromToken: '0x4200000000000000000000000000000000000006',
        toToken: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb',
        fromSymbol: 'WETH',
        toSymbol: 'DAI',
        fromAmount: '0.1',
        toAmount: '250.00',
        txHash: '0xabc123def456789000000000000000000000000000000000000000000000004',
        status: 'pending',
        network: 'base',
      },
    }),
    prisma.swapTransaction.create({
      data: {
        walletAddress: '0xfedcba0987654321fedcba0987654321fedcba09',
        fromToken: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        toToken: '0x4200000000000000000000000000000000000006',
        fromSymbol: 'USDC',
        toSymbol: 'WETH',
        fromAmount: '1000.00',
        toAmount: '0.4',
        txHash: '0xabc123def456789000000000000000000000000000000000000000000000005',
        status: 'failed',
        network: 'base',
      },
    }),
  ]);

  console.log(`Created ${transactions.length} sample transactions:`);
  transactions.forEach((tx) => {
    console.log(`  [${tx.status.toUpperCase()}] ${tx.fromSymbol} → ${tx.toSymbol} (${tx.network})`);
  });

  console.log('\nSeed complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
