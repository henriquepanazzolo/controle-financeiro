import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FinancePro — Controle Financeiro',
  description: 'Gerencie suas finanças pessoais com inteligência. Controle receitas, despesas, orçamentos e metas financeiras.',
  keywords: ['finanças', 'controle financeiro', 'orçamento', 'metas financeiras'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        outfit.variable,
        inter.variable
      )}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
