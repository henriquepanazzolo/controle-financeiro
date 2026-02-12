'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const accountSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'CASH', 'INVESTMENT']),
    balance: z.coerce.number(),
    icon: z.string().optional(),
    color: z.string().optional(),
    isActive: z.coerce.boolean().optional().default(true),
});

interface ActionResult {
    success: boolean;
    error?: string;
}

export async function createAccount(formData: FormData): Promise<ActionResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Não autorizado' };

    const raw = {
        name: formData.get('name'),
        type: formData.get('type'),
        balance: formData.get('balance'),
        icon: formData.get('icon'),
        color: formData.get('color'),
    };

    const parsed = accountSchema.safeParse(raw);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await prisma.account.create({
            data: {
                userId: session.user.id,
                ...parsed.data,
                // If checking/savings, balance is initial balance.
                // If credit card, balance might be current bill or limit? Usually current balance (negative if debt)
            },
        });

        revalidatePath('/accounts');
        return { success: true };
    } catch (error) {
        console.error('Error creating account:', error);
        // Cast error to any to access potentially hidden properties
        const e = error as any;
        if (e.code === 'P2003') {
            return { success: false, error: 'Erro de integridade (P2003): Usuário não encontrado.' };
        }
        return { success: false, error: `Erro ao criar conta: ${String(error)}` };
    }
}

export async function updateAccount(formData: FormData): Promise<ActionResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Não autorizado' };

    const id = formData.get('id') as string;
    if (!id) return { success: false, error: 'ID da conta inválido' };

    const raw = {
        name: formData.get('name'),
        type: formData.get('type'),
        balance: formData.get('balance'),
        icon: formData.get('icon'),
        color: formData.get('color'),
        isActive: formData.get('isActive') === 'true',
    };

    const parsed = accountSchema.safeParse(raw);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        // Ensure ownership
        const existing = await prisma.account.findFirst({
            where: { id, userId: session.user.id }
        });

        if (!existing) return { success: false, error: 'Conta não encontrada.' };

        await prisma.account.update({
            where: { id },
            data: parsed.data,
        });

        revalidatePath('/accounts');
        return { success: true };
    } catch (error) {
        console.error('Error updating account:', error);
        return { success: false, error: 'Erro ao atualizar conta.' };
    }
}

export async function toggleAccountStatus(formData: FormData): Promise<ActionResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Não autorizado' };

    const id = formData.get('accountId') as string;

    try {
        const existing = await prisma.account.findFirst({
            where: { id, userId: session.user.id }
        });

        if (!existing) return { success: false, error: 'Conta não encontrada.' };

        await prisma.account.update({
            where: { id },
            data: { isActive: !existing.isActive },
        });

        revalidatePath('/accounts');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Erro ao alterar status.' };
    }
}

export async function deleteAccount(formData: FormData): Promise<ActionResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Não autorizado' };

    const id = formData.get('accountId') as string;

    try {
        // Check for transactions
        const txCount = await prisma.transaction.count({
            where: { accountId: id }
        });

        if (txCount > 0) {
            return {
                success: false,
                error: `Esta conta possui ${txCount} transações associadas. Arquive-a em vez de excluir.`
            };
        }

        await prisma.account.delete({
            where: { id, userId: session.user.id } // ensuring ownership in where clause
        });

        revalidatePath('/accounts');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Erro ao excluir conta.' };
    }
}
