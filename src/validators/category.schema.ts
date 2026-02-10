/**
 * Category & Subcategory Zod Schemas
 * 
 * @module validators/category.schema
 */
import { z } from 'zod';

export const categorySchema = z.object({
    name: z
        .string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres.')
        .max(50, 'Nome muito longo.')
        .transform((val) => val.trim()),
    type: z.enum(['INCOME', 'EXPENSE'], {
        error: 'Tipo deve ser INCOME ou EXPENSE.',
    }),
    icon: z.string().max(10).optional(),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um hex válido (#RRGGBB).')
        .optional(),
});

export const subcategorySchema = z.object({
    categoryId: z.string().uuid('ID da categoria inválido.'),
    name: z
        .string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres.')
        .max(50, 'Nome muito longo.')
        .transform((val) => val.trim()),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type SubcategoryInput = z.infer<typeof subcategorySchema>;
