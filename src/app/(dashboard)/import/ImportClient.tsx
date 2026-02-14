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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { UploadCloud, FileSpreadsheet, ArrowRight, CheckCircle2, AlertCircle, X, ChevronRight, Save, RotateCcw, ChevronLeft, ArrowDown, Search } from 'lucide-react';

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
                    const setSafeTime = (d: Date) => {
                        const safeDate = new Date(d);
                        safeDate.setHours(12, 0, 0, 0);
                        return safeDate;
                    };

                    if (typeof dateStr === 'number') {
                        const excelEpoch = new Date(1900, 0, 1);
                        date = new Date(excelEpoch.getTime() + (dateStr - 2) * 86400000);
                        date = setSafeTime(date);
                    } else if (typeof dateStr === 'string' && dateStr.trim()) {
                        const cleanStr = dateStr.trim();
                        // Support for DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD and others
                        const parts = cleanStr.split(/[\/\-\. ]+/).filter(p => p);

                        if (parts.length === 3) {
                            const p1 = parseInt(parts[0]);
                            const p2 = parseInt(parts[1]);
                            const p3 = parseInt(parts[2]);

                            // 1. Check for YYYY-MM-DD or YYYY-DD-MM
                            if (parts[0].length === 4) {
                                if (p2 > 12) { // YYYY-DD-MM (rare but possible)
                                    date = new Date(p1, p3 - 1, p2, 12, 0, 0);
                                } else { // YYYY-MM-DD
                                    date = new Date(p1, p2 - 1, p3, 12, 0, 0);
                                }
                            }
                            // 2. Check for DD/MM/YYYY or MM/DD/YYYY
                            else if (parts[2].length === 4) {
                                if (p1 > 12) { // Definitely DD/MM/YYYY
                                    date = new Date(p3, p2 - 1, p1, 12, 0, 0);
                                } else if (p2 > 12) { // Definitely MM/DD/YYYY
                                    date = new Date(p3, p1 - 1, p2, 12, 0, 0);
                                } else {
                                    // Ambiguous (01/02/2026). Default to Brazilian DD/MM/YYYY
                                    date = new Date(p3, p2 - 1, p1, 12, 0, 0);
                                }
                            }
                            // 3. Fallback for 2-digit years
                            else {
                                let year = p3;
                                if (year < 100) year += year < 50 ? 2000 : 1900;
                                date = new Date(year, p2 - 1, p1, 12, 0, 0);
                            }
                        } else {
                            date = setSafeTime(new Date(cleanStr));
                        }
                    } else if (dateStr instanceof Date) {
                        date = setSafeTime(dateStr);
                    } else {
                        date = new Date(NaN);
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
                <Card className="glass-card w-full max-w-2xl border-emerald-500/20 bg-gradient-to-b from-slate-900/80 to-slate-900/40 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                    <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

                    <CardContent className="pt-12 pb-8 flex flex-col items-center text-center relative z-10">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 ring-4 ring-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                        </div>

                        <h1 className="text-3xl font-display font-bold text-slate-100 mb-2">Importação Concluída!</h1>
                        <p className="text-slate-400 mb-10 max-w-md mx-auto">Suas transações foram processadas e adicionadas com sucesso.</p>

                        <div className="grid grid-cols-2 gap-8 w-full max-w-md mb-10">
                            <div className="flex flex-col gap-1 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                <span className="text-4xl font-bold font-display text-emerald-400">{importResult.imported}</span>
                                <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Transações Importadas</span>
                            </div>
                            {importResult.skipped > 0 && (
                                <div className="flex flex-col gap-1 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                    <span className="text-4xl font-bold font-display text-amber-400">{importResult.skipped}</span>
                                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Duplicatas Ignoradas</span>
                                </div>
                            )}
                        </div>

                        {importResult.imported > 0 && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-8 text-sm text-blue-200 flex gap-3 text-left w-full max-w-md">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-400" />
                                <p><strong>Dica:</strong> As transações importadas podem estar em meses diferentes. Use os filtros de mês/ano na página de Transações para visualizá-las.</p>
                            </div>
                        )}

                        <div className="flex gap-4 w-full max-w-md">
                            <Button onClick={() => window.location.href = '/transactions'} className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/20">
                                Ver Transações
                            </Button>
                            <Button onClick={() => window.location.reload()} variant="outline" className="flex-1 border-slate-700 hover:bg-slate-800 text-slate-300">
                                Nova Importação
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-100">Importar Extrato</h1>
                    <p className="text-slate-400">Importe transações via Excel ou CSV</p>
                </div>
            </div>

            {/* Stepper */}
            <Card className="glass-card border-slate-800/50 p-4">
                <div className="flex items-center justify-between md:justify-center relative">
                    {/* Connection Line */}
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-800 -z-10 hidden md:block w-3/4 mx-auto" />

                    {[1, 2, 3].map((s) => (
                        <div key={s} className={cn(
                            "flex items-center gap-2 relative bg-slate-900 px-4 py-2 rounded-full border transition-all duration-300",
                            step >= s
                                ? "border-blue-500/50 text-blue-400 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                : "border-slate-800 text-slate-500 bg-slate-900"
                        )}>
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-offset-2 ring-offset-slate-900 transition-all",
                                step >= s ? "bg-blue-500 text-white ring-blue-500" : "bg-slate-800 text-slate-400 ring-slate-800"
                            )}>
                                {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider hidden md:inline-block">
                                {s === 1 && 'Upload'}
                                {s === 2 && 'Mapeamento'}
                                {s === 3 && 'Confirmação'}
                            </span>
                        </div>
                    ))}
                </div>
            </Card>

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-200 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                    <span>{error}</span>
                </div>
            )}

            {/* Step 1: Upload */}
            {step === 1 && (
                <Card className="glass-card border-dashed border-2 border-slate-700 hover:border-blue-500/50 bg-slate-900/30 transition-all cursor-pointer group"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <CardContent className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 group-hover:bg-blue-500/10 group-hover:scale-110 transition-all duration-300">
                            <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-200 mb-2 group-hover:text-blue-200 transition-colors">
                            Clique ou arraste seu arquivo aqui
                        </h3>
                        <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
                            Suportamos arquivos .xlsx, .xls e .csv de até 5MB
                        </p>
                        <Button variant="outline" className="border-slate-600 hover:bg-slate-700 text-slate-300">
                            Selecionar Arquivo
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileInput}
                            className="hidden"
                        />
                        {loading && <div className="mt-6 text-blue-400 animate-pulse text-sm">Processando arquivo...</div>}

                        <div className="mt-12 flex items-center gap-8 text-slate-600 text-xs grayscale opacity-50">
                            <span className="flex items-center gap-1"><FileSpreadsheet className="w-4 h-4" /> Excel</span>
                            <span className="flex items-center gap-1"><FileSpreadsheet className="w-4 h-4" /> CSV</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Column Mapping */}
            {step === 2 && parsedData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-100">1. Mapeie as colunas do seu extrato</CardTitle>
                            <CardDescription>Indique quais colunas correspondem aos dados necessários</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">Coluna de Data *</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={dateColumn}
                                    onChange={(e) => setDateColumn(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    {parsedData.headers.map((h) => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">Coluna de Descrição *</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={descriptionColumn}
                                    onChange={(e) => setDescriptionColumn(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    {parsedData.headers.map((h) => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">Coluna de Valor *</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={amountColumn}
                                    onChange={(e) => setAmountColumn(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    {parsedData.headers.map((h) => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-100">2. Selecione conta e categoria padrão</CardTitle>
                            <CardDescription>Esses valores serão usados para todas as transações importadas</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">Conta Destino *</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={selectedAccountId}
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    {accounts.map((a) => (
                                        <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">Categoria/Subcategoria Padrão *</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                        </CardContent>
                    </Card>

                    <Card className="glass-card overflow-hidden">
                        <CardHeader className="bg-slate-950/50 border-b border-slate-800/50 py-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-300">Pré-visualização (primeiras 10 linhas do arquivo)</CardTitle>
                            </div>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-900/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500 text-xs">Data</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500 text-xs">Descrição</th>
                                        <th className="px-4 py-3 text-left font-medium text-slate-500 text-xs">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {parsedData.rows.slice(0, 10).map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-800/30">
                                            <td className="px-4 py-2 text-slate-300">{dateColumn && (row[dateColumn] instanceof Date ? row[dateColumn].toLocaleDateString('pt-BR') : row[dateColumn])}</td>
                                            <td className="px-4 py-2 text-slate-300">{descriptionColumn && (row[descriptionColumn] instanceof Date ? row[descriptionColumn].toLocaleDateString('pt-BR') : row[descriptionColumn])}</td>
                                            <td className="px-4 py-2 text-slate-300">{amountColumn && (row[amountColumn] instanceof Date ? row[amountColumn].toLocaleDateString('pt-BR') : row[amountColumn])}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <CardFooter className="bg-slate-950/50 border-t border-slate-800/50 py-4 flex justify-between">
                            <Button onClick={() => setStep(1)} variant="ghost" className="text-slate-400 hover:text-white">
                                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                            </Button>
                            <Button onClick={handleMapping} className="bg-blue-600 hover:bg-blue-500 text-white">
                                Continuar <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Confirme a Importação
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 flex flex-col items-center justify-center text-center">
                                    <span className="text-xs text-slate-400 uppercase tracking-wider">Total de Transações</span>
                                    <span className="text-3xl font-bold font-display text-white mt-1">{transactions.length}</span>
                                </div>
                                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 flex flex-col items-center justify-center text-center">
                                    <span className="text-xs text-slate-400 uppercase tracking-wider">Valor Total</span>
                                    <span className="text-3xl font-bold font-display text-white mt-1">
                                        {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
                                    </span>
                                </div>
                            </div>

                            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/30">
                                <div className="bg-slate-800/50 px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                                    Lista de Transações Mapeadas
                                </div>
                                <div className="max-h-[400px] overflow-y-auto p-2 space-y-2">
                                    {transactions.slice(0, 50).map((tx, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded bg-slate-800/30 border border-slate-800/50 hover:border-slate-700 transition-colors">
                                            <div>
                                                <p className="font-medium text-slate-200 text-sm">{tx.description}</p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                                                    {formatDate(tx.date)}
                                                </p>
                                            </div>
                                            <span className={cn(
                                                "font-bold font-mono text-sm",
                                                tx.type === 'INCOME' ? "text-emerald-400" : "text-rose-400"
                                            )}>
                                                {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount)}
                                            </span>
                                        </div>
                                    ))}
                                    {transactions.length > 50 && (
                                        <div className="py-4 text-center text-xs text-slate-500 font-medium bg-slate-900/50 rounded border border-dashed border-slate-800">
                                            + {transactions.length - 50} transações adicionais
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-6">
                            <Button onClick={() => setStep(2)} variant="ghost" disabled={importing} className="text-slate-400 hover:text-white">
                                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                            </Button>
                            <Button
                                onClick={handleConfirmImport}
                                disabled={importing}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[150px]"
                            >
                                {importing ? (
                                    <>
                                        <RotateCcw className="w-4 h-4 mr-2 animate-spin" /> Importando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" /> Importar {transactions.length} itens
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
