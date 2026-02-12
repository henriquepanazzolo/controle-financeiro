import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        return NextResponse.json({
            sessionUserId: session?.user?.id ?? null,
            email: session?.user?.email ?? null
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
