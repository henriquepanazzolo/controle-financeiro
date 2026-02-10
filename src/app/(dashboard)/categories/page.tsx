/**
 * Categories Page — Server Component
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCategoriesByUser } from '@/lib/dal/categories';
import CategoriesClient from './CategoriesClient';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const categories = await getCategoriesByUser(session.user.id, true);

    return <CategoriesClient categories={categories} />;
}
