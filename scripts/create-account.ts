import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error('No users found in database.');
        return;
    }

    console.log(`Creating account for user: ${user.email} (${user.id})`);

    const account = await prisma.account.create({
        data: {
            userId: user.id,
            name: 'Conta Teste Manual',
            type: 'CHECKING',
            icon: '🏦',
            color: '#3B82F6',
            isActive: true,
            balance: 0
        }
    });

    console.log(`Account created successfully: ${account.name} (${account.id})`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
