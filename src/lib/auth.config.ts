import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-compatible NextAuth configuration.
 * 
 * This config is used by Middleware (Edge Runtime) and extends
 * into the full auth.ts (Server Runtime).
 * 
 * It must NOT import any database adapters or non-Edge modules (like 'bcryptjs' or 'prisma').
 */
export const authConfig = {
    providers: [], // Providers configured in auth.ts
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: '/login',
        newUser: '/register',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token?.id && session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
        async authorized({ auth }) {
            return !!auth?.user;
        },
    },
} satisfies NextAuthConfig;
