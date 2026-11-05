import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import './globals.css';
import { Google_Sans } from 'next/font/google';

const googleSans = Google_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-google-sans',
  adjustFontFallback: false, // Prevents layout-shift lookup calculations
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'], // Manually maps your font stack fallback
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Accordly — A little respect. A lot of trust.',
  description:
    'Developer-first consent management. Configure, publish, and understand your consent experience.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={googleSans.variable}>
      <body
        className={`${googleSans.className} bg-canvas font-sans text-sm leading-normal text-ink`}
      >
        {process.env.CONSENTKIT_MODE === 'demo' ? (
          children
        ) : (
          <ClerkProvider
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            signInFallbackRedirectUrl="/"
            signUpFallbackRedirectUrl="/"
          >
            {children}
          </ClerkProvider>
        )}
      </body>
    </html>
  );
}
