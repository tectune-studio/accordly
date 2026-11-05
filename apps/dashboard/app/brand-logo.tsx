import Image from 'next/image';

// The supplied wordmarks have transparent padding; crop with CSS without changing the assets.
export default function BrandLogo({
  tone = 'dark',
  className = '',
}: {
  tone?: 'dark' | 'light';
  className?: string;
}) {
  return (
    <span className={`brand-logo brand-logo-${tone} ${className}`}>
      <Image
        src={`/accordly-full-${tone}.png`}
        alt="Accordly"
        width={tone === 'dark' ? 2400 : 1120}
        height={tone === 'dark' ? 712 : 472}
        sizes="340px"
      />
    </span>
  );
}
