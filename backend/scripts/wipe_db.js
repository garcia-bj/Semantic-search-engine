const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function wipe() {
    try {
        const deleted = await prisma.document.deleteMany({});
        console.log(`Deleted ${deleted.count} documents from PostgreSQL`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

wipe();
