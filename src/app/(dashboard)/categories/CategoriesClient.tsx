/**
 * Categories Client — Manage categories and subcategories
 */
'use client';

import { useState, useCallback } from 'react';
import { createCategory, createSubcategory, toggleCategory } from '@/actions/categories';
import type { CategoryDTO } from '@/lib/dal/categories';
import EmojiPicker from '@/components/ui/EmojiPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Eye, EyeOff, X, Folder, TrendingUp, TrendingDown, Tag } from 'lucide-react';

interface Props {
    categories: CategoryDTO[];
}

export default function CategoriesClient({ categories }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [showSubForm, setShowSubForm] = useState<string | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const [icon, setIcon] = useState('🏷️');

    const filtered = filter === 'ALL'
        ? categories
        : categories.filter((c) => c.type === filter);

    const handleCreateCategory = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await createCategory(fd);
        setShowForm(false);
        window.location.reload();
    }, []);

    const handleCreateSubcategory = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await createSubcategory(fd);
        setShowSubForm(null);
        window.location.reload();
    }, []);

    const handleToggle = useCallback(async (categoryId: string) => {
        const fd = new FormData();
        fd.set('categoryId', categoryId);
        await toggleCategory(fd);
        window.location.reload();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-100">Categorias</h1>
                    <p className="text-slate-400">Organize suas transações por categorias</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/20">
                    <Plus className="w-4 h-4 mr-2" /> Nova Categoria
                </Button>
            </div>

            <Card className="glass-card p-2 md:w-fit">
                <div className="flex gap-2 p-1">
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
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map((cat) => (
                    <Card
                        key={cat.id}
                        className={cn(
                            "glass-card border-slate-800/50 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl group relative overflow-hidden",
                            !cat.isActive && "opacity-60 grayscale"
                        )}
                        style={{ borderTop: `4px solid ${cat.color || (cat.type === 'INCOME' ? '#10B981' : '#F43F5E')}` }}
                    >
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-inner bg-slate-900/50"
                                    >
                                        {cat.icon || '📁'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-100">{cat.name}</h3>
                                        <span className={cn(
                                            "text-xs font-medium px-2 py-0.5 rounded-full",
                                            cat.type === 'INCOME'
                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                        )}>
                                            {cat.type === 'INCOME' ? 'Receita' : 'Despesa'}
                                        </span>
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleToggle(cat.id)} title={cat.isActive ? 'Desativar' : 'Ativar'}>
                                    {cat.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {cat.subcategories.map((sub) => (
                                        <span key={sub.id} className="inline-flex items-center px-2 py-1 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">
                                            {sub.name}
                                        </span>
                                    ))}
                                    <button
                                        onClick={() => setShowSubForm(cat.id)}
                                        className="inline-flex items-center px-2 py-1 rounded text-xs border border-dashed border-slate-600 text-slate-500 hover:text-blue-400 hover:border-blue-400 transition-colors"
                                    >
                                        <Plus className="w-3 h-3 mr-1" /> Adicionar
                                    </button>
                                </div>

                                {showSubForm === cat.id && (
                                    <form onSubmit={handleCreateSubcategory} className="mt-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <input type="hidden" name="categoryId" value={cat.id} />
                                        <Input name="name" className="h-8 text-xs bg-slate-950 border-slate-800" placeholder="Nome da subcategoria" required autoFocus />
                                        <Button type="submit" size="sm" className="h-8 bg-blue-600 hover:bg-blue-500 text-xs px-3">Ok</Button>
                                        <Button type="button" size="sm" variant="ghost" onClick={() => setShowSubForm(null)} className="h-8 w-8 p-0 text-slate-400 hover:text-rose-400">
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Create Category Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg bg-slate-900 border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <div className="absolute top-4 right-4">
                            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="h-8 w-8 text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-slate-100 mb-6">Nova Categoria</h2>
                            <form onSubmit={handleCreateCategory} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400">Nome</label>
                                    <Input name="name" className="bg-slate-950 border-slate-800" required placeholder="Ex: Alimentação, Transporte..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400">Tipo</label>
                                    <select name="type" className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50" required>
                                        <option value="EXPENSE">Despesa</option>
                                        <option value="INCOME">Receita</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400">Ícone</label>
                                        <input type="hidden" name="icon" value={icon} />
                                        <EmojiPicker value={icon} onChange={setIcon} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-400">Cor</label>
                                        <Input name="color" type="color" className="p-1 h-10 w-full bg-slate-950 border-slate-800 cursor-pointer" defaultValue="#1A3A8F" />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white mt-4">Criar Categoria</Button>
                            </form>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
