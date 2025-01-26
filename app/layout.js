// app/layout.js
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import ClientLayout from '../components/ClientLayout';
import './globals.css';

export const metadata = {
  title: '🚀 NeuroGen - AI Playground',
  description: 'Plateforme de génération IA nouvelle génération avec WebGPU',
  themeColor: '#0f172a',
}

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '700'],
});

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${jetbrainsMono.variable} ${spaceGrotesk.variable} scroll-smooth`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="antialiased bg-neural-dark">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}