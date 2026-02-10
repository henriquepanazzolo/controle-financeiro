/**
 * Import API Route — File Upload & Parsing
 * 
 * POST /api/import
 * Receives Excel/CSV file, parses with SheetJS, returns preview data.
 * 
 * @module app/api/import
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as XLSX from 'xlsx';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ParsedRow {
    [key: string]: string | number | Date | null;
}

/**
 * Auto-detects column mapping based on common bank export headers.
 */
function detectColumnMapping(headers: string[]): {
    dateColumn?: string;
    descriptionColumn?: string;
    amountColumn?: string;
} {
    const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

    // Date column detection
    const datePatterns = ['data', 'date', 'dt'];
    const dateColumn = headers.find((h, i) =>
        datePatterns.some((p) => lowerHeaders[i].includes(p)),
    );

    // Description column detection
    const descPatterns = ['descrição', 'descricao', 'description', 'histórico', 'historico', 'memo'];
    const descriptionColumn = headers.find((h, i) =>
        descPatterns.some((p) => lowerHeaders[i].includes(p)),
    );

    // Amount column detection
    const amountPatterns = ['valor', 'amount', 'value', 'montante'];
    const amountColumn = headers.find((h, i) =>
        amountPatterns.some((p) => lowerHeaders[i].includes(p)),
    );

    return {
        dateColumn,
        descriptionColumn,
        amountColumn,
    };
}

export async function POST(req: NextRequest) {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        // Get file from FormData
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'Arquivo muito grande. Máximo: 5MB.' },
                { status: 400 },
            );
        }

        // Validate file type
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const fileName = file.name.toLowerCase();
        const isValidType = validExtensions.some((ext) => fileName.endsWith(ext));

        if (!isValidType) {
            return NextResponse.json(
                { error: 'Formato inválido. Use .xlsx, .xls ou .csv' },
                { status: 400 },
            );
        }

        // Parse file with UTF-8 encoding support
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, {
            type: 'buffer',
            codepage: 65001, // UTF-8 encoding for proper accent support
        });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            return NextResponse.json({ error: 'Planilha vazia.' }, { status: 400 });
        }

        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, {
            header: 1,
            defval: null,
            raw: false, // Format dates as strings
        }) as unknown[][];

        if (jsonData.length < 2) {
            return NextResponse.json({ error: 'Arquivo não contém dados.' }, { status: 400 });
        }

        // Extract headers (first row)
        const headers = (jsonData[0] as (string | null)[])
            .filter((h): h is string => h !== null)
            .map((h) => String(h).trim());

        // Extract data rows (skip header)
        const rows = jsonData.slice(1).filter((row) => {
            // Skip empty rows
            return row.some((cell) => cell !== null && cell !== '');
        });

        // Convert to object array
        const parsedRows: ParsedRow[] = rows.map((row) => {
            const obj: ParsedRow = {};
            headers.forEach((header, i) => {
                obj[header] = row[i] as string | number | null;
            });
            return obj;
        });

        // Auto-detect column mapping
        const suggestedMapping = detectColumnMapping(headers);

        return NextResponse.json({
            headers,
            rows: parsedRows.slice(0, 100), // Preview max 100 rows
            totalRows: parsedRows.length,
            suggestedMapping,
            fileName: file.name,
        });
    } catch (error) {
        console.error('[POST /api/import]', error);
        return NextResponse.json(
            { error: 'Erro ao processar arquivo.' },
            { status: 500 },
        );
    }
}
