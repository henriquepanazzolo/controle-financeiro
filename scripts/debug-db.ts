import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- USERS ---');
    const users = await prisma.user.findMany({
        include: {
            accounts: true,
            _count: {
                select: { transactions: true, categories: true }
            }
        }
    });

    if (users.length === 0) {
        console.log('No users found.');
    }

    users.forEach(u => {
        console.log(`User: ${u.email} (ID: ${u.id})`);
        console.log(`  Transactions: ${u._count.transactions}`);
        console.log(`  Categories: ${u._count.categories}`);
        console.log(`  Accounts (${u.accounts.length}):`);
        u.accounts.forEach(a => {
            console.log(`    - [${a.isActive ? 'ACTIVE' : 'INACTIVE'}] ${a.name} (ID: ${a.id}) Balance: ${a.balance}`);
        });
        console.log('-----------------------------------');
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
