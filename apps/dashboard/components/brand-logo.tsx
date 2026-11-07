import Image from 'next/image';
import { cn } from 'cn';

// The supplied wordmarks have transparent padding; crop with CSS without changing the assets.
export default function BrandLogo({
  tone = 'dark',
  className = '',
  collapsed = false,
}: {
  tone?: 'dark' | 'light';
  className?: string;
  collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <span
        className={cn(
          'inline-flex size-8 flex-[0_0_32px] aspect-square items-center justify-center overflow-visible align-middle',
          className,
        )}
      >
        <Image
          className="static size-8 max-w-full object-contain"
          src="/accordly.png"
          alt="Accordly"
          width={32}
          height={32}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'relative inline-block aspect-[5/1] w-[170px] max-w-full shrink-0 overflow-hidden align-middle',
        className,
      )}
    >
      <Image
        className={cn(
          'absolute h-auto max-w-none',
          tone === 'dark'
            ? 'top-[-98.4%] left-[-50.4%] w-[197.2%]'
            : 'top-[-124.6%] left-[-32.3%] w-[160.9%]',
        )}
        src={`/accordly-full-${tone}.png`}
        alt="Accordly"
        width={tone === 'dark' ? 2400 : 1120}
        height={tone === 'dark' ? 712 : 472}
        sizes="340px"
      />
    </span>
  );
}
