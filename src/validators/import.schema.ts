/**
 * Import Zod Schemas
 * 
 * Validates Excel/CSV import data, column mapping, and bulk transaction import.
 * 
 * @module validators/import.schema
 */
import { z } from 'zod';

/** Column mapping validation */
export const importMappingSchema = z.object({
    dateColumn: z.string().min(1, 'Coluna de data é obrigatória.'),
    descriptionColumn: z.string().min(1, 'Coluna de descrição é obrigatória.'),
    amountColumn: z.string().min(1, 'Coluna de valor é obrigatória.'),
    typeColumn: z.string().optional(), // Optional: if bank provides type (income/expense)
});

/** Single transaction row from import */
export const importTransactionRowSchema = z.object({
    date: z.coerce.date({ error: 'Data inválida.' }),
    description: z.string().min(1, 'Descrição é obrigatória.').max(255),
    amount: z.number().min(0.01, 'Valor deve ser positivo.'),
    type: z.enum(['INCOME', 'EXPENSE']),
    externalId: z.string().optional(), // SHA-256 hash for deduplication
});

/** Bulk import confirmation */
export const importConfirmSchema = z.object({
    accountId: z.string().uuid('ID da conta inválido.'),
    defaultSubcategoryId: z.string().uuid('ID da subcategoria padrão inválido.'),
    transactions: z.array(importTransactionRowSchema).min(1, 'Nenhuma transação para importar.'),
    bankSource: z.string().optional(), // e.g. "nubank", "mercadopago", "caixa"
    fileName: z.string().min(1, 'Nome do arquivo é obrigatório.'),
});

/** Type inference from schemas */
export type ImportMappingInput = z.infer<typeof importMappingSchema>;
export type ImportTransactionRow = z.infer<typeof importTransactionRowSchema>;
export type ImportConfirmInput = z.infer<typeof importConfirmSchema>;
