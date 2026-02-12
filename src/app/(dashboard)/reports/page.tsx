/**
 * Reports Page — Server Component
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getMonthlyComparison, getMonthlyStatement } from '@/lib/dal/reports';
import ReportsClient from './ReportsClient';

export const dynamic = 'force-dynamic';

export default async function ReportsPage({
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

    const [comparison, statement] = await Promise.all([
        getMonthlyComparison(session.user.id, month, year),
        getMonthlyStatement(session.user.id, month, year),
    ]);

    return <ReportsClient comparison={comparison} statement={statement} month={month} year={year} />;
}
