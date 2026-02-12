/**
 * Transactions Data Access Layer
 * 
 * Centralized data operations for transactions with row-level security.
 * Every query filters by userId to prevent cross-user data access.
 * 
 * @module lib/dal/transactions
 */
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';

/** DTO for transaction list item */
export interface TransactionDTO {
    id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    description: string;
    notes: string | null;
    date: Date;
    status: 'PAID' | 'PENDING' | 'OVERDUE';
    categoryName: string;
    categoryColor: string | null;
    categoryIcon: string | null;
    subcategoryName: string;
    accountName: string;
    isRecurring: boolean;
    createdAt: Date;
}

/** DTO for dashboard summary */
export interface MonthSummaryDTO {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
}

/** DTO for category breakdown */
export interface CategoryBreakdownDTO {
    categoryId: string;
    categoryName: string;
    categoryColor: string | null;
    categoryIcon: string | null;
    total: number;
    percentage: number;
}

/**
 * Fetches paginated transactions for a user in a given month/year.
 */
export async function getTransactionsByMonth(
    userId: string,
    month: number,
    year: number,
    type?: 'INCOME' | 'EXPENSE',
): Promise<TransactionDTO[]> {
    // Use UTC to avoid timezone issues
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const where: Prisma.TransactionWhereInput = {
        userId,
        date: { gte: startDate, lte: endDate },
        ...(type && { type }),
    };

    const transactions = await prisma.transaction.findMany({
        where,
        select: {
            id: true,
            type: true,
            amount: true,
            description: true,
            notes: true,
            date: true,
            status: true,
            recurringRuleId: true,
            createdAt: true,
            subcategory: {
                select: {
                    name: true,
                    category: {
                        select: {
                            name: true,
                            color: true,
                            icon: true,
                        },
                    },
                },
            },
            account: {
                select: { name: true },
            },
        },
        orderBy: { date: 'desc' },
    });

    return transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        description: t.description,
        notes: t.notes,
        date: t.date,
        status: t.status,
        categoryName: t.subcategory.category.name,
        categoryColor: t.subcategory.category.color,
        categoryIcon: t.subcategory.category.icon,
        subcategoryName: t.subcategory.name,
        accountName: t.account.name,
        isRecurring: !!t.recurringRuleId,
        createdAt: t.createdAt,
    }));
}

/**
 * Computes monthly summary (income, expense, balance) for a user.
 */
export async function getMonthSummary(
    userId: string,
    month: number,
    year: number,
): Promise<MonthSummaryDTO> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [incomeResult, expenseResult, count] = await Promise.all([
        prisma.transaction.aggregate({
            where: { userId, type: 'INCOME', date: { gte: startDate, lte: endDate }, status: 'PAID' },
            _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
            where: { userId, type: 'EXPENSE', date: { gte: startDate, lte: endDate }, status: 'PAID' },
            _sum: { amount: true },
        }),
        prisma.transaction.count({
            where: { userId, date: { gte: startDate, lte: endDate } },
        }),
    ]);

    const totalIncome = Number(incomeResult._sum.amount ?? 0);
    const totalExpense = Number(expenseResult._sum.amount ?? 0);

    return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount: count,
    };
}

/**
 * Gets expense breakdown by category for a given month.
 */
