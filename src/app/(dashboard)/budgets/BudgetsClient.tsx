/**
 * Budgets Client — Budget cards with progress bars
 */
'use client';

import { useState, useCallback } from 'react';
import { formatCurrency } from '@/utils/formatCurrency';
import { upsertBudget as upsertBudgetAction, deleteBudget as deleteBudgetAction } from '@/actions/budgets';
import type { BudgetDTO } from '@/lib/dal/budgets';
import type { CategoryDTO } from '@/lib/dal/categories';
import styles from './Budgets.module.css';

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

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Orçamentos</h1>
                <button onClick={() => setShowForm(true)} className="btn btn--primary">
                    + Novo Orçamento
                </button>
            </div>

            {/* Overall Summary */}
            <div className={`card ${styles.summaryCard}`}>
                <div className={styles.summaryRow}>
                    <div>
                        <span className={styles.summaryLabel}>Total Orçado</span>
                        <span className={styles.summaryValue}>{formatCurrency(totalBudget)}</span>
                    </div>
                    <div>
                        <span className={styles.summaryLabel}>Total Gasto</span>
                        <span className={styles.summaryValue}>{formatCurrency(totalSpent)}</span>
                    </div>
                    <div>
                        <span className={styles.summaryLabel}>Disponível</span>
                        <span className={`${styles.summaryValue} ${totalBudget - totalSpent >= 0 ? styles.positive : styles.negative}`}>
                            {formatCurrency(totalBudget - totalSpent)}
                        </span>
                    </div>
                </div>
                <div className="progress-bar" style={{ marginTop: 'var(--space-3)' }}>
                    <div
                        className="progress-bar__fill"
                        style={{
                            width: `${Math.min((totalSpent / (totalBudget || 1)) * 100, 100)}%`,
                            background: totalSpent > totalBudget ? 'var(--danger)' : 'var(--primary-gradient)',
                        }}
                    />
                </div>
            </div>

            {/* Budget Cards */}
            <div className={styles.grid}>
                {budgets.length === 0 ? (
                    <div className={styles.empty}>Nenhum orçamento definido para este mês.</div>
                ) : (
                    budgets.map((b) => {
                        const overBudget = b.spentAmount > b.limitAmount;
                        return (
                            <div key={b.id} className={`card ${styles.budgetCard}`}>
                                <div className={styles.budgetHeader}>
                                    <span className={styles.budgetIcon}>{b.categoryIcon ?? '📁'}</span>
                                    <div>
                                        <h3 className={styles.budgetName}>{b.categoryName}</h3>
                                        <span className={styles.budgetMeta}>
                                            {formatCurrency(b.spentAmount)} de {formatCurrency(b.limitAmount)}
                                        </span>
                                    </div>
                                    <div className={styles.budgetActions}>
                                        <span className={`badge ${overBudget ? 'badge--danger' : b.percentage > 80 ? 'badge--warning' : 'badge--success'}`}>
                                            {b.percentage.toFixed(0)}%
                                        </span>
                                        <button onClick={() => handleDelete(b.id)} className="btn btn--ghost btn--sm">🗑️</button>
                                    </div>
                                </div>
                                <div className="progress-bar" style={{ marginTop: 'var(--space-3)' }}>
                                    <div
                                        className="progress-bar__fill"
                                        style={{
                                            width: `${Math.min(b.percentage, 100)}%`,
                                            background: overBudget ? 'var(--danger)' : b.percentage > 80 ? 'var(--warning)' : 'var(--success)',
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create Budget Modal */}
            {showForm && (
                <div className="overlay" onClick={() => setShowForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">Novo Orçamento</h2>
                            <button onClick={() => setShowForm(false)} className="btn btn--ghost">✕</button>
                        </div>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div className="input-group">
                                <label>Categoria</label>
                                <select name="categoryId" className="input" required>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Limite (R$)</label>
                                <input name="limitAmount" type="number" step="0.01" min="0.01" className="input" required />
                            </div>
                            <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%' }}>
                                Definir Orçamento
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
