/**
 * Goals Page — Server Component
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getGoalsByUser } from '@/lib/dal/goals';
import GoalsClient from './GoalsClient';

export const dynamic = 'force-dynamic';

export default async function GoalsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const goals = await getGoalsByUser(session.user.id);

    return <GoalsClient goals={goals} />;
}
