import { NextResponse } from 'next/server';
import { coingecko } from '@/lib/coingecko';

export async function GET() {
  try {
    const trending = await coingecko.getTrending();
    return NextResponse.json(trending);
  } catch (error: any) {
    console.error('CoinGecko trending error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trending' },
      { status: 500 }
    );
  }
}