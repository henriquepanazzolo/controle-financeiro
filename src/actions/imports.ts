/**
 * Imports Server Actions
 * 
 * Handles bulk transaction import with deduplication and logging.
 * 
 * @module actions/imports
 */
'use server';

import { getAuthenticatedUserId } from '@/lib/auth';
import { importConfirmSchema } from '@/validators/import.schema';
import * as importsDAL from '@/lib/dal/imports';
import { revalidatePath } from 'next/cache';

interface ActionResult {
    success: boolean;
    error?: string;
    data?: {
        imported: number;
        skipped: number;
        logId: string;
    };
}

/**
 * Confirms and executes a bulk import of transactions.
 * Creates an import log and inserts all non-duplicate transactions.
 */
export async function confirmImport(data: unknown): Promise<ActionResult> {
    try {
        const userId = await getAuthenticatedUserId();

        // Validate input
        const parsed = importConfirmSchema.safeParse(data);
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
            };
        }

        const { accountId, defaultSubcategoryId, transactions, bankSource, fileName } = parsed.data;

        // Create import log
        const log = await importsDAL.createImportLog(
            userId,
            fileName,
            transactions.length,
            bankSource,
        );

        try {
            // Bulk create transactions
            const result = await importsDAL.bulkCreateTransactions(
                userId,
                accountId,
                defaultSubcategoryId,
                transactions,
            );

            // Update log with success
            await importsDAL.updateImportLog(log.id, {
                importedRows: result.imported,
                skippedRows: result.skipped,
                status: 'COMPLETED',
            });

            // Revalidate
            revalidatePath('/');
            revalidatePath('/transactions');
            revalidatePath('/import');

            return {
                success: true,
                data: {
                    imported: result.imported,
                    skipped: result.skipped,
                    logId: log.id,
                },
            };
        } catch (error) {
            // Update log with failure
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            await importsDAL.updateImportLog(log.id, {
                status: 'FAILED',
                errorMessage,
            });

            throw error;
        }
    } catch (error) {
        console.error('[confirmImport]', error);
        const message = error instanceof Error ? error.message : 'Erro ao importar transações.';
        return { success: false, error: message };
    }
}

/**
 * Gets import history for the current user.
 */
export async function getImportHistory(): Promise<{
    success: boolean;
    data?: importsDAL.ImportLogDTO[];
    error?: string;
}> {
    try {
        const userId = await getAuthenticatedUserId();
        const logs = await importsDAL.getImportHistory(userId);
        return { success: true, data: logs };
    } catch (error) {
        console.error('[getImportHistory]', error);
        return { success: false, error: 'Erro ao buscar histórico.' };
    }
}
