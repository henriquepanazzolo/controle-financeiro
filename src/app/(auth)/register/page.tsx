/**
 * Register Page — Invite-only registration
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUser } from '@/actions/auth';
import styles from '../login/auth.module.css';

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await registerUser(formData);

            if (result.success) {
                router.push('/login');
            } else {
                setError(result.error ?? 'Erro ao criar conta.');
            }
        } catch {
            setError('Erro ao criar conta. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <span className={styles.authLogo}>💰</span>
                    <h1 className={styles.authTitle}>Criar Conta</h1>
                    <p className={styles.authSubtitle}>Registre-se com um código de convite</p>
                </div>

                {error && <div className={styles.authError}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.authForm}>
                    <div className="input-group">
                        <label htmlFor="inviteCode">Código de Convite</label>
                        <input
                            id="inviteCode"
                            name="inviteCode"
                            type="text"
                            className="input"
                            placeholder="XXXXXX"
                            required
                            autoComplete="off"
                            style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="name">Nome</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            className="input"
                            placeholder="Seu nome"
                            required
                            autoComplete="name"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="input"
                            placeholder="seu@email.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Senha</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="input"
                            placeholder="Min. 8 caracteres, 1 maiúscula, 1 número"
                            required
                            autoComplete="new-password"
                            minLength={8}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirmar Senha</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            className="input"
                            placeholder="Repita a senha"
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn--primary btn--lg"
                        disabled={loading}
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Criando conta...' : 'Criar Conta'}
                    </button>
                </form>

                <p className={styles.authFooter}>
                    Já tem conta?{' '}
                    <Link href="/login">Fazer login</Link>
                </p>
            </div>
        </div>
    );
}
