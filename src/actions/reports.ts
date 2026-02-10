/**
 * Reports Server Actions
 * 
 * Includes XML export for monthly statements.
 * 
 * @module actions/reports
 */
'use server';

import { getAuthenticatedUserId } from '@/lib/auth';
import * as reportsDAL from '@/lib/dal/reports';
import { getMonthName } from '@/utils/formatDate';

/**
 * Exports a monthly statement as XML string.
 */
export async function exportMonthlyXML(
    month: number,
    year: number,
): Promise<{ success: boolean; xml?: string; error?: string }> {
    try {
        const userId = await getAuthenticatedUserId();
        const entries = await reportsDAL.getMonthlyStatement(userId, month, year);

        const totalIncome = entries
            .filter((e) => e.type === 'INCOME')
            .reduce((sum, e) => sum + e.amount, 0);
        const totalExpense = entries
            .filter((e) => e.type === 'EXPENSE')
            .reduce((sum, e) => sum + e.amount, 0);

        const monthName = getMonthName(month);

        const xmlLines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<extrato>',
            `  <periodo>${monthName} ${year}</periodo>`,
            `  <geradoEm>${new Date().toISOString()}</geradoEm>`,
            `  <resumo>`,
            `    <totalReceitas>${totalIncome.toFixed(2)}</totalReceitas>`,
            `    <totalDespesas>${totalExpense.toFixed(2)}</totalDespesas>`,
            `    <saldo>${(totalIncome - totalExpense).toFixed(2)}</saldo>`,
            `  </resumo>`,
            `  <transacoes>`,
        ];

        for (const entry of entries) {
            xmlLines.push(
                `    <transacao>`,
                `      <data>${entry.date.toISOString().split('T')[0]}</data>`,
                `      <descricao>${escapeXml(entry.description)}</descricao>`,
                `      <tipo>${entry.type === 'INCOME' ? 'Receita' : 'Despesa'}</tipo>`,
                `      <valor>${entry.amount.toFixed(2)}</valor>`,
                `      <categoria>${escapeXml(entry.category)}</categoria>`,
                `      <subcategoria>${escapeXml(entry.subcategory)}</subcategoria>`,
                `      <status>${entry.status}</status>`,
                `    </transacao>`,
            );
        }

        xmlLines.push('  </transacoes>', '</extrato>');

        return { success: true, xml: xmlLines.join('\n') };
    } catch (error) {
        console.error('[exportMonthlyXML]', error);
        return { success: false, error: 'Erro ao gerar extrato XML.' };
    }
}

/** Escapes special XML characters to prevent injection */
function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
