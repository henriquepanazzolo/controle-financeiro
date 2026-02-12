/**
 * Budgets Page — Server Component
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getBudgetsByMonth } from '@/lib/dal/budgets';
import { getCategoriesByUser } from '@/lib/dal/categories';
import BudgetsClient from './BudgetsClient';

export const dynamic = 'force-dynamic';

export default async function BudgetsPage({
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

    const [budgets, categories] = await Promise.all([
        getBudgetsByMonth(session.user.id, month, year),
        getCategoriesByUser(session.user.id),
    ]);

    const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

    return (
        <BudgetsClient
            budgets={budgets}
            categories={expenseCategories}
            month={month}
            year={year}
        />
    );
}
