/**
 * Transactions Client — List and Manage Transactions
 */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { createTransaction, deleteTransaction, updateTransactionStatus, bulkDeleteTransactions } from '@/actions/transactions';
import type { TransactionDTO } from '@/lib/dal/transactions';
import type { CategoryDTO } from '@/lib/dal/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Filter, Search, ArrowUpCircle, ArrowDownCircle, CheckCircle2, Clock, AlertCircle, X } from 'lucide-react';

interface Props {
    initialTransactions: TransactionDTO[];
    categories: CategoryDTO[];
    accounts: Array<{ id: string; name: string; icon: string | null }>;
}

export default function TransactionsClient({ initialTransactions, categories, accounts }: Props) {
    const [transactions, setTransactions] = useState(initialTransactions);

    useEffect(() => {
        setTransactions(initialTransactions);
    }, [initialTransactions]);

    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [formError, setFormError] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const filtered = transactions.filter((t) => {
        const matchesFilter = filter === 'ALL' || t.type === filter;
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    useEffect(() => {
        setSelectedIds(new Set());
    }, [filter, searchTerm]);

    const handleSelectAll = useCallback(() => {
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map(t => t.id)));
        }
    }, [filtered, selectedIds]);

    const handleSelectOne = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const handleBulkDelete = useCallback(async () => {
        if (!confirm(`Excluir ${selectedIds.size} transações selecionadas?`)) return;

        const fd = new FormData();
        fd.set('ids', JSON.stringify(Array.from(selectedIds)));

        const result = await bulkDeleteTransactions(fd);
        if (result.success) {
            setSelectedIds(new Set());
            window.location.reload();
        } else {
            alert(result.error || 'Erro ao excluir transações.');
        }
    }, [selectedIds]);

    const handleCreate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError('');
        setLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await createTransaction(formData);
            if (result.success) {
                setShowForm(false);
                window.location.reload();
            } else {
                setFormError(result.error ?? 'Erro ao criar transação.');
            }
        } catch {
            setFormError('Erro inesperado.');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm('Excluir esta transação?')) return;
        const fd = new FormData();
        fd.set('id', id);
        await deleteTransaction(fd);
        window.location.reload();
    }, []);

    const handleToggleStatus = useCallback(async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
        const fd = new FormData();
        fd.set('id', id);
        fd.set('status', newStatus);
        await updateTransactionStatus(fd);
        window.location.reload();
    }, []);

    const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');
    const incomeCategories = categories.filter((c) => c.type === 'INCOME');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-100">Transações</h1>
                    <p className="text-slate-400">Gerencie suas receitas e despesas</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/20">
                    <Plus className="w-4 h-4 mr-2" /> Nova Transação
                </Button>
            </div>

            {/* Filters & Actions */}
            <Card className="glass-card p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                        {(['ALL', 'INCOME', 'EXPENSE'] as const).map((f) => (
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
                                {f === 'ALL' ? 'Todas' : f === 'INCOME' ? 'Receitas' : 'Despesas'}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                                placeholder="Buscar transação..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-slate-900/50 border-slate-800 focus:border-blue-500/50"
                            />
                        </div>
                        {selectedIds.size > 0 && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                                className="shrink-0"
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Excluir ({selectedIds.size})
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Transactions List */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500">
                    <input
                        type="checkbox"
                        checked={filtered.length > 0 && selectedIds.size === filtered.length}
                        onChange={handleSelectAll}
                        className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-offset-slate-900"
                    />
                    <span>Selecionar todos</span>
                </div>

                {filtered.length === 0 ? (
                    <Card className="glass-card py-12 text-center text-slate-500">
                        <Filter className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Nenhuma transação encontrada.</p>
                    </Card>
                ) : (
                    filtered.map((t) => (
                        <div
                            key={t.id}
                            className={cn(
                                "group flex flex-col md:flex-row items-center gap-4 p-4 rounded-xl border border-slate-800/50 bg-slate-900/30 hover:bg-slate-800/50 transition-all duration-200",
                                selectedIds.has(t.id) && "bg-blue-900/10 border-blue-500/30"
                            )}
                        >
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(t.id)}
                                    onChange={() => handleSelectOne(t.id)}
                                    className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-offset-slate-900"
                                />
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-inner",
                                    t.type === 'INCOME' ? "bg-emerald-500/10" : "bg-rose-500/10"
                                )}>
                                    {t.categoryIcon || (t.type === 'INCOME' ? '💰' : '💸')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-200 truncate">{t.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400">{t.categoryName}</span>
                                        <span>•</span>
                                        <span>{formatDate(t.date)}</span>
                                        {t.isRecurring && <span className="text-blue-400" title="Recorrente">🔄</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between w-full md:w-auto md:flex-1 md:justify-end gap-6">
                                <span className={cn(
                                    "font-display font-bold whitespace-nowrap",
                                    t.type === 'INCOME' ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                                </span>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleStatus(t.id, t.status)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                                            t.status === 'PAID'
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                                : t.status === 'PENDING'
                                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                                                    : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                                        )}
                                        title="Alterar status"
                                    >
                                        {t.status === 'PAID' ? <CheckCircle2 className="w-3 h-3" /> : t.status === 'PENDING' ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                        {t.status === 'PAID' ? 'Pago' : t.status === 'PENDING' ? 'Pendente' : 'Atrasado'}
                                    </button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(t.id)}
                                        className="h-8 w-8 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Transaction Modal (reusing simplified structure tailored for Tailwind) */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg bg-slate-900 border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <div className="absolute top-4 right-4">
                            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="h-8 w-8 text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-slate-100 mb-4">Nova Transação</h2>

                            {formError && (
                                <div className="bg-rose-500/10 text-rose-400 p-3 rounded-lg text-sm mb-4 border border-rose-500/20">
                                    {formError}
                                </div>
                            )}

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400">Tipo</label>
                                        <select name="type" className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50" required defaultValue="EXPENSE">
                                            <option value="EXPENSE">Despesa</option>
                                            <option value="INCOME">Receita</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400">Data</label>
                                        <Input name="date" type="date" className="bg-slate-950 border-slate-800" defaultValue={new Date().toISOString().split('T')[0]} required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400">Descrição</label>
                                    <Input name="description" className="bg-slate-950 border-slate-800" placeholder="Ex: Supermercado" required />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400">Valor (R$)</label>
                                    <Input name="amount" type="number" step="0.01" min="0.01" className="bg-slate-950 border-slate-800" placeholder="0,00" required />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400">Conta</label>
                                    <select name="accountId" className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50" required>
                                        {accounts.map((a) => (
                                            <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400">Categoria</label>
                                    <select name="subcategoryId" className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50" required>
                                        <optgroup label="— Despesas —">
                                            {expenseCategories.map((c) => (
                                                c.subcategories.map((s) => (
                                                    <option key={s.id} value={s.id}>{c.icon} {c.name} › {s.name}</option>
                                                ))
                                            ))}
                                        </optgroup>
                                        <optgroup label="— Receitas —">
                                            {incomeCategories.map((c) => (
                                                c.subcategories.map((s) => (
                                                    <option key={s.id} value={s.id}>{c.icon} {c.name} › {s.name}</option>
                                                ))
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400">Status</label>
                                    <select name="status" className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50" defaultValue="PENDING">
                                        <option value="PAID">Pago</option>
                                        <option value="PENDING">Pendente</option>
                                        <option value="OVERDUE">Atrasado</option>
                                    </select>
                                </div>

                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white mt-4" disabled={loading}>
                                    {loading ? 'Salvando...' : 'Salvar Transação'}
                                </Button>
                            </form>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
