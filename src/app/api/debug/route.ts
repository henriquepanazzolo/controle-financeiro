import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            include: {
                accounts: true,
                _count: {
                    select: { transactions: true, categories: true }
                }
            }
        });

        const usersSanitized = users.map(u => ({
            id: u.id,
            email: u.email,
            transactionCount: u._count.transactions,
            accounts: u.accounts.map(a => ({
                id: a.id,
                name: a.name,
                isActive: a.isActive,
                balance: a.balance
            }))
        }));

        return NextResponse.json({ users: usersSanitized });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
