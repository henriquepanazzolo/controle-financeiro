/**
 * NextAuth.js API Route Handler
 * 
 * Exposes /api/auth/* endpoints for NextAuth.js.
 * 
 * @module app/api/auth/[...nextauth]/route
 */
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
