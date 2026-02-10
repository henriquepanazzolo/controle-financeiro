/**
 * Next.js Middleware — Auth Guard
 * 
 * Protects dashboard routes by checking for valid sessions.
 * Public routes (login, register, API) are allowed through.
 * 
 * Uses NextAuth's auth() helper which is Edge-compatible.
 * Does NOT import Prisma (node:* modules aren't supported in Edge Runtime).
 * 
 * @module middleware
 */
import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

/** Routes that don't require authentication */
const PUBLIC_ROUTES = ['/login', '/register', '/api/auth'];

const { auth } = NextAuth(authConfig);

export default auth((request) => {
    const { pathname } = request.nextUrl;

    // Allow public routes
    const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
    if (isPublic) {
        return NextResponse.next();
    }

    // Check auth — auth() middleware wrapper provides request.auth
    if (!request.auth?.user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Add security headers
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
});

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico (browser icon)
         * - public files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
