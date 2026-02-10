/**
 * Budgets Data Access Layer
 * 
 * @module lib/dal/budgets
 */
import { prisma } from '@/lib/prisma';

export interface BudgetDTO {
    id: string;
    categoryId: string;
    categoryName: string;
    categoryColor: string | null;
    categoryIcon: string | null;
    limitAmount: number;
    spentAmount: number;
    percentage: number;
    month: number;
    year: number;
}

/**
 * Gets all budgets for a user in a given month/year with spent amounts.
 */
export async function getBudgetsByMonth(
    userId: string,
    month: number,
    year: number,
): Promise<BudgetDTO[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const budgets = await prisma.budget.findMany({
        where: { userId, month, year },
        select: {
            id: true,
            categoryId: true,
            limitAmount: true,
            month: true,
            year: true,
            category: {
                select: {
                    name: true,
                    color: true,
                    icon: true,
                    subcategories: { select: { id: true } },
                },
            },
        },
        orderBy: { category: { name: 'asc' } },
    });

    const results: BudgetDTO[] = [];

    for (const budget of budgets) {
        const subcategoryIds = budget.category.subcategories.map((s) => s.id);

        const spent = await prisma.transaction.aggregate({
            where: {
                userId,
                type: 'EXPENSE',
                status: 'PAID',
                subcategoryId: { in: subcategoryIds },
                date: { gte: startDate, lte: endDate },
            },
            _sum: { amount: true },
        });

        const limitAmount = Number(budget.limitAmount);
        const spentAmount = Number(spent._sum.amount ?? 0);

        results.push({
            id: budget.id,
            categoryId: budget.categoryId,
            categoryName: budget.category.name,
            categoryColor: budget.category.color,
            categoryIcon: budget.category.icon,
            limitAmount,
            spentAmount,
            percentage: limitAmount > 0 ? (spentAmount / limitAmount) * 100 : 0,
            month: budget.month,
            year: budget.year,
        });
    }

    return results;
}

/**
 * Creates or updates a budget (upsert by userId+categoryId+month+year).
 */
export async function upsertBudget(
    userId: string,
    data: { categoryId: string; limitAmount: number; month: number; year: number },
) {
    // Verify category belongs to user
    const category = await prisma.category.findFirst({
        where: { id: data.categoryId, userId },
    });
    if (!category) throw new Error('Categoria não encontrada.');

    return prisma.budget.upsert({
        where: {
            userId_categoryId_month_year: {
                userId,
                categoryId: data.categoryId,
                month: data.month,
                year: data.year,
            },
        },
        create: { userId, ...data },
        update: { limitAmount: data.limitAmount },
    });
}

/**
 * Deletes a budget.
 */
export async function deleteBudget(userId: string, budgetId: string): Promise<void> {
    const existing = await prisma.budget.findFirst({ where: { id: budgetId, userId } });
    if (!existing) throw new Error('Orçamento não encontrado.');
    await prisma.budget.delete({ where: { id: budgetId } });
}
