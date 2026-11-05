import Image from 'next/image';

export function DashboardFooter() {
  return (
    <footer className="w-full border-t border-line mt-9.25 pt-5 pb-6 flex items-center justify-between text-[10px] text-muted-foreground [@media(max-width:720px)]:text-[10px] [@media(max-width:720px)]:gap-3.75 px-0">
      <span className="first:flex first:items-center first:gap-2 [@media(max-width:720px)]:last:hidden">
        <Image
          className="inline-block align-middle mr-1.25"
          src="/accordly.png"
          alt=""
          width={20}
          height={20}
        />{' '}
        <span>Your privacy, your choice.</span>
      </span>
      <span className="first:flex first:items-center first:gap-2 ">Open-core, Always.</span>
    </footer>
  );
}
