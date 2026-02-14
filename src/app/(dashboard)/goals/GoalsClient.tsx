/**
 * Goals Client — Goal cards with progress, contributions, and estimates
 */
'use client';

import { useState, useCallback } from 'react';
import { formatCurrency } from '@/utils/formatCurrency';
import { createGoal as createGoalAction, addContribution as addContributionAction, cancelGoal as cancelGoalAction } from '@/actions/goals';
import type { GoalDTO } from '@/lib/dal/goals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Plus, Trash2, X, Target, TrendingUp, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface Props {
    goals: GoalDTO[];
}

export default function GoalsClient({ goals }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [addingTo, setAddingTo] = useState<string | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

    const filtered = filter === 'ALL'
        ? goals
        : goals.filter((g) => g.status === filter);

    const handleCreate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await createGoalAction(fd);
        setShowForm(false);
        window.location.reload();
    }, []);

    const handleContribute = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await addContributionAction(fd);
        setAddingTo(null);
        window.location.reload();
    }, []);

    const handleCancel = useCallback(async (goalId: string) => {
        if (!confirm('Cancelar esta meta?')) return;
        const fd = new FormData();
        fd.set('goalId', goalId);
        await cancelGoalAction(fd);
        window.location.reload();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-100">Metas Financeiras</h1>
                    <p className="text-slate-400">Planeje e conquiste seus objetivos</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/20">
                    <Plus className="w-4 h-4 mr-2" /> Nova Meta
                </Button>
            </div>

            <Card className="glass-card p-2 md:w-fit">
                <div className="flex gap-2 p-1">
                    {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                                filter === f
                                    ? "bg-slate-700 text-white shadow-sm"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                            )}
                        >
                            {f === 'ALL' ? 'Todas' : f === 'ACTIVE' ? '🎯 Ativas' : '✅ Concluídas'}
                        </button>
                    ))}
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.length === 0 ? (
                    <Card className="glass-card py-12 col-span-full text-center text-slate-500">
                        <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Nenhuma meta encontrada.</p>
                    </Card>
                ) : (
                    filtered.map((goal) => (
                        <Card key={goal.id} className="glass-card border-slate-800/50 hover:bg-slate-800/20 transition-all flex flex-col h-full">
                            <CardContent className="p-6 flex flex-col h-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-slate-100 text-lg">{goal.name}</h3>
                                        {goal.description && <p className="text-sm text-slate-400 mt-1 line-clamp-2">{goal.description}</p>}
                                    </div>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-xs font-bold ring-1 ring-inset whitespace-nowrap ml-2",
                                        goal.status === 'ACTIVE'
                                            ? "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                                            : goal.status === 'COMPLETED'
                                                ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                                                : "bg-rose-500/10 text-rose-400 ring-rose-500/20"
                                    )}>
                                        {goal.status === 'ACTIVE' ? 'Ativa' : goal.status === 'COMPLETED' ? 'Concluída' : 'Cancelada'}
                                    </span>
                                </div>

                                <div className="space-y-4 flex-1">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-slate-300 font-medium">{formatCurrency(goal.currentAmount)}</span>
                                            <span className="text-slate-500">de {formatCurrency(goal.targetAmount)}</span>
                                        </div>
                                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden container-type-size">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-500 relative",
                                                    goal.percentage >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-blue-500 to-purple-500"
                                                )}
                                                style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                                            >
                                                {goal.percentage > 0 && (
                                                    <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/50 shadow-[0_0_10px_white]" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-end mt-1">
                                            <span className={cn(
                                                "text-xs font-bold",
                                                goal.percentage >= 100 ? "text-emerald-400" : "text-blue-400"
                                            )}>{goal.percentage.toFixed(0)}%</span>
                                        </div>
                                    </div>

                                    {goal.estimatedMonths !== null && goal.status === 'ACTIVE' && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 p-2 rounded-md border border-slate-700/50">
                                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                                            <span>Estimativa: ~{goal.estimatedMonths} {goal.estimatedMonths === 1 ? 'mês' : 'meses'}</span>
                                        </div>
                                    )}

                                    {/* Inline contribution form */}
                                    {addingTo === goal.id ? (
                                        <form onSubmit={handleContribute} className="flex flex-col gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-top-2">
                                            <p className="text-xs font-medium text-slate-300">Nova Contribuição</p>
                                            <div className="flex gap-2">
                                                <Input name="goalId" type="hidden" value={goal.id} />
                                                <Input name="amount" type="number" step="0.01" min="0.01" className="h-8 text-xs bg-slate-950 border-slate-600" placeholder="Valor" required autoFocus />
                                            </div>
                                            <Input name="notes" className="h-8 text-xs bg-slate-950 border-slate-600" placeholder="Nota (opcional)" />
                                            <div className="flex gap-2 mt-1">
                                                <Button type="submit" size="sm" className="h-7 text-xs flex-1 bg-blue-600 hover:bg-blue-500">Confirmar</Button>
                                                <Button type="button" size="sm" variant="ghost" onClick={() => setAddingTo(null)} className="h-7 text-xs px-2 text-slate-400 hover:text-white">Cancelar</Button>
                                            </div>
                                        </form>
                                    ) : (
                                        goal.status === 'ACTIVE' && (
                                            <div className="flex gap-2 pt-2">
                                                <Button onClick={() => setAddingTo(goal.id)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
                                                    <Plus className="w-4 h-4 mr-2 text-blue-400" /> Contribuir
                                                </Button>
                                                <Button onClick={() => handleCancel(goal.id)} variant="ghost" size="icon" className="text-slate-500 hover:text-rose-400 hover:bg-rose-950/30" title="Cancelar Meta">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Recent Contributions */}
                                {goal.contributions.length > 0 && (
                                    <div className="mt-6 pt-4 border-t border-slate-800/50">
                                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Últimas Contribuições</p>
                                        <div className="space-y-2">
                                            {goal.contributions.slice(0, 3).map((c) => (
                                                <div key={c.id} className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-300 font-medium">+{formatCurrency(c.amount)}</span>
                                                    <span className="text-slate-500">
                                                        {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(c.date)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Create Goal Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg bg-slate-900 border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <div className="absolute top-4 right-4">
                            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="h-8 w-8 text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-slate-100 mb-6">Nova Meta</h2>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400">Nome da Meta</label>
                                    <Input name="name" className="bg-slate-950 border-slate-800" placeholder="Ex: Viagem de férias" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400">Descrição (opcional)</label>
                                    <textarea name="description" className="flex min-h-[80px] w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50" rows={2} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400">Valor Alvo (R$)</label>
                                        <Input name="targetAmount" type="number" step="0.01" min="0.01" className="bg-slate-950 border-slate-800" required placeholder="0,00" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400">Prazo (opcional)</label>
                                        <Input name="deadline" type="date" className="bg-slate-950 border-slate-800" />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white mt-4">
                                    Criar Meta
                                </Button>
                            </form>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
