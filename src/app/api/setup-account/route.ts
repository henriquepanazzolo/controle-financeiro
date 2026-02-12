import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await prisma.user.findFirst();

        if (!user) {
            return NextResponse.json({ error: 'Nenhum usuário encontrado.' }, { status: 404 });
        }

        const account = await prisma.account.create({
            data: {
                userId: user.id,
                name: 'Conta Principal (Recuperada)',
                type: 'CHECKING',
                icon: '🏦',
                color: '#3B82F6',
                isActive: true,
                balance: 0
            }
        });

        return NextResponse.json({
            message: 'Conta criada com sucesso!',
            account
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
