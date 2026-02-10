import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import './globals.css';

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
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
