/**
 * Goal Zod Schemas
 * 
 * @module validators/goal.schema
 */
import { z } from 'zod';

export const goalSchema = z.object({
    name: z
        .string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres.')
        .max(100, 'Nome muito longo.')
        .transform((val) => val.trim()),
    description: z
        .string()
        .max(500, 'Descrição muito longa.')
        .optional()
        .transform((val) => val?.trim() || undefined),
    targetAmount: z
        .number()
        .positive('Valor alvo deve ser positivo.')
        .max(999999999.99, 'Valor alvo excede o máximo.'),
    deadline: z.coerce.date().optional(),
});

export const goalContributionSchema = z.object({
    goalId: z.string().uuid('ID da meta inválido.'),
    amount: z
        .number()
        .positive('Valor da contribuição deve ser positivo.')
        .max(999999999.99, 'Valor excede o máximo.'),
    notes: z
        .string()
        .max(255, 'Observação muito longa.')
        .optional()
        .transform((val) => val?.trim() || undefined),
});

export type GoalInput = z.infer<typeof goalSchema>;
export type GoalContributionInput = z.infer<typeof goalContributionSchema>;
