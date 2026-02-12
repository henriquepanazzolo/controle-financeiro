/**
 * Transactions Page — Server Component
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTransactionsByMonth } from '@/lib/dal/transactions';
import { getCategoriesByUser } from '@/lib/dal/categories';
import { prisma } from '@/lib/prisma';
import TransactionsClient from './TransactionsClient';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string; year?: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const params = await searchParams;
    const now = new Date();

    const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
    const year = params.year ? parseInt(params.year) : now.getFullYear();

    const [transactions, categories, accounts] = await Promise.all([
        getTransactionsByMonth(session.user.id, month, year),
        getCategoriesByUser(session.user.id),
        prisma.account.findMany({
            where: { userId: session.user.id, isActive: true },
            select: { id: true, name: true, icon: true },
            orderBy: { name: 'asc' },
        }),
    ]);

    return (
        <TransactionsClient
            initialTransactions={transactions}
            categories={categories}
            accounts={accounts}
        />
    );
}
