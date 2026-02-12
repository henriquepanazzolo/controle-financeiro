/**
 * Accounts Page — Server Component
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AccountsClient from './AccountsClient';

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const accounts = await prisma.account.findMany({
        where: { userId: session.user.id },
        orderBy: { isActive: 'desc' }, // Active first, then inactive
    });

    // We can also fetch total balance stats if we want, or do it on client.
    // Let's pass the raw accounts to the client.

    return (
        <AccountsClient accounts={accounts} />
    );
}
