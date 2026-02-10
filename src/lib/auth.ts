/**
 * NextAuth.js v5 Configuration
 * 
 * Credentials-based authentication with bcrypt password hashing.
 * JWT sessions for stateless auth without database sessions.
 * 
 * Security: Auth checks must also happen in Server Actions,
 * never rely on middleware alone.
 * 
 * @module lib/auth
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type { NextAuthConfig } from 'next-auth';

/** Extend NextAuth types to include userId in session */
declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            name: string;
            email: string;
        };
    }
    interface User {
        id: string;
        name: string;
        email: string;
    }
}

declare module 'next-auth' {
    interface JWT {
        id: string;
    }
}

import { authConfig } from '@/lib/auth.config';

/**
 * Full Auth Configuration (Node.js / Server Runtime).
 * Adds Credentials provider with Database access.
 */
const config: NextAuthConfig = {
    ...authConfig,
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Senha', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                const user = await prisma.user.findUnique({
                    where: { email: email.toLowerCase().trim() },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        passwordHash: true,
                    },
                });

                console.log(`[Auth] Login attempt: ${email} - User found: ${!!user}`);

                if (!user) {
                    return null;
                }

                const isValid = await bcrypt.compare(password, user.passwordHash);
                console.log(`[Auth] Password valid: ${isValid}`);

                if (!isValid) {
                    return null;
                }

                // Return user without passwordHash (DTO pattern)
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                };
            },
        }),
    ],
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);

/**
 * Gets the authenticated user ID from the current session.
 * Throws if not authenticated — use in Server Actions for security.
 * 
 * @returns The authenticated user's ID
 * @throws Error if no valid session exists
 */
export async function getAuthenticatedUserId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Não autorizado. Faça login para continuar.');
    }
    return session.user.id;
}
