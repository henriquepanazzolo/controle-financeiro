/**
 * Goals Client — Goal cards with progress, contributions, and estimates
 */
'use client';

import { useState, useCallback } from 'react';
import { formatCurrency } from '@/utils/formatCurrency';
import { createGoal as createGoalAction, addContribution as addContributionAction, cancelGoal as cancelGoalAction } from '@/actions/goals';
import type { GoalDTO } from '@/lib/dal/goals';
import styles from './Goals.module.css';

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
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Metas Financeiras</h1>
                <button onClick={() => setShowForm(true)} className="btn btn--primary">
                    + Nova Meta
                </button>
            </div>

            <div className={styles.filters}>
                {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                    >
                        {f === 'ALL' ? 'Todas' : f === 'ACTIVE' ? '🎯 Ativas' : '✅ Concluídas'}
                    </button>
                ))}
            </div>

            <div className={styles.grid}>
                {filtered.length === 0 ? (
                    <div className={styles.empty}>Nenhuma meta encontrada.</div>
                ) : (
                    filtered.map((goal) => (
                        <div key={goal.id} className={`card ${styles.goalCard}`}>
                            <div className={styles.goalHeader}>
                                <div>
                                    <h3 className={styles.goalName}>{goal.name}</h3>
                                    {goal.description && <p className={styles.goalDesc}>{goal.description}</p>}
                                </div>
                                <span className={`badge ${goal.status === 'ACTIVE' ? 'badge--info' :
                                        goal.status === 'COMPLETED' ? 'badge--success' : 'badge--danger'
                                    }`}>
                                    {goal.status === 'ACTIVE' ? 'Ativa' : goal.status === 'COMPLETED' ? 'Concluída' : 'Cancelada'}
                                </span>
                            </div>

                            <div className={styles.goalProgress}>
                                <div className={styles.goalAmounts}>
                                    <span>{formatCurrency(goal.currentAmount)}</span>
                                    <span className={styles.goalTarget}>de {formatCurrency(goal.targetAmount)}</span>
                                </div>
                                <div className="progress-bar" style={{ height: '10px' }}>
                                    <div
                                        className="progress-bar__fill"
                                        style={{
                                            width: `${Math.min(goal.percentage, 100)}%`,
                                            background: goal.percentage >= 100 ? 'var(--success)' : 'var(--primary-gradient)',
                                        }}
                                    />
                                </div>
                                <span className={styles.goalPercentage}>{goal.percentage.toFixed(0)}%</span>
                            </div>

                            {goal.estimatedMonths !== null && goal.status === 'ACTIVE' && (
                                <div className={styles.goalEstimate}>
                                    🕐 Estimativa: ~{goal.estimatedMonths} {goal.estimatedMonths === 1 ? 'mês' : 'meses'}
                                </div>
                            )}

                            {goal.status === 'ACTIVE' && (
                                <div className={styles.goalActions}>
                                    <button onClick={() => setAddingTo(goal.id)} className="btn btn--primary btn--sm">
                                        💰 Contribuir
                                    </button>
                                    <button onClick={() => handleCancel(goal.id)} className="btn btn--ghost btn--sm">
                                        Cancelar
                                    </button>
                                </div>
                            )}

                            {/* Inline contribution form */}
                            {addingTo === goal.id && (
                                <form onSubmit={handleContribute} className={styles.contribForm}>
                                    <input type="hidden" name="goalId" value={goal.id} />
                                    <input name="amount" type="number" step="0.01" min="0.01" className="input" placeholder="Valor" required style={{ flex: 1 }} />
                                    <input name="notes" className="input" placeholder="Nota (opt.)" style={{ flex: 1 }} />
                                    <button type="submit" className="btn btn--primary btn--sm">OK</button>
                                    <button type="button" onClick={() => setAddingTo(null)} className="btn btn--ghost btn--sm">✕</button>
                                </form>
                            )}

                            {/* Recent Contributions */}
                            {goal.contributions.length > 0 && (
                                <div className={styles.contribList}>
                                    {goal.contributions.slice(0, 3).map((c) => (
                                        <div key={c.id} className={styles.contribItem}>
                                            <span className={styles.contribAmount}>+{formatCurrency(c.amount)}</span>
                                            <span className={styles.contribDate}>
                                                {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(c.date)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Create Goal Modal */}
            {showForm && (
                <div className="overlay" onClick={() => setShowForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">Nova Meta</h2>
                            <button onClick={() => setShowForm(false)} className="btn btn--ghost">✕</button>
                        </div>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div className="input-group">
                                <label>Nome da Meta</label>
                                <input name="name" className="input" placeholder="Ex: Viagem de férias" required />
                            </div>
                            <div className="input-group">
                                <label>Descrição (opcional)</label>
                                <textarea name="description" className="input" rows={2} />
                            </div>
                            <div className="input-group">
                                <label>Valor Alvo (R$)</label>
                                <input name="targetAmount" type="number" step="0.01" min="0.01" className="input" required />
                            </div>
                            <div className="input-group">
                                <label>Prazo (opcional)</label>
                                <input name="deadline" type="date" className="input" />
                            </div>
                            <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%' }}>
                                Criar Meta
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
