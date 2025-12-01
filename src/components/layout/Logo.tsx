import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
      <Image
        src="/logo.png"
        alt="CoinFlipper"
        width={32}
        height={32}
        className="w-8 h-auto"
        style={{ objectFit: 'contain' }}
        priority
      />
      <h1 className="text-xl font-semibold text-white">CoinFlipper</h1>
    </Link>
  );
}

