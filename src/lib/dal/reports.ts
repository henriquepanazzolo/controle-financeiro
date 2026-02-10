/**
 * Reports Data Access Layer
 * 
 * @module lib/dal/reports
 */
import { prisma } from '@/lib/prisma';

export interface MonthlyComparisonDTO {
    currentMonth: { month: number; year: number; income: number; expense: number; balance: number };
    previousMonth: { month: number; year: number; income: number; expense: number; balance: number };
    incomeVariation: number;
    expenseVariation: number;
}

export interface StatementEntryDTO {
    id: string;
    date: Date;
    description: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    category: string;
    subcategory: string;
    status: 'PAID' | 'PENDING' | 'OVERDUE';
}

/**
 * Gets a monthly comparison between current and previous month.
 */
export async function getMonthlyComparison(
    userId: string,
    month: number,
    year: number,
): Promise<MonthlyComparisonDTO> {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const [current, previous] = await Promise.all([
        getMonthTotals(userId, month, year),
        getMonthTotals(userId, prevMonth, prevYear),
    ]);

    return {
        currentMonth: { month, year, ...current },
        previousMonth: { month: prevMonth, year: prevYear, ...previous },
        incomeVariation: previous.income > 0
            ? ((current.income - previous.income) / previous.income) * 100
            : current.income > 0 ? 100 : 0,
        expenseVariation: previous.expense > 0
            ? ((current.expense - previous.expense) / previous.expense) * 100
            : current.expense > 0 ? 100 : 0,
    };
}

async function getMonthTotals(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [income, expense] = await Promise.all([
        prisma.transaction.aggregate({
            where: { userId, type: 'INCOME', status: 'PAID', date: { gte: startDate, lte: endDate } },
            _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
            where: { userId, type: 'EXPENSE', status: 'PAID', date: { gte: startDate, lte: endDate } },
            _sum: { amount: true },
        }),
    ]);

    const inc = Number(income._sum.amount ?? 0);
    const exp = Number(expense._sum.amount ?? 0);
    return { income: inc, expense: exp, balance: inc - exp };
}

/**
 * Gets all transactions for a month as a statement.
 */
export async function getMonthlyStatement(
    userId: string,
    month: number,
    year: number,
): Promise<StatementEntryDTO[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
        select: {
            id: true,
            date: true,
            description: true,
            type: true,
            amount: true,
            status: true,
            subcategory: {
                select: {
                    name: true,
                    category: { select: { name: true } },
                },
            },
        },
        orderBy: { date: 'asc' },
    });

    return transactions.map((t) => ({
        id: t.id,
        date: t.date,
        description: t.description,
        type: t.type,
        amount: Number(t.amount),
        category: t.subcategory.category.name,
        subcategory: t.subcategory.name,
        status: t.status,
    }));
}
