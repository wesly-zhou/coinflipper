import { CdpClient } from '@coinbase/cdp-sdk';

// Singleton CDP client instance
let cdpClient: CdpClient | null = null;

export function getCdpClient(): CdpClient {
  if (!cdpClient) {
    cdpClient = new CdpClient();
  }
  return cdpClient;
}

// For server-side only - ensure we don't expose the client to the browser
export function isServer(): boolean {
  return typeof window === 'undefined';
}
