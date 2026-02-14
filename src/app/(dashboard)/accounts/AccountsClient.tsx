'use client';

import { useState, useCallback } from 'react';
import { createAccount, updateAccount, toggleAccountStatus, deleteAccount } from '@/actions/accounts';
import type { Account } from '@/generated/prisma/client';
import EmojiPicker from '@/components/ui/EmojiPicker';
import { formatCurrency } from '@/utils/formatCurrency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Wallet, CreditCard, Banknote, PiggyBank, TrendingUp } from 'lucide-react';

interface Props {
    accounts: Account[];
}

export default function AccountsClient({ accounts }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [icon, setIcon] = useState('🏦');

    // Create Handler
    const handleCreate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const res = await createAccount(fd);

        if (res.success) {
            setIsCreateOpen(false);
            setIcon('🏦');
            // Optional: Show success toast
        } else {
            alert(res.error || 'Erro ao criar conta');
        }
    }, []);

    // Edit Handler
    const handleUpdate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await updateAccount(fd);
        setEditingAccount(null);
    }, []);

    const handleEditClick = (acc: Account) => {
        setEditingAccount(acc);
        setIcon(acc.icon || '🏦');
    };

    const handleDelete = async (accountId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.')) return;
        const fd = new FormData();
        fd.set('accountId', accountId);
        const res = await deleteAccount(fd);
        if (!res.success) alert(res.error);
    };

    const handleToggle = async (accountId: string) => {
        const fd = new FormData();
        fd.set('accountId', accountId);
        await toggleAccountStatus(fd);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-100">Minhas Contas</h1>
                    <p className="text-slate-400">Gerencie suas contas bancárias e carteiras</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/20">
                    <Plus className="w-4 h-4 mr-2" /> Nova Conta
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {accounts.map((acc) => (
                    <Card
                        key={acc.id}
                        className={cn(
                            "glass-card border-slate-800/50 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl overflow-hidden group",
                            !acc.isActive && "opacity-60 grayscale"
                        )}
                        style={{ borderColor: acc.isActive && acc.color ? `${acc.color}40` : undefined }}
                    >
                        <div className="absolute top-0 left-0 w-full h-1" style={{ background: acc.color || 'var(--slate-800)' }} />
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ring-1 ring-white/5"
                                    style={{
                                        background: acc.color ? `${acc.color}15` : 'rgba(30, 41, 59, 0.5)',
                                        color: acc.color || 'inherit'
                                    }}
                                >
                                    {acc.icon || '🏦'}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => handleToggle(acc.id)} title={acc.isActive ? 'Desativar' : 'Ativar'}>
                                        {acc.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-400" onClick={() => handleEditClick(acc)} title="Editar">
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-rose-400" onClick={() => handleDelete(acc.id)} title="Excluir">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold text-slate-100 leading-tight">{acc.name}</h3>
                                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    {getAccountTypeIcon(acc.type)}
                                    {ACCOUNT_TYPES[acc.type] || acc.type}
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-800/50">
                                <p className="text-sm text-slate-500 mb-1">Saldo Atual</p>
                                <p className={cn(
                                    "text-2xl font-bold font-display",
                                    Number(acc.balance) >= 0 ? "text-slate-100" : "text-rose-400"
                                )}>
                                    {formatCurrency(Number(acc.balance))}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg bg-slate-900 border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <div className="absolute top-4 right-4">
                            <Button variant="ghost" size="icon" onClick={() => setIsCreateOpen(false)} className="h-8 w-8 text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-slate-100 mb-6">Nova Conta</h2>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400">Nome da Conta</label>
                                    <Input name="name" className="bg-slate-950 border-slate-800" placeholder="Ex: Nubank, Carteira..." required />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400">Tipo</label>
                                        <select name="type" className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50" required>
                                            <option value="CHECKING">Conta Corrente</option>
                                            <option value="SAVINGS">Poupança</option>
                                            <option value="CREDIT_CARD">Cartão de Crédito</option>
                                            <option value="INVESTMENT">Investimento</option>
                                            <option value="CASH">Dinheiro Físico</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400">Saldo Inicial</label>
                                        <Input name="balance" type="number" step="0.01" className="bg-slate-950 border-slate-800" defaultValue="0" required />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400">Ícone</label>
                                        <input type="hidden" name="icon" value={icon} />
                                        <EmojiPicker value={icon} onChange={setIcon} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400">Cor</label>
                                        <div className="flex items-center gap-2">
                                            <Input name="color" type="color" className="p-1 h-10 w-full bg-slate-950 border-slate-800 cursor-pointer" defaultValue="#3B82F6" />
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white mt-4">Criar Conta</Button>
                            </form>
                        </div>
                    </Card>
                </div>
            )}

            {/* Edit Modal */}
            {editingAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg bg-slate-900 border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <div className="absolute top-4 right-4">
                            <Button variant="ghost" size="icon" onClick={() => setEditingAccount(null)} className="h-8 w-8 text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-slate-100 mb-6">Editar Conta</h2>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <input type="hidden" name="id" value={editingAccount.id} />
                                <input type="hidden" name="isActive" value={String(editingAccount.isActive)} />

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400">Nome da Conta</label>
                                    <Input name="name" className="bg-slate-950 border-slate-800" defaultValue={editingAccount.name} required />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400">Tipo</label>
                                        <select name="type" className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50" defaultValue={editingAccount.type} required>
                                            <option value="CHECKING">Conta Corrente</option>
                                            <option value="SAVINGS">Poupança</option>
                                            <option value="CREDIT_CARD">Cartão de Crédito</option>
                                            <option value="INVESTMENT">Investimento</option>
                                            <option value="CASH">Dinheiro Físico</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400">Saldo Atual (Ajuste Manual)</label>
                                        <Input name="balance" type="number" step="0.01" className="bg-slate-950 border-slate-800" defaultValue={Number(editingAccount.balance)} required />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400">Ícone</label>
                                        <input type="hidden" name="icon" value={icon} />
                                        <EmojiPicker value={icon} onChange={setIcon} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400">Cor</label>
                                        <Input name="color" type="color" className="p-1 h-10 w-full bg-slate-950 border-slate-800 cursor-pointer" defaultValue={editingAccount.color || '#3B82F6'} />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white mt-4">Salvar Alterações</Button>
                            </form>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

const ACCOUNT_TYPES: Record<string, string> = {
    CHECKING: 'Conta Corrente',
    SAVINGS: 'Poupança',
    CREDIT_CARD: 'Cartão de Crédito',
    INVESTMENT: 'Investimento',
    CASH: 'Carteira / Dinheiro',
};

function getAccountTypeIcon(type: string) {
    switch (type) {
        case 'CHECKING': return <Banknote className="w-3 h-3" />;
        case 'SAVINGS': return <PiggyBank className="w-3 h-3" />;
        case 'CREDIT_CARD': return <CreditCard className="w-3 h-3" />;
        case 'INVESTMENT': return <TrendingUp className="w-3 h-3" />;
        case 'CASH': return <Wallet className="w-3 h-3" />;
        default: return <Banknote className="w-3 h-3" />;
    }
}
