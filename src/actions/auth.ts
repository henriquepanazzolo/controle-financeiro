/**
 * Auth Server Actions
 * 
 * Registration with invite code and login via NextAuth signIn.
 * 
 * @module actions/auth
 */
'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signIn } from '@/lib/auth';
import { registerSchema, loginSchema } from '@/validators/auth.schema';
import { seedDefaultCategories } from '@/lib/dal/categories';

/** Standard action result type */
interface ActionResult {
    success: boolean;
    error?: string;
}

const BCRYPT_COST = 12;

/**
 * Registers a new user with an invite code.
 * Creates default categories and a default cash account.
 */
export async function registerUser(formData: FormData): Promise<ActionResult> {
    try {
        const raw = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            confirmPassword: formData.get('confirmPassword') as string,
            inviteCode: formData.get('inviteCode') as string,
        };

        // Validate input
        const parsed = registerSchema.safeParse(raw);
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message ?? 'Dados inválidos.';
            return { success: false, error: firstError };
        }

        const { name, email, password, inviteCode } = parsed.data;

        // Check invite code
        const invite = await prisma.inviteCode.findUnique({
            where: { code: inviteCode },
        });

        if (!invite || invite.isUsed || invite.expiresAt < new Date()) {
            return { success: false, error: 'Código de convite inválido ou expirado.' };
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return { success: false, error: 'Este email já está cadastrado.' };
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

        // Create user + default account + mark invite as used (transaction)
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: { name, email, passwordHash },
            });

            // Create default cash account
            await tx.account.create({
                data: {
                    userId: newUser.id,
                    name: 'Carteira',
                    type: 'CASH',
                    icon: '💵',
                    color: '#10B981',
                },
            });

            // Mark invite as used
            await tx.inviteCode.update({
                where: { id: invite.id },
                data: { isUsed: true, usedByEmail: email },
            });

            return newUser;
        });

        // Seed default categories (outside transaction for performance)
        await seedDefaultCategories(user.id);

        return { success: true };
    } catch (error) {
        console.error('[registerUser] Error:', error);
        return { success: false, error: 'Erro ao criar conta. Tente novamente.' };
    }
}

/**
 * Authenticates a user via credentials.
 */
export async function loginUser(formData: FormData): Promise<ActionResult> {
    try {
        const raw = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
        };

        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) {
            return { success: false, error: 'Credenciais inválidas.' };
        }

        await signIn('credentials', {
            email: parsed.data.email,
            password: parsed.data.password,
            redirect: false,
        });

        return { success: true };
    } catch (error: unknown) {
        // NextAuth throws specific error types
        if (error && typeof error === 'object' && 'type' in error) {
            return { success: false, error: 'Email ou senha incorretos.' };
        }
        return { success: false, error: 'Email ou senha incorretos.' };
    }
}
