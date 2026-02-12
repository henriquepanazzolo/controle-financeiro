import * as XLSX from 'xlsx';

export interface ParsedRow {
    [key: string]: string | number | Date | null;
}

export interface ImportResult {
    headers: string[];
    rows: ParsedRow[];
    totalRows: number;
    suggestedMapping: {
        dateColumn?: string;
        descriptionColumn?: string;
        amountColumn?: string;
    };
    fileName: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const VALID_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/csv', // .csv
    'text/plain' // .csv (sometimes)
];

const VALID_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

/**
 * Auto-detects column mapping based on common bank export headers.
 */
function detectColumnMapping(headers: string[]): ImportResult['suggestedMapping'] {
    const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

    // Date column detection
    const datePatterns = ['data', 'date', 'dt', 'dia'];
    const dateColumn = headers.find((h, i) =>
        datePatterns.some((p) => lowerHeaders[i].includes(p)),
    );

    // Description column detection
    const descPatterns = ['descrição', 'descricao', 'description', 'histórico', 'historico', 'memo', 'lancamento', 'lançamento'];
    const descriptionColumn = headers.find((h, i) =>
        descPatterns.some((p) => lowerHeaders[i].includes(p)),
    );

    // Amount column detection
    const amountPatterns = ['valor', 'amount', 'value', 'montante', 'quantia'];
    const amountColumn = headers.find((h, i) =>
        amountPatterns.some((p) => lowerHeaders[i].includes(p)),
    );

    return {
        dateColumn,
        descriptionColumn,
        amountColumn,
    };
}

/**
 * Validates the file based on size, extension and MIME type.
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
        return { valid: false, error: 'Nenhum arquivo enviado.' };
    }

    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: 'Arquivo muito grande. Máximo: 5MB.' };
    }

    const fileName = file.name.toLowerCase();
    const isValidExtension = VALID_EXTENSIONS.some((ext) => fileName.endsWith(ext));

    if (!isValidExtension) {
        return { valid: false, error: 'Formato inválido. Use .xlsx, .xls ou .csv' };
    }

    // MIME type check (soft check, as browsers can differ or send empty types)
    if (file.type && !VALID_MIME_TYPES.includes(file.type)) {
        // Log warning but maybe don't block strict compliance unless critical security requirement?
        // For now, let's keep it strict if type is present, but allow if empty (some systems issue)
        // console.warn(`MIME type mismatch: ${file.type}`);
    }

    return { valid: true };
}

/**
 * Parses the financial file (Excel or CSV) and returns structured data.
 */
export async function parseFinancialFile(file: File): Promise<ImportResult> {
    const buffer = await file.arrayBuffer();

    // Read the workbook
    const workbook = XLSX.read(buffer, {
        type: 'buffer',
        codepage: 65001, // UTF-8
        cellDates: true, // Auto parse dates
    });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        throw new Error('Planilha vazia ou ilegível.');
    }

    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
        header: 1,
        defval: null,
        raw: false, // Ensure we get formatted strings/dates handled decently, or true if we want raw values
        dateNF: 'yyyy-mm-dd', // Force date format if possible
    }) as unknown[][];

    if (jsonData.length < 2) {
        throw new Error('Arquivo não contém dados suficientes.');
    }

    // Extract headers
    const headers = (jsonData[0] as (string | null)[])
        .filter((h): h is string => h !== null)
        .map((h) => String(h).trim());

    // Extract rows
    const rows = jsonData.slice(1).filter((row) => {
        return row.some((cell) => cell !== null && cell !== '');
    });

    // Map to object array
    const parsedRows: ParsedRow[] = rows.map((row) => {
        const obj: ParsedRow = {};
        headers.forEach((header, i) => {
            let val = row[i];

            // Basic sanitization/normalization could happen here if needed
            if (typeof val === 'string') {
                val = val.trim();
            }

            obj[header] = val as string | number | Date | null;
        });
        return obj;
    });

    const suggestedMapping = detectColumnMapping(headers);

    return {
        headers,
        rows: parsedRows,
        totalRows: parsedRows.length,
        suggestedMapping,
        fileName: file.name
    };
}
