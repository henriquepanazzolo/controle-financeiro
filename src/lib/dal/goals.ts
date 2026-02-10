/**
 * Goals Data Access Layer
 * 
 * @module lib/dal/goals
 */
import { prisma } from '@/lib/prisma';

export interface GoalDTO {
    id: string;
    name: string;
    description: string | null;
    targetAmount: number;
    currentAmount: number;
    percentage: number;
    deadline: Date | null;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    estimatedMonths: number | null;
    contributions: GoalContributionDTO[];
    createdAt: Date;
}

export interface GoalContributionDTO {
    id: string;
    amount: number;
    date: Date;
    notes: string | null;
}

/**
 * Gets all goals for a user.
 */
export async function getGoalsByUser(
    userId: string,
    status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED',
): Promise<GoalDTO[]> {
    const goals = await prisma.goal.findMany({
        where: { userId, ...(status && { status }) },
        select: {
            id: true,
            name: true,
            description: true,
            targetAmount: true,
            currentAmount: true,
            deadline: true,
            status: true,
            createdAt: true,
            contributions: {
                select: { id: true, amount: true, date: true, notes: true },
                orderBy: { date: 'desc' },
                take: 10,
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return goals.map((g) => {
        const target = Number(g.targetAmount);
        const current = Number(g.currentAmount);
        const percentage = target > 0 ? (current / target) * 100 : 0;

        // Estimate months to completion based on contribution pace
        let estimatedMonths: number | null = null;
        if (g.contributions.length >= 2 && current < target) {
            const sortedContribs = [...g.contributions].sort(
                (a, b) => a.date.getTime() - b.date.getTime(),
            );
            const firstDate = sortedContribs[0].date;
            const lastDate = sortedContribs[sortedContribs.length - 1].date;
            const monthsDiff = Math.max(
                1,
                (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
            );
            const monthlyRate = current / monthsDiff;
            if (monthlyRate > 0) {
                estimatedMonths = Math.ceil((target - current) / monthlyRate);
            }
        }

        return {
            id: g.id,
            name: g.name,
            description: g.description,
            targetAmount: target,
            currentAmount: current,
            percentage: Math.min(percentage, 100),
            deadline: g.deadline,
            status: g.status,
            estimatedMonths,
            contributions: g.contributions.map((c) => ({
                id: c.id,
                amount: Number(c.amount),
                date: c.date,
                notes: c.notes,
            })),
            createdAt: g.createdAt,
        };
    });
}

/**
 * Creates a new goal.
 */
export async function createGoal(
    userId: string,
    data: { name: string; description?: string; targetAmount: number; deadline?: Date },
) {
    return prisma.goal.create({
        data: { userId, ...data },
    });
}

/**
 * Adds a contribution to a goal and updates currentAmount.
 */
export async function addGoalContribution(
    userId: string,
    data: { goalId: string; amount: number; notes?: string },
) {
    const goal = await prisma.goal.findFirst({
        where: { id: data.goalId, userId, status: 'ACTIVE' },
    });
    if (!goal) throw new Error('Meta não encontrada ou não está ativa.');

    const newAmount = Number(goal.currentAmount) + data.amount;
    const targetReached = newAmount >= Number(goal.targetAmount);

    const [contribution] = await prisma.$transaction([
        prisma.goalContribution.create({
            data: { goalId: data.goalId, amount: data.amount, notes: data.notes },
        }),
        prisma.goal.update({
            where: { id: data.goalId },
            data: {
                currentAmount: newAmount,
                status: targetReached ? 'COMPLETED' : 'ACTIVE',
            },
        }),
    ]);

    return contribution;
}

/**
 * Cancels a goal.
 */
export async function cancelGoal(userId: string, goalId: string): Promise<void> {
    const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
    if (!goal) throw new Error('Meta não encontrada.');
    await prisma.goal.update({ where: { id: goalId }, data: { status: 'CANCELLED' } });
}
