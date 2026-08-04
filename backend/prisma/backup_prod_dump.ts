import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const prisma = new PrismaClient();
  try {
    const tables: { table_name: string }[] = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name != '_prisma_migrations'
    `;

    const dumpData: Record<string, any[]> = {};

    for (const t of tables) {
      const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."${t.table_name}"`);
      console.log(`Exported ${rows.length} rows from table ${t.table_name}`);
      dumpData[t.table_name] = rows;
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpPath = path.join(__dirname, `backup_before_wipe_${stamp}.json`);
    fs.writeFileSync(
      dumpPath,
      JSON.stringify(dumpData, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2),
      'utf-8',
    );

    console.log(`\nSUCCESS: Exported ${Object.keys(dumpData).length} tables to ${dumpPath}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
