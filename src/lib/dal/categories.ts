/**
 * Categories Data Access Layer
 * 
 * Row-level security: all queries filter by userId.
 * Categories are never deleted, only deactivated (isActive=false).
 * 
 * @module lib/dal/categories
 */
import { prisma } from '@/lib/prisma';

/** DTO for category with subcategories */
export interface CategoryDTO {
    id: string;
    name: string;
    type: 'INCOME' | 'EXPENSE';
    icon: string | null;
    color: string | null;
    isDefault: boolean;
    isActive: boolean;
    subcategories: SubcategoryDTO[];
}

export interface SubcategoryDTO {
    id: string;
    name: string;
    isActive: boolean;
}

/**
 * Gets all categories for a user, grouped by type.
 */
export async function getCategoriesByUser(
    userId: string,
    includeInactive: boolean = false,
): Promise<CategoryDTO[]> {
    const categories = await prisma.category.findMany({
        where: {
            userId,
            ...(includeInactive ? {} : { isActive: true }),
        },
        select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            color: true,
            isDefault: true,
            isActive: true,
            subcategories: {
                where: includeInactive ? {} : { isActive: true },
                select: { id: true, name: true, isActive: true },
                orderBy: { name: 'asc' },
            },
        },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
        isDefault: c.isDefault,
        isActive: c.isActive,
        subcategories: c.subcategories,
    }));
}

/**
 * Creates a new category.
 */
export async function createCategory(
    userId: string,
    data: { name: string; type: 'INCOME' | 'EXPENSE'; icon?: string; color?: string },
) {
    return prisma.category.create({
        data: { userId, ...data },
    });
}

/**
 * Creates a new subcategory.
 */
export async function createSubcategory(
    userId: string,
    data: { categoryId: string; name: string },
) {
    // Verify category belongs to user
    const category = await prisma.category.findFirst({
        where: { id: data.categoryId, userId },
    });

    if (!category) {
        throw new Error('Categoria não encontrada.');
    }

    return prisma.subcategory.create({
        data: { categoryId: data.categoryId, name: data.name },
    });
}

/**
 * Toggles category active state (soft delete/restore).
 */
export async function toggleCategoryActive(
    userId: string,
    categoryId: string,
): Promise<void> {
    const category = await prisma.category.findFirst({
        where: { id: categoryId, userId },
    });

    if (!category) {
        throw new Error('Categoria não encontrada.');
    }

    await prisma.category.update({
        where: { id: categoryId },
        data: { isActive: !category.isActive },
    });
}

/**
 * Seed default categories for a new user.
 */
export async function seedDefaultCategories(userId: string): Promise<void> {
    const defaults = [
        { name: 'Alimentação', type: 'EXPENSE' as const, icon: '🍽️', color: '#FF6B6B', subs: ['Restaurante', 'Supermercado', 'Padaria'] },
        { name: 'Transporte', type: 'EXPENSE' as const, icon: '🚗', color: '#4ECDC4', subs: ['Combustível', 'Transporte público', 'Manutenção'] },
        { name: 'Moradia', type: 'EXPENSE' as const, icon: '🏠', color: '#A78BFA', subs: ['Aluguel', 'Condomínio', 'Conta de luz', 'Conta de água'] },
        { name: 'Saúde', type: 'EXPENSE' as const, icon: '💊', color: '#45B7D1', subs: ['Consultas', 'Medicamentos', 'Plano de saúde'] },
        { name: 'Educação', type: 'EXPENSE' as const, icon: '📚', color: '#96CEB4', subs: ['Cursos', 'Livros', 'Materiais'] },
        { name: 'Lazer', type: 'EXPENSE' as const, icon: '🎮', color: '#FFEAA7', subs: ['Cinema', 'Viagens', 'Hobbies'] },
        { name: 'Vestuário', type: 'EXPENSE' as const, icon: '👔', color: '#DDA0DD', subs: ['Roupas', 'Calçados', 'Acessórios'] },
        { name: 'Delivery', type: 'EXPENSE' as const, icon: '🛵', color: '#FF8C42', subs: ['Apps de entrega', 'Entregas'] },
        { name: 'Assinaturas', type: 'EXPENSE' as const, icon: '📺', color: '#74B9FF', subs: ['Streaming', 'Softwares', 'Outros'] },
        { name: 'Salário', type: 'INCOME' as const, icon: '💰', color: '#10B981', subs: ['CLT', 'PJ'] },
        { name: 'Freelance', type: 'INCOME' as const, icon: '💻', color: '#6BCB77', subs: ['Projetos', 'Consultorias'] },
        { name: 'Softwares', type: 'INCOME' as const, icon: '🖥️', color: '#48BFE3', subs: ['Vendas', 'Licenças', 'SaaS'] },
        { name: 'Investimentos', type: 'INCOME' as const, icon: '📈', color: '#F9CA24', subs: ['Rendimentos', 'Dividendos'] },
        { name: 'Outros', type: 'INCOME' as const, icon: '💵', color: '#A3CB38', subs: ['Outros'] },
    ];

    for (const cat of defaults) {
        const created = await prisma.category.create({
            data: {
                userId,
                name: cat.name,
                type: cat.type,
                icon: cat.icon,
                color: cat.color,
                isDefault: true,
            },
        });

        await prisma.subcategory.createMany({
            data: cat.subs.map((name) => ({
                categoryId: created.id,
                name,
            })),
        });
    }
}
