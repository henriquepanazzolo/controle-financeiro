/**
 * Import API Route — File Upload & Parsing
 * 
 * POST /api/import
 * Receives Excel/CSV file, parses with SheetJS via import-service, returns preview data.
 * 
 * @module app/api/import
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { parseFinancialFile, validateFile } from '@/lib/services/import-service';

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

        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        // Parse file using service
        try {
            const result = await parseFinancialFile(file);

            return NextResponse.json({
                ...result,
                rows: result.rows.slice(0, 100), // Preview max 100 rows
            });
        } catch (parseError: any) {
            console.error('[Import Service Error]', parseError);
            return NextResponse.json(
                { error: parseError.message || 'Erro ao ler o arquivo.' },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('[POST /api/import] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Erro interno ao processar arquivo.' },
            { status: 500 },
        );
    }
}
