import type {Metadata} from 'next';
import { Press_Start_2P, VT323 } from 'next/font/google';
import './globals.css'; // Global styles

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel-header',
});

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel-body',
});

export const metadata: Metadata = {
  title: 'ENERGY BAR',
  description: 'A multiplayer realtime team game about work-life balance.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${pressStart2P.variable} ${vt323.variable}`}>
      <body suppressHydrationWarning className="font-pixel-body bg-orange-50 text-orange-950 selection:bg-orange-300 selection:text-orange-900">
        {children}
      </body>
    </html>
  );
}
