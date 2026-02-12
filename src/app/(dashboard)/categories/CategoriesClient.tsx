/**
 * Categories Client — Manage categories and subcategories
 */
'use client';

import { useState, useCallback } from 'react';
import { createCategory, createSubcategory, toggleCategory } from '@/actions/categories';
import type { CategoryDTO } from '@/lib/dal/categories';
import EmojiPicker from '@/components/ui/EmojiPicker';
import styles from './Categories.module.css';

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
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Categorias</h1>
                <button onClick={() => setShowForm(true)} className="btn btn--primary">
                    + Nova Categoria
                </button>
            </div>

            <div className={styles.filters}>
                {(['ALL', 'INCOME', 'EXPENSE'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                    >
                        {f === 'ALL' ? 'Todas' : f === 'INCOME' ? 'Receitas' : 'Despesas'}
                    </button>
                ))}
            </div>

            <div className={styles.grid}>
                {filtered.map((cat) => (
                    <div key={cat.id} className={`card ${styles.catCard} ${!cat.isActive ? styles.inactive : ''}`}>
                        <div className={styles.catHeader}>
                            <span className={styles.catIcon}>{cat.icon ?? '📁'}</span>
                            <div>
                                <h3 className={styles.catName}>{cat.name}</h3>
                                <span className={`badge ${cat.type === 'INCOME' ? 'badge--success' : 'badge--danger'}`}>
                                    {cat.type === 'INCOME' ? 'Receita' : 'Despesa'}
                                </span>
                            </div>
                            <div className={styles.catActions}>
                                <button onClick={() => handleToggle(cat.id)} className="btn btn--ghost btn--sm">
                                    {cat.isActive ? '🚫' : '✅'}
                                </button>
                            </div>
                        </div>

                        <div className={styles.subcategories}>
                            {cat.subcategories.map((sub) => (
                                <span key={sub.id} className={styles.subTag}>{sub.name}</span>
                            ))}
                            <button onClick={() => setShowSubForm(cat.id)} className={styles.addSubBtn}>
                                + Adicionar
                            </button>
                        </div>

                        {showSubForm === cat.id && (
                            <form onSubmit={handleCreateSubcategory} className={styles.subForm}>
                                <input type="hidden" name="categoryId" value={cat.id} />
                                <input name="name" className="input" placeholder="Nova subcategoria" required style={{ flex: 1 }} />
                                <button type="submit" className="btn btn--primary btn--sm">Salvar</button>
                                <button type="button" onClick={() => setShowSubForm(null)} className="btn btn--ghost btn--sm">✕</button>
                            </form>
                        )}
                    </div>
                ))}
            </div>

            {/* Create Category Modal */}
            {showForm && (
                <div className="overlay" onClick={() => setShowForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">Nova Categoria</h2>
                            <button onClick={() => setShowForm(false)} className="btn btn--ghost">✕</button>
                        </div>
                        <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div className="input-group">
                                <label>Nome</label>
                                <input name="name" className="input" required />
                            </div>
                            <div className="input-group">
                                <label>Tipo</label>
                                <select name="type" className="input" required>
                                    <option value="EXPENSE">Despesa</option>
                                    <option value="INCOME">Receita</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Ícone</label>
                                <input type="hidden" name="icon" value={icon} />
                                <EmojiPicker value={icon} onChange={setIcon} />
                            </div>
                            <div className="input-group">
                                <label>Cor</label>
                                <input name="color" type="color" className="input" defaultValue="#1A3A8F" />
                            </div>
                            <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%' }}>Criar Categoria</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
