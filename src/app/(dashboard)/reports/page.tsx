/**
 * Reports Page — Server Component
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getMonthlyComparison, getMonthlyStatement } from '@/lib/dal/reports';
import ReportsClient from './ReportsClient';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [comparison, statement] = await Promise.all([
        getMonthlyComparison(session.user.id, month, year),
        getMonthlyStatement(session.user.id, month, year),
    ]);

    return <ReportsClient comparison={comparison} statement={statement} month={month} year={year} />;
}
