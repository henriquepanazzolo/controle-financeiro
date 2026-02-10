/**
 * Import Page — Server Component
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCategoriesByUser } from '@/lib/dal/categories';
import ImportClient from './ImportClient';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const [accounts, categories] = await Promise.all([
        prisma.account.findMany({
            where: { userId: session.user.id, isActive: true },
            select: { id: true, name: true, icon: true },
            orderBy: { name: 'asc' },
        }),
        getCategoriesByUser(session.user.id),
    ]);

    return (
        <ImportClient
            accounts={accounts}
            categories={categories}
        />
    );
}
