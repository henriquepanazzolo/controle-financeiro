/**
 * Categories Server Actions
 * 
 * @module actions/categories
 */
'use server';

import { getAuthenticatedUserId } from '@/lib/auth';
import { categorySchema, subcategorySchema } from '@/validators/category.schema';
import * as categoriesDAL from '@/lib/dal/categories';
import { revalidatePath } from 'next/cache';

interface ActionResult {
    success: boolean;
    error?: string;
}

export async function createCategory(formData: FormData): Promise<ActionResult> {
    try {
        const userId = await getAuthenticatedUserId();

        const raw = {
            name: formData.get('name') as string,
            type: formData.get('type') as string,
            icon: (formData.get('icon') as string) || undefined,
            color: (formData.get('color') as string) || undefined,
        };

        const parsed = categorySchema.safeParse(raw);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
        }

        await categoriesDAL.createCategory(userId, parsed.data);
        revalidatePath('/categories');
        return { success: true };
    } catch (error) {
        console.error('[createCategory]', error);
        return { success: false, error: 'Erro ao criar categoria.' };
    }
}

export async function createSubcategory(formData: FormData): Promise<ActionResult> {
    try {
        const userId = await getAuthenticatedUserId();

        const raw = {
            categoryId: formData.get('categoryId') as string,
            name: formData.get('name') as string,
        };

        const parsed = subcategorySchema.safeParse(raw);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
        }

        await categoriesDAL.createSubcategory(userId, parsed.data);
        revalidatePath('/categories');
        return { success: true };
    } catch (error) {
        console.error('[createSubcategory]', error);
        return { success: false, error: 'Erro ao criar subcategoria.' };
    }
}

export async function toggleCategory(formData: FormData): Promise<ActionResult> {
    try {
        const userId = await getAuthenticatedUserId();
        const categoryId = formData.get('categoryId') as string;
        if (!categoryId) return { success: false, error: 'ID inválido.' };

        await categoriesDAL.toggleCategoryActive(userId, categoryId);
        revalidatePath('/categories');
        return { success: true };
    } catch (error) {
        console.error('[toggleCategory]', error);
        return { success: false, error: 'Erro ao alterar categoria.' };
    }
}
