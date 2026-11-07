import './globals.css';
export const metadata = {
  title: 'Accordly — Permission, beautifully clear.',
  description:
    'Open-source consent infrastructure for developers. A hosted workspace for teams. Built for meaningful choice across Europe and the United States.',
  icons: { icon: '/accordly.png' },
};
export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
