import Image from 'next/image';

export function Logo() {
  const handleClick = () => {
    window.location.href = '/';
  };

  return (
    <button onClick={handleClick} className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
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
    </button>
  );
}

