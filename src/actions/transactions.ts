/**
 * Transactions Server Actions
 * 
 * All mutations verify auth, validate with Zod, and delegate to DAL.
 * 
 * @module actions/transactions
 */
'use server';

import { getAuthenticatedUserId } from '@/lib/auth';
import { transactionSchema, updateTransactionStatusSchema } from '@/validators/transaction.schema';
import * as transactionsDAL from '@/lib/dal/transactions';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface ActionResult {
    success: boolean;
    error?: string;
}

/**
 * Creates a new transaction (with optional recurring rule).
 */
export async function createTransaction(formData: FormData): Promise<ActionResult> {
    try {
        const userId = await getAuthenticatedUserId();

        const raw = {
            accountId: formData.get('accountId') as string,
            subcategoryId: formData.get('subcategoryId') as string,
            type: formData.get('type') as string,
            amount: Number(formData.get('amount')),
            description: formData.get('description') as string,
            notes: (formData.get('notes') as string) || undefined,
            date: formData.get('date') as string,
            status: (formData.get('status') as string) || 'PENDING',
            isRecurring: formData.get('isRecurring') === 'true',
            recurrenceType: (formData.get('recurrenceType') as string) || undefined,
            recurrenceEndDate: formData.get('recurrenceEndDate') as string || undefined,
        };

        const parsed = transactionSchema.safeParse(raw);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
        }

        let recurringRuleId: string | undefined;

        // Create recurring rule if needed
        if (parsed.data.isRecurring && parsed.data.recurrenceType) {
            const rule = await prisma.recurringRule.create({
                data: {
                    userId,
                    type: parsed.data.recurrenceType,
                    startDate: parsed.data.date,
                    endDate: parsed.data.recurrenceEndDate || null,
                },
            });
            recurringRuleId = rule.id;
        }

        await transactionsDAL.createTransaction(userId, {
            accountId: parsed.data.accountId,
            subcategoryId: parsed.data.subcategoryId,
            type: parsed.data.type,
            amount: parsed.data.amount,
            description: parsed.data.description,
            notes: parsed.data.notes,
            date: parsed.data.date,
            status: parsed.data.status,
            recurringRuleId,
        });

        revalidatePath('/');
        revalidatePath('/transactions');
        return { success: true };
    } catch (error) {
        console.error('[createTransaction]', error);
        const message = error instanceof Error ? error.message : 'Erro ao criar transação.';
        return { success: false, error: message };
    }
}

/**
 * Updates a transaction's status.
 */
export async function updateTransactionStatus(formData: FormData): Promise<ActionResult> {
    try {
        const userId = await getAuthenticatedUserId();

        const raw = {
            id: formData.get('id') as string,
            status: formData.get('status') as string,
        };

        const parsed = updateTransactionStatusSchema.safeParse(raw);
        if (!parsed.success) {
            return { success: false, error: 'Dados inválidos.' };
        }

        await transactionsDAL.updateTransaction(userId, parsed.data.id, {
            status: parsed.data.status,
        });

        revalidatePath('/');
        revalidatePath('/transactions');
        return { success: true };
    } catch (error) {
        console.error('[updateTransactionStatus]', error);
        return { success: false, error: 'Erro ao atualizar transação.' };
    }
}

/**
 * Deletes a transaction.
 */
export async function deleteTransaction(formData: FormData): Promise<ActionResult> {
    try {
        const userId = await getAuthenticatedUserId();
        const id = formData.get('id') as string;

        if (!id) return { success: false, error: 'ID inválido.' };

        await transactionsDAL.deleteTransaction(userId, id);

        revalidatePath('/');
        revalidatePath('/transactions');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Erro ao excluir transação.' };
    }
}

/**
 * Deletes multiple transactions.
 */
export async function bulkDeleteTransactions(formData: FormData): Promise<ActionResult> {
    try {
        const userId = await getAuthenticatedUserId();
        const idsString = formData.get('ids') as string;

        if (!idsString) return { success: false, error: 'Ids inválidos.' };

        const ids = JSON.parse(idsString);
        if (!Array.isArray(ids) || ids.length === 0) {
            return { success: false, error: 'Nenhuma transação selecionada.' };
        }

        await transactionsDAL.deleteTransactions(userId, ids);

        revalidatePath('/');
        revalidatePath('/transactions');
        return { success: true };
    } catch (error) {
        console.error('[bulkDeleteTransactions]', error);
        return { success: false, error: 'Erro ao excluir transações.' };
    }
}
