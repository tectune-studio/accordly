import { SignIn } from '@clerk/nextjs';
import BrandLogo from '../../brand-logo';
export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <a href="/" aria-label="Accordly home" className="rounded-xl bg-[#171436] px-6 py-4">
        <BrandLogo tone="light" />
      </a>
      <SignIn />
    </main>
  );
}
