/**
 * Import Client — 3-Step Wizard for Excel/CSV Import
 * 
 * Step 1: Upload file (drag-and-drop)
 * Step 2: Map columns (date, description, amount) + select account/category
 * Step 3: Preview and confirm import
 */
'use client';

import { useState, useCallback, useRef } from 'react';
import { confirmImport } from '@/actions/imports';
import { generateExternalId } from '@/utils/importUtils';
import type { CategoryDTO } from '@/lib/dal/categories';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import styles from './Import.module.css';

interface Props {
    accounts: Array<{ id: string; name: string; icon: string | null }>;
    categories: CategoryDTO[];
}

interface ParsedData {
    headers: string[];
    rows: Array<Record<string, string | number | Date | null>>;
    totalRows: number;
    suggestedMapping: {
        dateColumn?: string;
        descriptionColumn?: string;
        amountColumn?: string;
    };
    fileName: string;
}

interface MappedTransaction {
    date: Date;
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    externalId: string;
    isDuplicate?: boolean;
}

type Step = 1 | 2 | 3;

export default function ImportClient({ accounts, categories }: Props) {
    const [step, setStep] = useState<Step>(1);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 2: Column mapping
    const [dateColumn, setDateColumn] = useState('');
    const [descriptionColumn, setDescriptionColumn] = useState('');
    const [amountColumn, setAmountColumn] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');

    // Step 3: Mapped transactions
    const [transactions, setTransactions] = useState<MappedTransaction[]>([]);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- STEP 1: Upload ---
    const handleFileSelect = useCallback(async (file: File) => {
        setError('');
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/import', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao processar arquivo.');
            }

            setUploadedFile(file);
            setParsedData(data);

            // Auto-fill mapping if detected
            setDateColumn(data.suggestedMapping.dateColumn || '');
            setDescriptionColumn(data.suggestedMapping.descriptionColumn || '');
            setAmountColumn(data.suggestedMapping.amountColumn || '');

            setStep(2);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao processar arquivo.');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    // --- STEP 2: Map columns and preview ---
    const handleMapping = useCallback(() => {
        if (!parsedData || !dateColumn || !descriptionColumn || !amountColumn) {
            setError('Selecione todas as colunas obrigatórias.');
            return;
        }

        if (!selectedAccountId || !selectedSubcategoryId) {
            setError('Selecione conta e categoria padrão.');
            return;
        }

        setError('');

        // Map rows to transactions
        const mapped: MappedTransaction[] = parsedData.rows
            .map((row) => {
                try {
                    const dateStr = row[dateColumn];
                    const desc = String(row[descriptionColumn] || '').trim();
                    const amountRaw = row[amountColumn];

                    if (!dateStr || !desc || !amountRaw) return null;

                    // Parse date
                    let date: Date;
                    if (typeof dateStr === 'number') {
                        // Excel serial number date (days since 1900-01-01)
                        const excelEpoch = new Date(1900, 0, 1);
                        date = new Date(excelEpoch.getTime() + (dateStr - 2) * 86400000);
                    } else if (typeof dateStr === 'string') {
                        // Try parsing DD/MM/YYYY, MM/DD/YYYY, or YYYY-MM-DD
                        const parts = dateStr.trim().split(/[\/\-\. ]/);

                        if (parts.length === 3) {
                            let first = parseInt(parts[0]);
                            let second = parseInt(parts[1]);
                            let third = parseInt(parts[2]);

                            // Handle 2-digit years: convert to 4-digit
                            // Assumes 00-49 = 2000-2049, 50-99 = 1950-1999
                            if (parts[2].length === 2 && third >= 0 && third <= 99) {
                                third = third < 50 ? 2000 + third : 1900 + third;
                            }

                            if (parts[0].length === 4 || first > 999) {
                                // YYYY-MM-DD or YYYY/MM/DD
                                date = new Date(first, second - 1, third);
                            } else if (first > 12 && first <= 31) {
                                // Definitely DD/MM/YYYY (day > 12)
                                date = new Date(third, second - 1, first);
                            } else if (second > 12 && second <= 31) {
                                // Definitely MM/DD/YYYY (second part > 12 means it's the day)
                                date = new Date(third, first - 1, second);
                            } else {
                                // Ambiguous - assume Brazilian format DD/MM/YYYY
                                date = new Date(third, second - 1, first);
                            }
                        } else {
                            date = new Date(dateStr);
                        }
                    } else {
                        date = new Date(dateStr);
                    }

                    if (isNaN(date.getTime())) return null;

                    // Parse amount - SMART DETECTION
                    let amount = 0;
                    if (typeof amountRaw === 'number') {
                        amount = Math.abs(amountRaw);
                    } else if (typeof amountRaw === 'string') {
                        let cleaned = amountRaw.trim();

                        // Remove currency symbols and whitespace
                        cleaned = cleaned.replace(/[R$\s]/g, '');

                        // Detect format based on separators
                        // Brazilian: 1.234,56 (dot = thousand, comma = decimal)
                        // International: 1,234.56 (comma = thousand, dot = decimal)

                        const hasComma = cleaned.includes(',');
                        const hasDot = cleaned.includes('.');

                        if (hasComma && hasDot) {
                            // Both separators present - check positions
                            const lastComma = cleaned.lastIndexOf(',');
                            const lastDot = cleaned.lastIndexOf('.');

                            if (lastComma > lastDot) {
                                // Brazilian: 1.234,56 → remove dots, replace comma with dot
                                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
                            } else {
                                // International: 1,234.56 → remove commas
                                cleaned = cleaned.replace(/,/g, '');
                            }
                        } else if (hasComma) {
                            // Only comma - could be decimal or thousand separator
                            // If 2 digits after comma, it's decimal (Brazilian)
                            // Otherwise it's thousand separator (International)
                            const parts = cleaned.split(',');
                            if (parts.length === 2 && parts[1].length <= 2) {
                                // Brazilian decimal: 10,50
                                cleaned = cleaned.replace(',', '.');
                            } else {
                                // International thousand: 1,234
                                cleaned = cleaned.replace(/,/g, '');
                            }
                        } else if (hasDot) {
                            // Only dot - could be decimal or thousand separator
                            // If 2 digits after dot, it's decimal (International)
                            // Otherwise it's thousand separator (Brazilian)
                            const parts = cleaned.split('.');
                            if (parts.length === 2 && parts[1].length <= 2) {
                                // International decimal: 10.50 → keep as is
                                // Do nothing, already in correct format
                            } else {
                                // Brazilian thousand: 1.234 → remove dot
                                cleaned = cleaned.replace(/\./g, '');
                            }
                        }
                        // If no separators, it's already a clean number

                        amount = Math.abs(parseFloat(cleaned));
                    }

                    if (isNaN(amount) || amount === 0) return null;

                    // Detect type: if amount was negative, it's expense
                    const type: 'INCOME' | 'EXPENSE' =
                        (typeof amountRaw === 'number' && amountRaw < 0) ||
                            (typeof amountRaw === 'string' && amountRaw.includes('-'))
                            ? 'INCOME'
                            : 'EXPENSE'; // Default to expense (positive values are usually expenses in this context)

                    const externalId = generateExternalId(date, amount, desc);

                    return {
                        date,
                        description: desc,
                        amount,
                        type,
                        externalId,
                    };
                } catch {
                    return null;
                }
            })
            .filter((t) => t !== null) as MappedTransaction[];

        setTransactions(mapped);
        setStep(3);
    }, [parsedData, dateColumn, descriptionColumn, amountColumn, selectedAccountId, selectedSubcategoryId]);

    // --- STEP 3: Confirm import ---
    const handleConfirmImport = useCallback(async () => {
        setImporting(true);
        setError('');

        try {
            const result = await confirmImport({
                accountId: selectedAccountId,
                defaultSubcategoryId: selectedSubcategoryId,
                transactions: transactions.map((t) => ({
                    date: t.date,
                    description: t.description,
                    amount: t.amount,
                    type: t.type,
                    externalId: t.externalId,
                })),
                fileName: parsedData?.fileName || '',
            });

            if (!result.success) {
                throw new Error(result.error || 'Erro ao importar.');
            }

            setImportResult(result.data!);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao importar transações.');
        } finally {
            setImporting(false);
        }
    }, [selectedAccountId, selectedSubcategoryId, transactions, parsedData]);

    // --- Render success screen ---
    if (importResult) {
        return (
            <div className={styles.page}>
                <div className={styles.successCard}>
                    <div className={styles.successIcon}>✅</div>
                    <h1 className={styles.successTitle}>Importação Concluída!</h1>
                    <div className={styles.successStats}>
                        <div className={styles.successStat}>
                            <span className={styles.successNumber}>{importResult.imported}</span>
                            <span className={styles.successLabel}>Transações importadas</span>
                        </div>
                        {importResult.skipped > 0 && (
                            <div className={styles.successStat}>
                                <span className={`${styles.successNumber} ${styles.skipped}`}>{importResult.skipped}</span>
                                <span className={styles.successLabel}>Duplicatas ignoradas</span>
                            </div>
                        )}
                    </div>

                    {importResult.imported > 0 && (
                        <div className={styles.successHint}>
                            💡 <strong>Dica:</strong> As transações importadas podem estar em meses diferentes.
                            Use os filtros de mês/ano na página de Transações para visualizá-las.
                        </div>
                    )}

                    <div className={styles.successActions}>
                        <button onClick={() => window.location.href = '/transactions'} className="btn btn--primary">
                            Ver Transações
                        </button>
                        <button onClick={() => window.location.reload()} className="btn btn--secondary">
                            Nova Importação
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Importar Extrato</h1>
            </div>

            {/* Stepper */}
            <div className={styles.stepper}>
                {[1, 2, 3].map((s) => (
                    <div key={s} className={`${styles.stepperItem} ${step >= s ? styles.stepperActive : ''}`}>
                        <div className={styles.stepperCircle}>{s}</div>
                        <span className={styles.stepperLabel}>
                            {s === 1 && 'Upload'}
                            {s === 2 && 'Mapeamento'}
                            {s === 3 && 'Confirmação'}
                        </span>
                    </div>
                ))}
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            {/* Step 1: Upload */}
            {step === 1 && (
                <div className={styles.uploadContainer}>
                    <div
                        className={styles.dropzone}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className={styles.dropzoneIcon}>📁</div>
                        <div className={styles.dropzoneText}>
                            Arraste e solte ou clique para selecionar
                        </div>
                        <div className={styles.dropzoneHint}>
                            Formatos aceitos: .xlsx, .xls, .csv (máx. 5MB)
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileInput}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {loading && <div className={styles.loading}>Processando arquivo...</div>}
                </div>
            )}

            {/* Step 2: Column Mapping */}
            {step === 2 && parsedData && (
                <div className={styles.mappingContainer}>
                    <div className="card">
                        <h2 className={styles.subtitle}>1. Mapeie as colunas do seu extrato</h2>
                        <div className={styles.mappingGrid}>
                            <div className="input-group">
                                <label>Coluna de Data *</label>
                                <select
                                    className="input"
                                    value={dateColumn}
                                    onChange={(e) => setDateColumn(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    {parsedData.headers.map((h) => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Coluna de Descrição *</label>
                                <select
                                    className="input"
                                    value={descriptionColumn}
                                    onChange={(e) => setDescriptionColumn(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    {parsedData.headers.map((h) => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Coluna de Valor *</label>
                                <select
                                    className="input"
                                    value={amountColumn}
                                    onChange={(e) => setAmountColumn(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    {parsedData.headers.map((h) => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <h2 className={styles.subtitle}>2. Selecione conta e categoria padrão</h2>
                        <div className={styles.mappingGrid}>
                            <div className="input-group">
                                <label>Conta *</label>
                                <select
                                    className="input"
                                    value={selectedAccountId}
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    {accounts.map((a) => (
                                        <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Categoria/Subcategoria Padrão *</label>
                                <select
                                    className="input"
                                    value={selectedSubcategoryId}
                                    onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    {categories
                                        .filter((c) => c.type === 'EXPENSE')
                                        .map((c) =>
                                            c.subcategories.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {c.icon} {c.name} › {s.name}
                                                </option>
                                            )),
                                        )}
                                </select>
                            </div>
                        </div>

                        <h2 className={styles.subtitle}>3. Preview (primeiras 10 linhas)</h2>
                        <div className={styles.previewTable}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Descrição</th>
                                        <th>Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedData.rows.slice(0, 10).map((row, i) => (
                                        <tr key={i}>
                                            <td>{dateColumn && (row[dateColumn] instanceof Date ? row[dateColumn].toLocaleDateString('pt-BR') : row[dateColumn])}</td>
                                            <td>{descriptionColumn && (row[descriptionColumn] instanceof Date ? row[descriptionColumn].toLocaleDateString('pt-BR') : row[descriptionColumn])}</td>
                                            <td>{amountColumn && (row[amountColumn] instanceof Date ? row[amountColumn].toLocaleDateString('pt-BR') : row[amountColumn])}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className={styles.actions}>
                            <button onClick={() => setStep(1)} className="btn btn--secondary">
                                Voltar
                            </button>
                            <button onClick={handleMapping} className="btn btn--primary">
                                Continuar → Preview Completo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
                <div className={styles.confirmContainer}>
                    <div className="card">
                        <h2 className={styles.subtitle}>Confirme a importação</h2>
                        <div className={styles.summary}>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Total de transações:</span>
                                <span className={styles.summaryValue}>{transactions.length}</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Valor total:</span>
                                <span className={styles.summaryValue}>
                                    {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
                                </span>
                            </div>
                        </div>

                        <div className={styles.transactionsList}>
                            {transactions.slice(0, 50).map((tx, i) => (
                                <div key={i} className={`${styles.txItem} card card--flat`}>
                                    <div className={styles.txLeft}>
                                        <span className={styles.txDesc}>{tx.description}</span>
                                        <span className={styles.txMeta}>{formatDate(tx.date)}</span>
                                    </div>
                                    <div className={styles.txRight}>
                                        <span className={`${styles.txAmount} ${tx.type === 'INCOME' ? styles.income : styles.expense}`}>
                                            {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {transactions.length > 50 && (
                                <div className={styles.moreTransactions}>
                                    + {transactions.length - 50} transações adicionais
                                </div>
                            )}
                        </div>

                        <div className={styles.actions}>
                            <button onClick={() => setStep(2)} className="btn btn--secondary" disabled={importing}>
                                Voltar
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                className="btn btn--primary btn--lg"
                                disabled={importing}
                            >
                                {importing ? 'Importando...' : `Importar ${transactions.length} transações`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
