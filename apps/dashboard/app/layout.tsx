import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'ConsentKit — A little respect. A lot of trust.',
  description:
    'Developer-first consent management. Configure, publish, and understand your consent experience.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
