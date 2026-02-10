/**
 * Transaction Zod Schemas
 * 
 * Validates transaction creation and update inputs.
 * 
 * @module validators/transaction.schema
 */
import { z } from 'zod';

/** Transaction creation/update validation */
export const transactionSchema = z.object({
    accountId: z.string().uuid('ID da conta inválido.'),
    subcategoryId: z.string().uuid('ID da subcategoria inválido.'),
    type: z.enum(['INCOME', 'EXPENSE'], {
        error: 'Tipo deve ser INCOME ou EXPENSE.',
    }),
    amount: z
        .number()
        .positive('Valor deve ser positivo.')
        .max(999999999.99, 'Valor excede o limite.'),
    description: z
        .string()
        .min(1, 'Descrição é obrigatória.')
        .max(255, 'Descrição muito longa.')
        .transform((val) => val.trim()),
    notes: z
        .string()
        .max(1000, 'Observação muito longa.')
        .optional()
        .transform((val) => val?.trim() || undefined),
    date: z.coerce.date({ error: 'Data inválida.' }),
    status: z.enum(['PAID', 'PENDING', 'OVERDUE']).default('PENDING'),
    isRecurring: z.boolean().default(false),
    recurrenceType: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY']).optional(),
    recurrenceEndDate: z.coerce.date().optional(),
});

/** Schema for updating transaction status */
export const updateTransactionStatusSchema = z.object({
    id: z.string().uuid('ID da transação inválido.'),
    status: z.enum(['PAID', 'PENDING', 'OVERDUE']),
});

/** Type inference from schemas */
export type TransactionInput = z.infer<typeof transactionSchema>;
export type UpdateTransactionStatusInput = z.infer<typeof updateTransactionStatusSchema>;
