import { PrismaClient } from '@prisma/client';
import { runMasterSeed } from '../src/prisma/master-seed';

const prisma = new PrismaClient();

async function main() {
  await runMasterSeed(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
