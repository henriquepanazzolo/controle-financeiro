/**
 * Login Page
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginUser } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertCircle, Wallet } from 'lucide-react';

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
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
            </div>

            <Card className="w-full max-w-md border-slate-800/50 bg-slate-900/40 backdrop-blur-xl shadow-2xl relative z-10">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-blue-600 to-cyan-500 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        FinancePro
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Faça login para continuar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-slate-300">Email</label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="seu@email.com"
                                required
                                autoComplete="email"
                                className="bg-slate-950/50 border-slate-800 focus:border-blue-500/50 focus:ring-blue-500/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="text-sm font-medium text-slate-300">Senha</label>
                                <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                    Esqueceu a senha?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                className="bg-slate-950/50 border-slate-800 focus:border-blue-500/50 focus:ring-blue-500/20"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/20 transition-all duration-300"
                            disabled={loading}
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-slate-800/50 pt-6">
                    <p className="text-sm text-slate-400">
                        Não tem conta?{' '}
                        <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                            Registrar com convite
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
