/**
 * Database Seed Script
 * 
 * Creates an initial admin user with invite code for first login.
 * Run with: npx tsx prisma/seed.ts
 */
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis do .env.local (padrão do Next.js)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
// Fallback para .env se necessário
dotenv.config();

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is required. Set it in .env or .env.local');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    // Create initial invite code
    const inviteCode = 'FINANCE2026';
    const existingInvite = await prisma.inviteCode.findUnique({ where: { code: inviteCode } });

    if (!existingInvite) {
        // First, create a temporary admin user for the invite code
        const adminPasswordHash = await bcrypt.hash('Admin@2026', 12);

        const admin = await prisma.user.upsert({
            where: { email: 'admin@financepro.app' },
            update: {},
            create: {
                name: 'Administrador',
                email: 'admin@financepro.app',
                passwordHash: adminPasswordHash,
            },
        });

        // Create default account for admin
        const existingAccount = await prisma.account.findFirst({ where: { userId: admin.id } });
        if (!existingAccount) {
            await prisma.account.create({
                data: {
                    userId: admin.id,
                    name: 'Carteira',
                    type: 'CASH',
                    icon: '💵',
                    color: '#10B981',
                },
            });
        }

        // Create invite code
        await prisma.inviteCode.create({
            data: {
                code: inviteCode,
                createdByUserId: admin.id,
                expiresAt: new Date('2027-12-31'),
            },
        });

        // Seed default categories for admin
        const defaults = [
            { name: 'Alimentação', type: 'EXPENSE' as const, icon: '🍽️', color: '#FF6B6B', subs: ['Restaurante', 'Supermercado', 'Padaria'] },
            { name: 'Transporte', type: 'EXPENSE' as const, icon: '🚗', color: '#4ECDC4', subs: ['Combustível', 'Transporte público', 'Manutenção'] },
            { name: 'Moradia', type: 'EXPENSE' as const, icon: '🏠', color: '#A78BFA', subs: ['Aluguel', 'Condomínio', 'Luz', 'Água'] },
            { name: 'Saúde', type: 'EXPENSE' as const, icon: '💊', color: '#45B7D1', subs: ['Consultas', 'Medicamentos', 'Plano de saúde'] },
            { name: 'Educação', type: 'EXPENSE' as const, icon: '📚', color: '#96CEB4', subs: ['Cursos', 'Livros', 'Materiais'] },
            { name: 'Lazer', type: 'EXPENSE' as const, icon: '🎮', color: '#FFEAA7', subs: ['Cinema', 'Viagens', 'Hobbies'] },
            { name: 'Vestuário', type: 'EXPENSE' as const, icon: '👔', color: '#DDA0DD', subs: ['Roupas', 'Calçados'] },
            { name: 'Assinaturas', type: 'EXPENSE' as const, icon: '📺', color: '#74B9FF', subs: ['Streaming', 'Softwares'] },
            { name: 'Salário', type: 'INCOME' as const, icon: '💰', color: '#10B981', subs: ['CLT', 'PJ'] },
            { name: 'Freelance', type: 'INCOME' as const, icon: '💻', color: '#6BCB77', subs: ['Projetos', 'Consultorias'] },
            { name: 'Investimentos', type: 'INCOME' as const, icon: '📈', color: '#F9CA24', subs: ['Rendimentos', 'Dividendos'] },
        ];

        for (const cat of defaults) {
            const created = await prisma.category.create({
                data: { userId: admin.id, name: cat.name, type: cat.type, icon: cat.icon, color: cat.color, isDefault: true },
            });
            await prisma.subcategory.createMany({
                data: cat.subs.map((name) => ({ categoryId: created.id, name })),
            });
        }

        console.log(`✅ Admin user created: admin@financepro.app`);
        console.log(`✅ Invite code created: ${inviteCode}`);
        console.log(`✅ Default categories seeded`);
    } else {
        console.log('ℹ️ Database already seeded, skipping.');
    }

    console.log('🌱 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
