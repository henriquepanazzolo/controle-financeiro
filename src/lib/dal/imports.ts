/**
 * Imports Data Access Layer
 * 
 * Centralized data operations for bulk importing transactions
 * with deduplication and import logging.
 * 
 * @module lib/dal/imports
 */
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';

/** DTO for import log */
export interface ImportLogDTO {
    id: string;
    fileName: string;
    bankSource: string | null;
    totalRows: number;
    importedRows: number;
    skippedRows: number;
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
    errorMessage: string | null;
    createdAt: Date;
}

/**
 * Creates a new import log entry.
 */
export async function createImportLog(
    userId: string,
    fileName: string,
    totalRows: number,
    bankSource?: string,
) {
    return prisma.importLog.create({
        data: {
            userId,
            fileName,
            totalRows,
            bankSource,
        },
    });
}

/**
 * Updates an import log with completion data.
 */
export async function updateImportLog(
    logId: string,
    data: {
        importedRows?: number;
        skippedRows?: number;
        status?: 'PROCESSING' | 'COMPLETED' | 'FAILED';
        errorMessage?: string;
    },
) {
    return prisma.importLog.update({
        where: { id: logId },
        data,
    });
}

/**
 * Gets import history for a user.
 */
export async function getImportHistory(
    userId: string,
    limit: number = 20,
): Promise<ImportLogDTO[]> {
    const logs = await prisma.importLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });

    return logs.map((log) => ({
        id: log.id,
        fileName: log.fileName,
        bankSource: log.bankSource,
        totalRows: log.totalRows,
        importedRows: log.importedRows,
        skippedRows: log.skippedRows,
        status: log.status,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt,
    }));
}

import { generateExternalId } from '@/utils/importUtils';

/**
 * Checks which transactions already exist based on externalId.
 * Returns array of externalIds that are duplicates.
 */
export async function findDuplicateTransactions(
    userId: string,
    externalIds: string[],
): Promise<string[]> {
    const existing = await prisma.transaction.findMany({
        where: {
            userId,
            externalId: { in: externalIds },
        },
        select: { externalId: true },
    });

    return existing.map((t) => t.externalId).filter((id): id is string => id !== null);
}

/**
 * Bulk creates transactions from import.
 * Skips duplicates based on externalId.
 * 
 * @returns Object with imported and skipped counts
 */
export async function bulkCreateTransactions(
    userId: string,
    accountId: string,
    subcategoryId: string,
    transactions: Array<{
        date: Date;
        description: string;
        amount: number;
        type: 'INCOME' | 'EXPENSE';
        notes?: string;
        externalId?: string;
    }>,
): Promise<{ imported: number; skipped: number }> {
    // Generate externalIds for all transactions
    const txsWithExternalId = transactions.map((tx) => ({
        ...tx,
        externalId: tx.externalId || generateExternalId(tx.date, tx.amount, tx.description),
    }));

    // Find duplicates
    const allExternalIds = txsWithExternalId.map((tx) => tx.externalId);
    const duplicates = await findDuplicateTransactions(userId, allExternalIds);
    const duplicateSet = new Set(duplicates);

    // Filter out duplicates
    const newTransactions = txsWithExternalId.filter((tx) => !duplicateSet.has(tx.externalId));

    // Bulk insert
    if (newTransactions.length > 0) {
        await prisma.transaction.createMany({
            data: newTransactions.map((tx) => ({
                userId,
                accountId,
                subcategoryId,
                type: tx.type,
                amount: tx.amount,
                description: tx.description,
                notes: tx.notes,
                date: tx.date,
                status: 'PAID' as const, // Imported transactions are marked as PAID by default
                externalId: tx.externalId,
            })),
        });
    }

    return {
        imported: newTransactions.length,
        skipped: duplicates.length,
    };
}
