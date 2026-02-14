/**
 * Dashboard Client — Interactive charts and summary cards
 */
'use client';

import { formatCurrency } from '@/utils/formatCurrency';
import type { MonthSummaryDTO, CategoryBreakdownDTO, TransactionDTO } from '@/lib/dal/transactions';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    AreaChart, Area,
} from 'recharts';
import { getMonthName } from '@/utils/formatDate';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

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
    '#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#6366f1', '#14b8a6', '#f43f5e', '#84cc16',
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
        <div className="flex flex-col gap-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    title="Saldo do Mês"
                    value={summary.balance}
                    variation={balanceVar}
                    icon={DollarSign}
                    type="balance"
                    gradient="from-blue-600 to-cyan-500"
                />
                <SummaryCard
                    title="Receitas"
                    value={summary.totalIncome}
                    variation={incomeVar}
                    icon={TrendingUp}
                    type="income"
                    gradient="from-emerald-500 to-teal-400"
                />
                <SummaryCard
                    title="Despesas"
                    value={summary.totalExpense}
                    variation={expenseVar}
                    icon={TrendingDown}
                    type="expense"
                    gradient="from-rose-500 to-red-400"
                />
                <SummaryCard
                    title="Transações"
                    value={summary.transactionCount}
                    isCount
                    icon={Activity}
                    type="info"
                    gradient="from-violet-500 to-purple-400"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart — Despesas por Categoria */}
                <Card className="min-h-[400px]">
                    <CardHeader>
                        <CardTitle>Despesas por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {mounted && pieData.length > 0 ? (
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <LinkPieChart data={pieData} />
                                {/* Category Legend */}
                                <div className="flex flex-col gap-3 w-full md:w-auto">
                                    {categoryBreakdown.slice(0, 5).map((c, i) => (
                                        <div key={c.categoryId} className="flex items-center gap-2 text-sm">
                                            <span
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: c.categoryColor || DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
                                            />
                                            <span className="text-slate-400 flex-1">{c.categoryName}</span>
                                            <span className="font-semibold text-slate-200">{c.percentage.toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : mounted ? (
                            <div className="flex flex-col items-center justify-center h-[300px] text-slate-500 text-sm">
                                Sem despesas este mês
                            </div>
                        ) : (
                            <div className="h-[300px] animate-pulse bg-slate-800/20 rounded-lg" />
                        )}
                    </CardContent>
                </Card>

                {/* Bar Chart — Receita vs Despesa */}
                <Card className="min-h-[400px]">
                    <CardHeader>
                        <CardTitle>Receita vs Despesa</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {mounted ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={barData} barGap={4}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                        formatter={(value) => formatCurrency(Number(value ?? 0))}
                                        contentStyle={{
                                            background: '#0f172a',
                                            border: '1px solid #1e293b',
                                            borderRadius: '8px',
                                            color: '#f8fafc',
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] animate-pulse bg-slate-800/20 rounded-lg" />
                        )}
                    </CardContent>
                </Card>

                {/* Area Chart — Evolução do Saldo */}
                <Card className="min-h-[400px]">
                    <CardHeader>
                        <CardTitle>Evolução do Saldo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {mounted ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={lineData}>
                                    <defs>
                                        <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        formatter={(value) => formatCurrency(Number(value ?? 0))}
                                        contentStyle={{
                                            background: '#0f172a',
                                            border: '1px solid #1e293b',
                                            borderRadius: '8px',
                                            color: '#f8fafc',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="Saldo"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fill="url(#saldoGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] animate-pulse bg-slate-800/20 rounded-lg" />
                        )}
                    </CardContent>
                </Card>

                {/* Top 5 Expenses */}
                <Card className="min-h-[400px]">
                    <CardHeader>
                        <CardTitle>Top 5 Despesas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topExpenses.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {topExpenses.map((expense, index) => (
                                    <div key={expense.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50">
                                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 font-bold text-xs ring-1 ring-slate-700">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <span className="text-sm font-medium text-slate-200">{expense.description}</span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                {expense.categoryIcon} {expense.categoryName}
                                            </span>
                                        </div>
                                        <span className="font-display font-semibold text-rose-400">
                                            {formatCurrency(expense.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[300px] text-slate-500 text-sm">
                                Sem despesas este mês
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function LinkPieChart({ data }: { data: any[] }) {
    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        cornerRadius={4}
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value) => formatCurrency(Number(value ?? 0))}
                        contentStyle={{
                            background: '#0f172a',
                            border: '1px solid #1e293b',
                            borderRadius: '8px',
                            color: '#f8fafc',
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}

/* Summary Card Sub-component */
function SummaryCard({
    title,
    value,
    variation,
    icon: Icon,
    type,
    isCount = false,
    gradient,
}: {
    title: string;
    value: number;
    variation?: number;
    icon: React.ElementType;
    type: 'income' | 'expense' | 'balance' | 'info';
    isCount?: boolean;
    gradient: string;
}) {
    const isPositiveVariation = (variation ?? 0) >= 0;

    return (
        <Card className="relative overflow-hidden group hover:border-slate-600/50 transition-all duration-300">
            <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${gradient}`} />
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 font-medium text-sm">{title}</span>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} opacity-80 group-hover:opacity-100 transition-opacity`}>
                        <Icon className="w-4 h-4 text-white" />
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="font-display text-2xl font-bold text-slate-100">
                        {isCount ? value.toLocaleString('pt-BR') : formatCurrency(value)}
                    </h3>

                    {variation !== undefined && (
                        <div className={cn(
                            "flex items-center gap-1 text-xs font-medium",
                            isPositiveVariation ? "text-emerald-400" : "text-rose-400"
                        )}>
                            {isPositiveVariation ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{Math.abs(variation).toFixed(1)}% vs mês anterior</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
