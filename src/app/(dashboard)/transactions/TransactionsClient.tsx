/**
 * Transactions Client — List, filter, and create transactions
 */
'use client';

import { useState, useCallback } from 'react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { createTransaction, deleteTransaction, updateTransactionStatus } from '@/actions/transactions';
import type { TransactionDTO } from '@/lib/dal/transactions';
import type { CategoryDTO } from '@/lib/dal/categories';
import styles from './Transactions.module.css';

interface Props {
    initialTransactions: TransactionDTO[];
    categories: CategoryDTO[];
    accounts: Array<{ id: string; name: string; icon: string | null }>;
}

export default function TransactionsClient({ initialTransactions, categories, accounts }: Props) {
    const [transactions] = useState(initialTransactions);
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const [formError, setFormError] = useState('');
    const [loading, setLoading] = useState(false);

    const filtered = filter === 'ALL'
        ? transactions
        : transactions.filter((t) => t.type === filter);

    const handleCreate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError('');
        setLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await createTransaction(formData);
            if (result.success) {
                setShowForm(false);
                window.location.reload(); // revalidate
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
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Transações</h1>
                <button onClick={() => setShowForm(true)} className="btn btn--primary">
                    + Nova Transação
                </button>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                {(['ALL', 'INCOME', 'EXPENSE'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                    >
                        {f === 'ALL' ? 'Todas' : f === 'INCOME' ? '📈 Receitas' : '📉 Despesas'}
                    </button>
                ))}
            </div>

            {/* Transactions List */}
            <div className={styles.list}>
                {filtered.length === 0 ? (
                    <div className={styles.empty}>Nenhuma transação encontrada.</div>
                ) : (
                    filtered.map((t) => (
                        <div key={t.id} className={`card card--flat ${styles.item}`}>
                            <div className={styles.itemLeft}>
                                <span className={styles.itemIcon}>{t.categoryIcon ?? '💰'}</span>
                                <div className={styles.itemInfo}>
                                    <span className={styles.itemDesc}>{t.description}</span>
                                    <span className={styles.itemMeta}>
                                        {t.categoryName} › {t.subcategoryName} • {formatDate(t.date)}
                                        {t.isRecurring && ' 🔄'}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.itemRight}>
                                <span className={`${styles.itemAmount} ${t.type === 'INCOME' ? styles.income : styles.expense}`}>
                                    {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                                </span>
                                <button
                                    onClick={() => handleToggleStatus(t.id, t.status)}
                                    className={`badge ${t.status === 'PAID' ? 'badge--success' :
                                            t.status === 'PENDING' ? 'badge--warning' : 'badge--danger'
                                        }`}
                                    title="Clique para alterar status"
                                >
                                    {t.status === 'PAID' ? 'Pago' : t.status === 'PENDING' ? 'Pendente' : 'Atrasado'}
                                </button>
                                <button onClick={() => handleDelete(t.id)} className="btn btn--ghost btn--sm" title="Excluir">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Transaction Modal */}
            {showForm && (
                <div className="overlay" onClick={() => setShowForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">Nova Transação</h2>
                            <button onClick={() => setShowForm(false)} className="btn btn--ghost">✕</button>
                        </div>

                        {formError && <div className={styles.formError}>{formError}</div>}

                        <form onSubmit={handleCreate} className={styles.form}>
                            <div className="input-group">
                                <label>Tipo</label>
                                <select name="type" className="input" required id="txType" defaultValue="EXPENSE">
                                    <option value="EXPENSE">Despesa</option>
                                    <option value="INCOME">Receita</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Descrição</label>
                                <input name="description" className="input" placeholder="Ex: Supermercado" required />
                            </div>

                            <div className="input-group">
                                <label>Valor (R$)</label>
                                <input name="amount" type="number" step="0.01" min="0.01" className="input" placeholder="0,00" required />
                            </div>

                            <div className="input-group">
                                <label>Data</label>
                                <input name="date" type="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} required />
                            </div>

                            <div className="input-group">
                                <label>Conta</label>
                                <select name="accountId" className="input" required>
                                    {accounts.map((a) => (
                                        <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Categoria / Subcategoria</label>
                                <select name="subcategoryId" className="input" required>
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

                            <div className="input-group">
                                <label>Status</label>
                                <select name="status" className="input" defaultValue="PENDING">
                                    <option value="PAID">Pago</option>
                                    <option value="PENDING">Pendente</option>
                                    <option value="OVERDUE">Atrasado</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Observações (opcional)</label>
                                <textarea name="notes" className="input" rows={2} placeholder="Anotações..." />
                            </div>

                            <button type="submit" className="btn btn--primary btn--lg" disabled={loading} style={{ width: '100%' }}>
                                {loading ? 'Salvando...' : 'Salvar Transação'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
