/**
 * Prisma Client Singleton
 * 
 * Prevents multiple Prisma instances during Next.js hot-reload.
 * Uses globalThis to persist the client across module reloads.
 * 
 * Prisma v7 requires a driver adapter for direct database connections.
 * 
 * @see https://www.prisma.io/docs/guides/nextjs
 */
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

/**
 * Singleton Prisma client instance.
 * In development, attaches to globalThis to survive hot-reloads.
 * In production, creates a fresh instance per cold start.
 */
function createPrismaClient(): PrismaClient {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }

    // Configura o pool de conexões do PostgreSQL
    const pool = new Pool({ connectionString });

    // Inicializa o adaptador do Prisma para PostgreSQL
    const adapter = new PrismaPg(pool);

    return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
    globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
