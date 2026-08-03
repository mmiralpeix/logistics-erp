const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function restore() {
  const targetUrl = process.env.DATABASE_URL;

  if (!targetUrl || targetUrl.includes('${{')) {
    console.error('ERROR: DATABASE_URL no es válida o no está definida.');
    process.exit(1);
  }

  const sanitizedUrl = targetUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`[Railway Migration] Conectando a Railway PostgreSQL: ${sanitizedUrl}`);
  
  const prisma = new PrismaClient({
    datasources: { db: { url: targetUrl } }
  });

  const dumpPath = path.join(__dirname, 'neon_dump.json');
  if (!fs.existsSync(dumpPath)) {
    console.error(`[Railway Migration] ERROR: No se encontró el archivo de dump en ${dumpPath}`);
    process.exit(1);
  }

  const dumpData = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));
  const tableCount = Object.keys(dumpData).length;
  console.log(`[Railway Migration] Archivo de backup cargado. Total de tablas a importar: ${tableCount}`);

  try {
    console.log('[Railway Migration] Desactivando restricciones de claves foráneas...');
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);

    for (const [tableName, rows] of Object.entries(dumpData)) {
      if (!rows || rows.length === 0) {
        console.log(`[Railway Migration] Tabla "${tableName}" sin registros. Omitiendo.`);
        continue;
      }

      const count = await prisma[tableName] ? await prisma[tableName].count() : 0;
      if (count > 0) {
        console.log(`[Railway Migration] Tabla "${tableName}" ya tiene ${count} registros. Preservando datos existentes.`);
        continue;
      }

      console.log(`[Railway Migration] Importando ${rows.length} registros en la tabla "${tableName}"...`);

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

    console.log('[Railway Migration] Re-activando restricciones de claves foráneas...');
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`);

    console.log('[Railway Migration] Creado/Restableciendo usuarios por defecto...');
    const bcrypt = require('bcryptjs');
    const adminPass = await bcrypt.hash('Admin123!', 10);
    const opsPass = await bcrypt.hash('Ops123!', 10);
    const driverPass = await bcrypt.hash('Driver123!', 10);

    const users = [
      { email: 'admin@logistics.com', pass: adminPass, name: 'Carlos', surname: 'Rodríguez', role: 'SUPER_ADMIN' },
      { email: 'ops@logistics.com', pass: opsPass, name: 'María', surname: 'González', role: 'OPERATIONS_MANAGER' },
      { email: 'despacho@logistics.com', pass: opsPass, name: 'Roberto', surname: 'López', role: 'DISPATCHER' },
      { email: 'chofer@logistics.com', pass: driverPass, name: 'Juan', surname: 'Martínez', role: 'DRIVER' },
      { email: 'contaduria@logistics.com', pass: opsPass, name: 'Laura', surname: 'Sánchez', role: 'ACCOUNTANT' },
    ];

    for (const u of users) {
      const sql = `
        INSERT INTO "public"."users" ("id", "email", "password", "firstName", "lastName", "role", "isActive", "mfaEnabled", "createdAt", "updatedAt")
        VALUES ('usr_${u.email.split('@')[0]}', '${u.email}', '${u.pass}', '${u.name}', '${u.surname}', '${u.role}', TRUE, FALSE, NOW(), NOW())
        ON CONFLICT ("email") DO UPDATE SET "password" = EXCLUDED."password", "isActive" = TRUE;
      `;
      await prisma.$executeRawUnsafe(sql);
    }
    console.log('[Railway Migration] ✅ Usuarios demo (admin@logistics.com / Admin123!) listos para inicio de sesión.');

    console.log('\n======================================================');
    console.log('🎉 [Railway Migration] ¡ÉXITO! Todos los datos han sido importados a Railway PostgreSQL.');
    console.log('======================================================\n');
  } catch (err) {
    console.error('[Railway Migration] ERROR durante la importación:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

restore();
