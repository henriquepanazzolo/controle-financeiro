/**
 * Login Page
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginUser } from '@/actions/auth';
import styles from './auth.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await loginUser(formData);

            if (result.success) {
                router.push('/');
                router.refresh();
            } else {
                setError(result.error ?? 'Erro ao fazer login.');
            }
        } catch {
            setError('Erro ao fazer login. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <span className={styles.authLogo}>💰</span>
                    <h1 className={styles.authTitle}>FinancePro</h1>
                    <p className={styles.authSubtitle}>Faça login para continuar</p>
                </div>

                {error && <div className={styles.authError}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.authForm}>
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
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn--primary btn--lg"
                        disabled={loading}
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <p className={styles.authFooter}>
                    Não tem conta?{' '}
                    <Link href="/register">Registrar com convite</Link>
                </p>
            </div>
        </div>
    );
}
