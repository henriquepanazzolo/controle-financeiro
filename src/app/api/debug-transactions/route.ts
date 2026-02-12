import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const month = Number(searchParams.get('month'));
        const year = Number(searchParams.get('year'));

        const transactions = await prisma.transaction.findMany({
            where: { userId: session.user.id },
            select: { id: true, date: true, description: true, amount: true },
            orderBy: { date: 'desc' },
            take: 50
        });

        return NextResponse.json({
            user: session.user.id,
            totalTransactions: transactions.length,
            requested: { month, year },
            transactions: transactions.map(t => ({
                ...t,
                dateISO: t.date.toISOString(),
                dateLocal: t.date.toLocaleString(),
                // Check if it falls in requested month (simplified check)
                isInRequested: month && year ?
                    (t.date.getMonth() + 1 === month && t.date.getFullYear() === year) : 'N/A'
            }))
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
