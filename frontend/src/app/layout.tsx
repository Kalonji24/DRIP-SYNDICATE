import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: {
    default: 'DRIP SYNDICATE — Street. Power. Identity.',
    template: '%s · DRIP SYNDICATE'
  },
  description:
    'Drop-based streetwear. Limited runs, sealed drops, zero restocks. Built in South Africa.',
  metadataBase: new URL('https://drip-syndicate.onrender.com'),
  openGraph: {
    title: 'DRIP SYNDICATE',
    description: 'Drop-based streetwear from South Africa.',
    type: 'website'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
