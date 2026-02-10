/**
 * Budget Zod Schemas
 * 
 * @module validators/budget.schema
 */
import { z } from 'zod';

export const budgetSchema = z.object({
    categoryId: z.string().uuid('ID da categoria inválido.'),
    limitAmount: z
        .number()
        .positive('Limite deve ser positivo.')
        .max(999999999.99, 'Limite excede o máximo.'),
    month: z.number().int().min(1, 'Mês inválido.').max(12, 'Mês inválido.'),
    year: z.number().int().min(2020, 'Ano inválido.').max(2100, 'Ano inválido.'),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
