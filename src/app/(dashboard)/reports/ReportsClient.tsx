/**
 * Reports Client — Monthly comparison and XML export
 */
'use client';

import { useCallback } from 'react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, getMonthName } from '@/utils/formatDate';
import { exportMonthlyXML } from '@/actions/reports';
import type { MonthlyComparisonDTO, StatementEntryDTO } from '@/lib/dal/reports';
import styles from './Reports.module.css';

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
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Relatórios</h1>
                <button onClick={handleExportXML} className="btn btn--primary">
                    📥 Exportar XML
                </button>
            </div>

            {/* Monthly Comparison */}
            <h2 className={styles.sectionTitle}>Comparativo Mensal</h2>
            <div className={styles.comparisonGrid}>
                <div className={`card ${styles.compCard}`}>
                    <h3>{getMonthName(previousMonth.month)} {previousMonth.year}</h3>
                    <div className={styles.compRow}>
                        <span className={styles.compLabel}>Receitas</span>
                        <span className={styles.compIncome}>{formatCurrency(previousMonth.income)}</span>
                    </div>
                    <div className={styles.compRow}>
                        <span className={styles.compLabel}>Despesas</span>
                        <span className={styles.compExpense}>{formatCurrency(previousMonth.expense)}</span>
                    </div>
                    <div className={styles.compRow}>
                        <span className={styles.compLabel}>Saldo</span>
                        <span className={previousMonth.balance >= 0 ? styles.compIncome : styles.compExpense}>
                            {formatCurrency(previousMonth.balance)}
                        </span>
                    </div>
                </div>

                <div className={styles.vsIndicator}>
                    <div className={styles.vsArrow}>→</div>
                    <div className={styles.vsVariations}>
                        <span className={incomeVariation >= 0 ? styles.varPositive : styles.varNegative}>
                            Receitas: {incomeVariation >= 0 ? '↑' : '↓'} {Math.abs(incomeVariation).toFixed(1)}%
                        </span>
                        <span className={expenseVariation <= 0 ? styles.varPositive : styles.varNegative}>
                            Despesas: {expenseVariation >= 0 ? '↑' : '↓'} {Math.abs(expenseVariation).toFixed(1)}%
                        </span>
                    </div>
                </div>

                <div className={`card ${styles.compCard} ${styles.compCardCurrent}`}>
                    <h3>{getMonthName(currentMonth.month)} {currentMonth.year}</h3>
                    <div className={styles.compRow}>
                        <span className={styles.compLabel}>Receitas</span>
                        <span className={styles.compIncome}>{formatCurrency(currentMonth.income)}</span>
                    </div>
                    <div className={styles.compRow}>
                        <span className={styles.compLabel}>Despesas</span>
                        <span className={styles.compExpense}>{formatCurrency(currentMonth.expense)}</span>
                    </div>
                    <div className={styles.compRow}>
                        <span className={styles.compLabel}>Saldo</span>
                        <span className={currentMonth.balance >= 0 ? styles.compIncome : styles.compExpense}>
                            {formatCurrency(currentMonth.balance)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Statement Table */}
            <h2 className={styles.sectionTitle}>Extrato do Mês</h2>
            <div className={`card ${styles.tableCard}`}>
                {statement.length === 0 ? (
                    <div className={styles.empty}>Nenhuma transação neste mês.</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Descrição</th>
                                <th>Categoria</th>
                                <th>Status</th>
                                <th className={styles.alignRight}>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statement.map((entry) => (
                                <tr key={entry.id}>
                                    <td>{formatDate(entry.date)}</td>
                                    <td>{entry.description}</td>
                                    <td className={styles.catCell}>{entry.category} › {entry.subcategory}</td>
                                    <td>
                                        <span className={`badge ${entry.status === 'PAID' ? 'badge--success' :
                                                entry.status === 'PENDING' ? 'badge--warning' : 'badge--danger'
                                            }`}>
                                            {entry.status === 'PAID' ? 'Pago' : entry.status === 'PENDING' ? 'Pendente' : 'Atrasado'}
                                        </span>
                                    </td>
                                    <td className={`${styles.alignRight} ${entry.type === 'INCOME' ? styles.compIncome : styles.compExpense}`}>
                                        {entry.type === 'INCOME' ? '+' : '-'} {formatCurrency(entry.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
