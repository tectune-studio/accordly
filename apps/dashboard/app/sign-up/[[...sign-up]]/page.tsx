import { SignUp } from '@clerk/nextjs';
import BrandLogo from '@/components/brand-logo';
export default function Page() {
  return (
    <main className="m-auto flex min-h-screen max-w-[1580px] flex-col items-center justify-center gap-8 px-10.5 pt-8.75 pb-0 min-[1600px]:pt-10.75 [@media(max-width:1200px)]:px-[26px] [@media(max-width:720px)]:px-5 [@media(max-width:720px)]:pt-6.25">
      <a href="/" aria-label="Accordly home" className="rounded-xl bg-primary px-6 py-4">
        <BrandLogo tone="light" />
      </a>
      <SignUp />
    </main>
  );
}
