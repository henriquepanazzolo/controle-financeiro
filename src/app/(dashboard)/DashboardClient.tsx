/**
 * Dashboard Client — Interactive charts and summary cards
 */
'use client';

import { formatCurrency } from '@/utils/formatCurrency';
import type { MonthSummaryDTO, CategoryBreakdownDTO, TransactionDTO } from '@/lib/dal/transactions';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    LineChart, Line, Area, AreaChart,
} from 'recharts';
import { getMonthName } from '@/utils/formatDate';
import styles from './Dashboard.module.css';
import { useState, useEffect } from 'react';

interface DashboardClientProps {
    summary: MonthSummaryDTO;
    prevSummary: MonthSummaryDTO;
    categoryBreakdown: CategoryBreakdownDTO[];
    topExpenses: TransactionDTO[];
    monthlyData: Array<{ month: number; year: number; income: number; expense: number }>;
}

/** Calculates percentage variation between two values */
function calcVariation(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

const DEFAULT_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#FF8C42', '#74B9FF', '#A78BFA', '#F9CA24',
];

export default function DashboardClient({
    summary,
    prevSummary,
    categoryBreakdown,
    topExpenses,
    monthlyData,
}: DashboardClientProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const incomeVar = calcVariation(summary.totalIncome, prevSummary.totalIncome);
    const expenseVar = calcVariation(summary.totalExpense, prevSummary.totalExpense);
    const balanceVar = calcVariation(summary.balance, prevSummary.balance);

    // Format monthly data for charts
    const barData = monthlyData.map((d) => ({
        name: getMonthName(d.month).substring(0, 3),
        Receitas: d.income,
        Despesas: d.expense,
    }));

    // Cumulative balance for line chart
    let cumBalance = 0;
    const lineData = monthlyData.map((d) => {
        cumBalance += d.income - d.expense;
        return {
            name: getMonthName(d.month).substring(0, 3),
            Saldo: cumBalance,
        };
    });

    // Pie chart data
    const pieData = categoryBreakdown.map((c) => ({
        name: c.categoryName,
        value: c.total,
        color: c.categoryColor || DEFAULT_COLORS[0],
    }));

    return (
        <div className={styles.dashboard}>
            {/* Summary Cards */}
            <div className={styles.cards}>
                <SummaryCard
                    title="Saldo do Mês"
                    value={summary.balance}
                    variation={balanceVar}
                    icon="💰"
                    type="balance"
                />
                <SummaryCard
                    title="Receitas"
                    value={summary.totalIncome}
                    variation={incomeVar}
                    icon="📈"
                    type="income"
                />
                <SummaryCard
                    title="Despesas"
                    value={summary.totalExpense}
                    variation={expenseVar}
                    icon="📉"
                    type="expense"
                />
                <SummaryCard
                    title="Transações"
                    value={summary.transactionCount}
                    isCount
                    icon="📊"
                    type="info"
                />
            </div>

            {/* Charts Grid */}
            <div className={styles.chartsGrid}>
                {/* Pie Chart — Despesas por Categoria */}
                <div className={`card ${styles.chartCard}`}>
                    <h3 className={styles.chartTitle}>Despesas por Categoria</h3>
                    {mounted && pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                    animationBegin={200}
                                    animationDuration={800}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={entry.name} fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                                    contentStyle={{
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.875rem',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : mounted ? (
                        <div className={styles.emptyChart}>Sem despesas neste mês</div>
                    ) : (
                        <div style={{ height: 300 }} /> // Placeholder during hydration
                    )}
                    {/* Category Legend */}
                    <div className={styles.pieLegend}>
                        {categoryBreakdown.slice(0, 5).map((c) => (
                            <div key={c.categoryId} className={styles.legendItem}>
                                <span
                                    className={styles.legendDot}
                                    style={{ backgroundColor: c.categoryColor || '#999' }}
                                />
                                <span className={styles.legendLabel}>{c.categoryName}</span>
                                <span className={styles.legendValue}>{c.percentage.toFixed(0)}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bar Chart — Receita vs Despesa */}
                <div className={`card ${styles.chartCard}`}>
                    <h3 className={styles.chartTitle}>Receita vs Despesa</h3>
                    {mounted ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={barData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                                    contentStyle={{
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 300 }} />
                    )}
                </div>

                {/* Area Chart — Evolução do Saldo */}
                <div className={`card ${styles.chartCard}`}>
                    <h3 className={styles.chartTitle}>Evolução do Saldo</h3>
                    {mounted ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={lineData}>
                                <defs>
                                    <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                                    contentStyle={{
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Saldo"
                                    stroke="var(--primary)"
                                    strokeWidth={2}
                                    fill="url(#saldoGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 300 }} />
                    )}
                </div>

                {/* Top 5 Expenses */}
                <div className={`card ${styles.chartCard}`}>
                    <h3 className={styles.chartTitle}>Top 5 Despesas</h3>
                    {topExpenses.length > 0 ? (
                        <div className={styles.topList}>
                            {topExpenses.map((expense, index) => (
                                <div key={expense.id} className={styles.topItem}>
                                    <div className={styles.topRank}>{index + 1}</div>
                                    <div className={styles.topInfo}>
                                        <span className={styles.topDescription}>{expense.description}</span>
                                        <span className={styles.topCategory}>
                                            {expense.categoryIcon} {expense.categoryName}
                                        </span>
                                    </div>
                                    <span className={styles.topAmount}>
                                        {formatCurrency(expense.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyChart}>Sem despesas neste mês</div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* Summary Card Sub-component */
function SummaryCard({
    title,
    value,
    variation,
    icon,
    type,
    isCount = false,
}: {
    title: string;
    value: number;
    variation?: number;
    icon: string;
    type: 'income' | 'expense' | 'balance' | 'info';
    isCount?: boolean;
}) {
    const typeClass = styles[`card${type.charAt(0).toUpperCase() + type.slice(1)}`];
    const isPositiveVariation = (variation ?? 0) >= 0;
    const variationPrefix = isPositiveVariation ? '↑' : '↓';

    return (
        <div className={`card ${styles.summaryCard} ${typeClass ?? ''}`}>
            <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>{icon}</span>
                <span className={styles.cardTitle}>{title}</span>
            </div>
            <div className={styles.cardValue}>
                {isCount ? value.toLocaleString('pt-BR') : formatCurrency(value)}
            </div>
            {variation !== undefined && (
                <div className={`${styles.cardVariation} ${isPositiveVariation ? styles.variationUp : styles.variationDown}`}>
                    {variationPrefix} {Math.abs(variation).toFixed(1)}% vs mês anterior
                </div>
            )}
        </div>
    );
}
