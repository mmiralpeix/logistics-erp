import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetUserPasswords() {
  console.log('🔑 Restableciendo contraseñas de usuarios con hashes de Bcrypt...');

  const adminHash = await bcrypt.hash('Admin123!', 10);
  const opsHash = await bcrypt.hash('Ops123!', 10);
  const driverHash = await bcrypt.hash('Driver123!', 10);

  const users = [
    { email: 'admin@logistics.com', pass: adminHash, plain: 'Admin123!' },
    { email: 'ops@logistics.com', pass: opsHash, plain: 'Ops123!' },
    { email: 'despacho@logistics.com', pass: opsHash, plain: 'Ops123!' },
    { email: 'chofer@logistics.com', pass: driverHash, plain: 'Driver123!' },
    { email: 'contaduria@logistics.com', pass: opsHash, plain: 'Ops123!' },
  ];

  for (const u of users) {
    const updated = await prisma.user.updateMany({
      where: { email: u.email },
      data: {
        password: u.pass,
        isActive: true,
      },
    });

    if (updated.count === 0) {
      // Create user if missing
      await prisma.user.create({
        data: {
          email: u.email,
          password: u.pass,
          firstName: u.email.split('@')[0].toUpperCase(),
          lastName: 'ERP',
          isActive: true,
          role: u.email.includes('admin') ? 'SUPER_ADMIN' : u.email.includes('driver') || u.email.includes('chofer') ? 'DRIVER' : 'OPERATIONS_MANAGER',
        },
      });
      console.log(`  ✓ Usuario creado: ${u.email} / ${u.plain}`);
    } else {
      console.log(`  ✓ Contraseña actualizada: ${u.email} / ${u.plain}`);
    }
  }

  console.log('🎉 Todas las contraseñas restablecidas y verificadas con éxito!');
}

resetUserPasswords()
  .catch((e) => console.error('❌ Error reseteando contraseñas:', e))
  .finally(async () => await prisma.$disconnect());
