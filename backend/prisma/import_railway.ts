import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

async function restore() {
  const targetUrl = process.env.RAILWAY_PUBLIC_DATABASE_URL || process.env.DATABASE_URL;

  if (!targetUrl || targetUrl.includes('${{')) {
    console.error('ERROR: Debes proporcionar la URL pública de Railway en process.env.RAILWAY_PUBLIC_DATABASE_URL o DATABASE_URL');
    process.exit(1);
  }

  console.log('Connecting to Railway DB...');
  const prisma = new PrismaClient({
    datasources: { db: { url: targetUrl } }
  });

  const dumpPath = path.join(__dirname, 'neon_dump.json');
  if (!fs.existsSync(dumpPath)) {
    console.error(`ERROR: No se encontró el archivo de dump en ${dumpPath}`);
    process.exit(1);
  }

  const dumpData: Record<string, any[]> = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));
  console.log(`Loaded backup with ${Object.keys(dumpData).length} tables.`);

  try {
    // Disable triggers / constraints during import
    console.log('Disabling FK constraints...');
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);

    for (const [tableName, rows] of Object.entries(dumpData)) {
      if (!rows || rows.length === 0) continue;
      console.log(`Importing ${rows.length} rows into table "${tableName}"...`);

      // Clear existing rows in target table
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tableName}" CASCADE;`);

      const columns = Object.keys(rows[0]);
      const colNames = columns.map(c => `"${c}"`).join(', ');

      for (const row of rows) {
        const values = columns.map(c => {
          const val = row[c];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          if (typeof val === 'number') return val;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          return `'${String(val).replace(/'/g, "''")}'`;
        }).join(', ');

        const sql = `INSERT INTO "public"."${tableName}" (${colNames}) VALUES (${values})`;
        await prisma.$executeRawUnsafe(sql);
      }
    }

    // Re-enable triggers / constraints
    console.log('Re-enabling FK constraints...');
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`);

    console.log('\nSUCCESS: Database successfully restored into Railway PostgreSQL!');
  } catch (err) {
    console.error('Error restoring data to Railway:', err);
  } finally {
    await prisma.$disconnect();
  }
}

restore();