export async function getExpensesByCategory(
    userId: string,
    month: number,
    year: number,
): Promise<CategoryBreakdownDTO[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const expenses = await prisma.transaction.findMany({
        where: {
            userId,
            type: 'EXPENSE',
            status: 'PAID',
            date: { gte: startDate, lte: endDate },
        },
        select: {
            amount: true,
            subcategory: {
                select: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            color: true,
                            icon: true,
                        },
                    },
                },
            },
        },
    });

    // Aggregate by category
    const categoryMap = new Map<string, { name: string; color: string | null; icon: string | null; total: number }>();

    for (const exp of expenses) {
        const cat = exp.subcategory.category;
        const existing = categoryMap.get(cat.id);
        if (existing) {
            existing.total += Number(exp.amount);
        } else {
            categoryMap.set(cat.id, {
                name: cat.name,
                color: cat.color,
                icon: cat.icon,
                total: Number(exp.amount),
            });
        }
    }

    const totalExpenses = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.total, 0);

    return Array.from(categoryMap.entries())
        .map(([categoryId, data]) => ({
            categoryId,
            categoryName: data.name,
            categoryColor: data.color,
            categoryIcon: data.icon,
            total: data.total,
            percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);
}

/**
 * Gets top N expenses for a given month.
 */
export async function getTopExpenses(
    userId: string,
    month: number,
    year: number,
    limit: number = 5,
): Promise<TransactionDTO[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
        where: {
            userId,
            type: 'EXPENSE',
            date: { gte: startDate, lte: endDate },
        },
        select: {
            id: true,
            type: true,
            amount: true,
            description: true,
            notes: true,
            date: true,
            status: true,
            recurringRuleId: true,
            createdAt: true,
            subcategory: {
                select: {
                    name: true,
                    category: { select: { name: true, color: true, icon: true } },
                },
            },
            account: { select: { name: true } },
        },
        orderBy: { amount: 'desc' },
        take: limit,
    });

    return transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        description: t.description,
        notes: t.notes,
        date: t.date,
        status: t.status,
        categoryName: t.subcategory.category.name,
        categoryColor: t.subcategory.category.color,
        categoryIcon: t.subcategory.category.icon,
        subcategoryName: t.subcategory.name,
        accountName: t.account.name,
        isRecurring: !!t.recurringRuleId,
        createdAt: t.createdAt,
    }));
}

/**
 * Gets monthly income vs expense data for the last N months.
 */
export async function getMonthlyComparison(
    userId: string,
    months: number = 6,
): Promise<Array<{ month: number; year: number; income: number; expense: number }>> {
    const results: Array<{ month: number; year: number; income: number; expense: number }> = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = date.getMonth() + 1;
        const y = date.getFullYear();
        const summary = await getMonthSummary(userId, m, y);
        results.push({
            month: m,
            year: y,
            income: summary.totalIncome,
            expense: summary.totalExpense,
        });
    }

    return results;
}

/**
 * Creates a new transaction.
 */
export async function createTransaction(
    userId: string,
    data: {
        accountId: string;
        subcategoryId: string;
        type: 'INCOME' | 'EXPENSE';
        amount: number;
        description: string;
        notes?: string;
        date: Date;
        status: 'PAID' | 'PENDING' | 'OVERDUE';
        recurringRuleId?: string;
    },
) {
    // Verify the account and subcategory belong to the user
    const [account, subcategory] = await Promise.all([
        prisma.account.findFirst({ where: { id: data.accountId, userId } }),
        prisma.subcategory.findFirst({
            where: { id: data.subcategoryId, category: { userId } },
        }),
    ]);

    if (!account) {
        throw new Error('Conta não encontrada ou não pertence ao usuário.');
    }
    if (!subcategory) {
        throw new Error('Subcategoria não encontrada ou não pertence ao usuário.');
    }

    return prisma.transaction.create({
        data: {
            userId,
            accountId: data.accountId,
            subcategoryId: data.subcategoryId,
            type: data.type,
            amount: data.amount,
            description: data.description,
            notes: data.notes,
            date: data.date,
            status: data.status,
            recurringRuleId: data.recurringRuleId,
        },
    });
}

/**
 * Updates an existing transaction (only if owned by user).
 */
export async function updateTransaction(
    userId: string,
    transactionId: string,
    data: Partial<{
        subcategoryId: string;
        amount: number;
        description: string;
        notes: string;
        date: Date;
        status: 'PAID' | 'PENDING' | 'OVERDUE';
    }>,
) {
    // Ensure the transaction belongs to the user
    const existing = await prisma.transaction.findFirst({
        where: { id: transactionId, userId },
    });

    if (!existing) {
        throw new Error('Transação não encontrada.');
    }

    return prisma.transaction.update({
        where: { id: transactionId },
        data,
    });
}

/**
 * Deletes a transaction (only if owned by user).
 */
export async function deleteTransaction(
    userId: string,
    transactionId: string,
): Promise<void> {
    const existing = await prisma.transaction.findFirst({
        where: { id: transactionId, userId },
    });

    if (!existing) {
        throw new Error('Transação não encontrada.');
    }

    await prisma.transaction.delete({ where: { id: transactionId } });
}

/**
 * Deletes multiple transactions (only if owned by user).
 */
export async function deleteTransactions(
    userId: string,
    transactionIds: string[],
): Promise<void> {
    await prisma.transaction.deleteMany({
        where: {
            id: { in: transactionIds },
            userId, // Ensure ownership
        },
    });
}
