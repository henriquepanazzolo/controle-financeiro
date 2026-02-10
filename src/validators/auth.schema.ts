/**
 * Authentication Zod Schemas
 * 
 * Validates login, registration, and invite code inputs.
 * 
 * @module validators/auth.schema
 */
import { z } from 'zod';

/** Login form validation */
export const loginSchema = z.object({
    email: z
        .string()
        .email('Email inválido.')
        .max(255, 'Email muito longo.')
        .transform((val) => val.toLowerCase().trim()),
    password: z
        .string()
        .min(1, 'Senha é obrigatória.'),
});

/** Registration form validation */
export const registerSchema = z.object({
    name: z
        .string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres.')
        .max(100, 'Nome muito longo.')
        .transform((val) => val.trim()),
    email: z
        .string()
        .email('Email inválido.')
        .max(255, 'Email muito longo.')
        .transform((val) => val.toLowerCase().trim()),
    password: z
        .string()
        .min(8, 'Senha deve ter pelo menos 8 caracteres.')
        .max(128, 'Senha muito longa.')
        .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula.')
        .regex(/[0-9]/, 'Senha deve conter pelo menos um número.'),
    confirmPassword: z
        .string()
        .min(1, 'Confirmação de senha é obrigatória.'),
    inviteCode: z
        .string()
        .min(1, 'Código de convite é obrigatório.')
        .transform((val) => val.trim().toUpperCase()),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
});

/** Type inference from schemas */
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
