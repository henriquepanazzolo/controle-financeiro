/**
 * Dashboard Page — Main overview of financial data
 * 
 * Shows summary cards, pie chart, bar chart, line chart, and top expenses.
 * Server Component that fetches data and passes to client chart components.
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getMonthSummary, getExpensesByCategory, getTopExpenses, getMonthlyComparison } from '@/lib/dal/transactions';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [summary, prevSummary, categoryBreakdown, topExpenses, monthlyData] = await Promise.all([
        getMonthSummary(session.user.id, month, year),
        getMonthSummary(session.user.id, month === 1 ? 12 : month - 1, month === 1 ? year - 1 : year),
        getExpensesByCategory(session.user.id, month, year),
        getTopExpenses(session.user.id, month, year, 5),
        getMonthlyComparison(session.user.id, 6),
    ]);

    return (
        <DashboardClient
            summary={summary}
            prevSummary={prevSummary}
            categoryBreakdown={categoryBreakdown}
            topExpenses={topExpenses}
            monthlyData={monthlyData}
        />
    );
}
