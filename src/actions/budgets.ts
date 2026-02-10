/**
 * Budget Server Actions
 * 
 * @module actions/budgets
 */
'use server';

import { getAuthenticatedUserId } from '@/lib/auth';
import { budgetSchema } from '@/validators/budget.schema';
import * as budgetsDAL from '@/lib/dal/budgets';
import { revalidatePath } from 'next/cache';

interface ActionResult {
    success: boolean;
    error?: string;
}

export async function upsertBudget(formData: FormData): Promise<ActionResult> {
    try {
        const userId = await getAuthenticatedUserId();

        const raw = {
            categoryId: formData.get('categoryId') as string,
            limitAmount: Number(formData.get('limitAmount')),
            month: Number(formData.get('month')),
            year: Number(formData.get('year')),
        };

        const parsed = budgetSchema.safeParse(raw);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
        }

        await budgetsDAL.upsertBudget(userId, parsed.data);
        revalidatePath('/budgets');
        return { success: true };
    } catch (error) {
        console.error('[upsertBudget]', error);
        return { success: false, error: 'Erro ao salvar orçamento.' };
    }
}

export async function deleteBudget(formData: FormData): Promise<ActionResult> {
    try {
        const userId = await getAuthenticatedUserId();
        const id = formData.get('id') as string;
        if (!id) return { success: false, error: 'ID inválido.' };

        await budgetsDAL.deleteBudget(userId, id);
        revalidatePath('/budgets');
        return { success: true };
    } catch (error) {
        console.error('[deleteBudget]', error);
        return { success: false, error: 'Erro ao excluir orçamento.' };
    }
}
