import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding transactions...');

    const user = await prisma.user.findFirst();
    if (!user) {
        console.error('❌ No user found. Run the main seed first.');
        return;
    }

    const account = await prisma.account.findFirst({ where: { userId: user.id } });
    if (!account) {
        console.error('❌ No account found.');
        return;
    }

    // Get categories
    const categories = await prisma.category.findMany({
        where: { userId: user.id },
        include: { subcategories: true }
    });

    const expenseCats = categories.filter(c => c.type === 'EXPENSE');
    const incomeCats = categories.filter(c => c.type === 'INCOME');

    if (expenseCats.length === 0 || incomeCats.length === 0) {
        console.error('❌ Missing categories.');
        return;
    }

    // Helper to create transaction
    const createTx = async (month: number, year: number, count: number) => {
        for (let i = 0; i < count; i++) {
            const isExpense = Math.random() > 0.3; // 70% expenses
            const catList = isExpense ? expenseCats : incomeCats;
            const category = catList[Math.floor(Math.random() * catList.length)];
            const subcategory = category.subcategories[0]; // Just take first sub

            if (!subcategory) continue;

            const day = Math.floor(Math.random() * 28) + 1;
            const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

            await prisma.transaction.create({
                data: {
                    userId: user.id,
                    accountId: account.id,
                    subcategoryId: subcategory.id,
                    type: isExpense ? 'EXPENSE' : 'INCOME',
                    amount: Math.floor(Math.random() * 500) + 50,
                    description: `${isExpense ? 'Gasto' : 'Receita'} Teste ${i + 1}`,
                    date: date,
                    status: 'PAID',
                    createdAt: date, // created at same time
                }
            });
        }
        console.log(`✅ Created ${count} transactions for ${month}/${year}`);
    };

    // Seed Jan, Feb, Mar 2026
    await createTx(1, 2026, 15);
    await createTx(2, 2026, 15);
    await createTx(3, 2026, 15);

    console.log('🎉 Transaction seeding complete!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
