import type { Metadata } from 'next';
import { Poppins, PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { FirebaseClientProvider } from '@/firebase';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'KenyaWatch',
    template: '%s | KenyaWatch',
  },
  description: 'Monitoring Kenyan elected representatives for accountability and transparency. Track performance, integrity, and legislative engagement.',
  keywords: ['Kenya', 'politics', 'representatives', 'parliament', 'accountability', 'transparency', 'civic tech'],
  authors: [{ name: 'KenyaWatch Team' }],
  openGraph: {
    title: 'KenyaWatch - Accountability & Transparency',
    description: 'Empowering citizens with data for accountable leadership in Kenya',
    type: 'website',
    locale: 'en_KE',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${ptSans.variable}`}>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
            <AuthProvider>
            {children}
            <Toaster />
            </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
