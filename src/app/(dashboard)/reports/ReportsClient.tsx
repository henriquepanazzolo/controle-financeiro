/**
 * Reports Client — Monthly comparison and XML export
 */
'use client';

import { useCallback } from 'react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, getMonthName } from '@/utils/formatDate';
import { exportMonthlyXML } from '@/actions/reports';
import type { MonthlyComparisonDTO, StatementEntryDTO } from '@/lib/dal/reports';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Download, TrendingUp, TrendingDown, ArrowRight, ArrowDown, FileText, Calendar } from 'lucide-react';

interface Props {
    comparison: MonthlyComparisonDTO;
    statement: StatementEntryDTO[];
    month: number;
    year: number;
}

export default function ReportsClient({ comparison, statement, month, year }: Props) {
    const handleExportXML = useCallback(async () => {
        const result = await exportMonthlyXML(month, year);
        if (result.success && result.xml) {
            const blob = new Blob([result.xml], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `extrato_${getMonthName(month)}_${year}.xml`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }, [month, year]);

    const { currentMonth, previousMonth, incomeVariation, expenseVariation } = comparison;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-100">Relatórios</h1>
                    <p className="text-slate-400">Análise financeira e extratos</p>
                </div>
                <Button onClick={handleExportXML} className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/20">
                    <Download className="w-4 h-4 mr-2" /> Exportar XML
                </Button>
            </div>

            {/* Monthly Comparison */}
            <div>
                <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" /> Comparativo Mensal
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
                    {/* Previous Month */}
                    <Card className="glass-card border-slate-800/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> {getMonthName(previousMonth.month)} {previousMonth.year}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                                <span className="text-sm text-slate-400">Receitas</span>
                                <span className="font-semibold text-emerald-400">{formatCurrency(previousMonth.income)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                                <span className="text-sm text-slate-400">Despesas</span>
                                <span className="font-semibold text-rose-400">{formatCurrency(previousMonth.expense)}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-slate-400">Saldo</span>
                                <span className={cn(
                                    "font-bold text-lg",
                                    previousMonth.balance >= 0 ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {formatCurrency(previousMonth.balance)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Comparison Indicator */}
                    <div className="flex flex-row md:flex-col items-center justify-center gap-4 text-slate-500">
                        <div className="p-2 rounded-full bg-slate-800/50 border border-slate-700/50 hidden md:block">
                            <ArrowRight className="w-6 h-6" />
                        </div>
                        <div className="md:hidden p-2 rounded-full bg-slate-800/50 border border-slate-700/50">
                            <ArrowDown className="w-6 h-6" />
                        </div>

                        <div className="flex flex-col gap-2 text-xs font-medium w-full md:w-auto">
                            <div className={cn(
                                "flex items-center gap-1 justify-center px-3 py-1.5 rounded-full border",
                                incomeVariation >= 0
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            )}>
                                <span>Receitas</span>
                                {incomeVariation >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                <span>{Math.abs(incomeVariation).toFixed(1)}%</span>
                            </div>
                            <div className={cn(
                                "flex items-center gap-1 justify-center px-3 py-1.5 rounded-full border",
                                expenseVariation <= 0
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            )}>
                                <span>Despesas</span>
                                {expenseVariation >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                <span>{Math.abs(expenseVariation).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Current Month */}
                    <Card className="glass-card border-blue-500/30 bg-gradient-to-br from-blue-900/10 to-slate-900/50 shadow-lg shadow-blue-900/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />
                        <CardHeader className="pb-2 relative">
                            <CardTitle className="text-sm font-medium text-blue-200 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> {getMonthName(currentMonth.month)} {currentMonth.year}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 relative">
                            <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                                <span className="text-sm text-slate-400">Receitas</span>
                                <span className="font-semibold text-emerald-400">{formatCurrency(currentMonth.income)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                                <span className="text-sm text-slate-400">Despesas</span>
                                <span className="font-semibold text-rose-400">{formatCurrency(currentMonth.expense)}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-slate-400">Saldo</span>
                                <span className={cn(
                                    "font-bold text-lg",
                                    currentMonth.balance >= 0 ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {formatCurrency(currentMonth.balance)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Statement Table */}
            <div>
                <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" /> Extrato do Mês
                </h2>
                <Card className="glass-card border-slate-800/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        {statement.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Nenhuma transação neste mês.</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-slate-900/50 border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-medium text-slate-400 uppercase tracking-wider text-xs">Data</th>
                                        <th className="px-6 py-4 text-left font-medium text-slate-400 uppercase tracking-wider text-xs">Descrição</th>
                                        <th className="px-6 py-4 text-left font-medium text-slate-400 uppercase tracking-wider text-xs">Categoria</th>
                                        <th className="px-6 py-4 text-left font-medium text-slate-400 uppercase tracking-wider text-xs">Status</th>
                                        <th className="px-6 py-4 text-right font-medium text-slate-400 uppercase tracking-wider text-xs">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {statement.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 text-slate-300 font-mono text-xs">{formatDate(entry.date)}</td>
                                            <td className="px-6 py-4 text-slate-200 font-medium">{entry.description}</td>
                                            <td className="px-6 py-4 text-slate-400 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <span className="p-1 rounded bg-slate-800">{entry.category.split(' ')[0]}</span>
                                                    ›
                                                    <span>{entry.subcategory}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-xs font-bold ring-1 ring-inset",
                                                    entry.status === 'PAID'
                                                        ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                                                        : entry.status === 'PENDING'
                                                            ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                                                            : "bg-rose-500/10 text-rose-400 ring-rose-500/20"
                                                )}>
                                                    {entry.status === 'PAID' ? 'Pago' : entry.status === 'PENDING' ? 'Pendente' : 'Atrasado'}
                                                </span>
                                            </td>
                                            <td className={cn(
                                                "px-6 py-4 text-right font-bold tabular-nums",
                                                entry.type === 'INCOME' ? "text-emerald-400" : "text-rose-400"
                                            )}>
                                                {entry.type === 'INCOME' ? '+' : '-'} {formatCurrency(entry.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
