import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-inter',
    display: 'swap',
});

const manrope = Manrope({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-manrope',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Arch Consultancy | Employee & Project Management',
    description: 'Premium employee and project management portal for Arch Consultancy',
    icons: {
        icon: '/favicon.png',
        apple: '/logo.png',
    }
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
            <body className="bg-surface-base text-slate-800 antialiased selection:bg-primary-200 selection:text-primary-800">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
