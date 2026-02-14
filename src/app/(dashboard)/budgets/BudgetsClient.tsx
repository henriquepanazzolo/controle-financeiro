/**
 * Budgets Client — Budget cards with progress bars
 */
'use client';

import { useState, useCallback } from 'react';
import { formatCurrency } from '@/utils/formatCurrency';
import { upsertBudget as upsertBudgetAction, deleteBudget as deleteBudgetAction } from '@/actions/budgets';
import type { BudgetDTO } from '@/lib/dal/budgets';
import type { CategoryDTO } from '@/lib/dal/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Plus, Trash2, X, Wallet, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
    budgets: BudgetDTO[];
    categories: CategoryDTO[];
    month: number;
    year: number;
}

export default function BudgetsClient({ budgets, categories, month, year }: Props) {
    const [showForm, setShowForm] = useState(false);

    const handleCreate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set('month', String(month));
        fd.set('year', String(year));
        await upsertBudgetAction(fd);
        setShowForm(false);
        window.location.reload();
    }, [month, year]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm('Excluir este orçamento?')) return;
        const fd = new FormData();
        fd.set('id', id);
        await deleteBudgetAction(fd);
        window.location.reload();
    }, []);

    const totalBudget = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
    const available = totalBudget - totalSpent;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-100">Orçamentos</h1>
                    <p className="text-slate-400">Defina limites e acompanhe seus gastos</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/20">
                    <Plus className="w-4 h-4 mr-2" /> Novo Orçamento
                </Button>
            </div>

            {/* Overall Summary */}
            <Card className="glass-card bg-gradient-to-br from-blue-600/20 to-cyan-500/20 border-blue-500/30 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-32 bg-blue-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                <CardContent className="p-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-blue-200">Total Orçado</span>
                            <p className="text-3xl font-bold font-display text-white">{formatCurrency(totalBudget)}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-blue-200">Total Gasto</span>
                            <p className="text-3xl font-bold font-display text-white">{formatCurrency(totalSpent)}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-blue-200">Disponível</span>
                            <p className={cn(
                                "text-3xl font-bold font-display",
                                available >= 0 ? "text-emerald-300" : "text-rose-300"
                            )}>{formatCurrency(available)}</p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-blue-200 mb-2 font-medium">
                            <span>Progresso Geral</span>
                            <span>{Math.min((totalSpent / (totalBudget || 1)) * 100, 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-3 bg-slate-900/40 rounded-full overflow-hidden backdrop-blur-sm ring-1 ring-white/10">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-500 shadow-lg shadow-current",
                                    totalSpent > totalBudget ? "bg-rose-500" : "bg-gradient-to-r from-blue-400 to-cyan-400"
                                )}
                                style={{ width: `${Math.min((totalSpent / (totalBudget || 1)) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Budget Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {budgets.length === 0 ? (
                    <Card className="glass-card py-12 col-span-full text-center text-slate-500">
                        <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Nenhum orçamento definido para este mês.</p>
                    </Card>
                ) : (
                    budgets.map((b) => {
                        const overBudget = b.spentAmount > b.limitAmount;
                        const percentage = b.percentage;

                        return (
                            <Card key={b.id} className="glass-card border-slate-800/50 hover:bg-slate-800/20 transition-all">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl shadow-inner">
                                                {b.categoryIcon ?? '📁'}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-100">{b.categoryName}</h3>
                                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                                    {formatCurrency(b.spentAmount)} <span className="text-slate-600">de</span> {formatCurrency(b.limitAmount)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-xs font-bold ring-1 ring-inset",
                                                overBudget
                                                    ? "bg-rose-500/10 text-rose-400 ring-rose-500/20"
                                                    : percentage > 80
                                                        ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                                                        : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                                            )}>
                                                {percentage.toFixed(0)}%
                                            </span>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500 hover:text-rose-400" onClick={() => handleDelete(b.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-500",
                                                    overBudget
                                                        ? "bg-rose-500"
                                                        : percentage > 80
                                                            ? "bg-amber-400"
                                                            : "bg-emerald-400"
                                                )}
                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className={cn(
                                                "font-medium",
                                                overBudget ? "text-rose-400" : "text-slate-400"
                                            )}>
                                                {overBudget ? 'Excedido' : 'Restante'}
                                            </span>
                                            <span className={cn(
                                                "font-medium",
                                                available >= 0 ? "text-slate-300" : "text-rose-400"
                                            )}>
                                                {formatCurrency(b.limitAmount - b.spentAmount)}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Create Budget Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg bg-slate-900 border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <div className="absolute top-4 right-4">
                            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="h-8 w-8 text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-slate-100 mb-6">Novo Orçamento</h2>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400">Categoria</label>
                                    <select name="categoryId" className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50" required>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400">Limite (R$)</label>
                                    <Input name="limitAmount" type="number" step="0.01" min="0.01" className="bg-slate-950 border-slate-800" required placeholder="0,00" />
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white mt-4">
                                    Definir Orçamento
                                </Button>
                            </form>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
