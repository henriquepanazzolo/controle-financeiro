/**
 * Goals Server Actions
 * 
 * @module actions/goals
 */
'use server';

import { getAuthenticatedUserId } from '@/lib/auth';
import { goalSchema, goalContributionSchema } from '@/validators/goal.schema';
import * as goalsDAL from '@/lib/dal/goals';
import { revalidatePath } from 'next/cache';

interface ActionResult {
    success: boolean;
    error?: string;
}

export async function createGoal(formData: FormData): Promise<ActionResult> {
    try {
        const userId = await getAuthenticatedUserId();

        const raw = {
            name: formData.get('name') as string,
            description: (formData.get('description') as string) || undefined,
            targetAmount: Number(formData.get('targetAmount')),
            deadline: formData.get('deadline') ? new Date(formData.get('deadline') as string) : undefined,
        };

        const parsed = goalSchema.safeParse(raw);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
        }

        await goalsDAL.createGoal(userId, parsed.data);
        revalidatePath('/goals');
        return { success: true };
    } catch (error) {
        console.error('[createGoal]', error);
        return { success: false, error: 'Erro ao criar meta.' };
    }
}

export async function addContribution(formData: FormData): Promise<ActionResult> {
    try {
        const userId = await getAuthenticatedUserId();

        const raw = {
            goalId: formData.get('goalId') as string,
            amount: Number(formData.get('amount')),
            notes: (formData.get('notes') as string) || undefined,
        };

        const parsed = goalContributionSchema.safeParse(raw);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
        }

        await goalsDAL.addGoalContribution(userId, parsed.data);
        revalidatePath('/goals');
        return { success: true };
    } catch (error) {
        console.error('[addContribution]', error);
        const message = error instanceof Error ? error.message : 'Erro ao adicionar contribuição.';
        return { success: false, error: message };
    }
}

export async function cancelGoal(formData: FormData): Promise<ActionResult> {
    try {
        const userId = await getAuthenticatedUserId();
        const goalId = formData.get('goalId') as string;
        if (!goalId) return { success: false, error: 'ID inválido.' };

        await goalsDAL.cancelGoal(userId, goalId);
        revalidatePath('/goals');
        return { success: true };
    } catch (error) {
        console.error('[cancelGoal]', error);
        return { success: false, error: 'Erro ao cancelar meta.' };
    }
}
