import { PrismaClient } from '@prisma/client';
import { AlertsService } from './modules/alerts/alerts.service';
import { PrismaService } from './prisma/prisma.service';
import { SystemConfigService } from './modules/system-config/system-config.service';

async function testGlobalRules() {
  const prisma = new PrismaService();
  const alertsService = new AlertsService(prisma, new SystemConfigService(prisma));

  console.log('🔍 Ejecutando evaluación de reglas globales de alertas...');
  await alertsService.evaluarReglasGlobales();

  const stats = await alertsService.getAlertStats();
  const activeAlerts = await alertsService.getActiveAlerts({});

  console.log('📊 RESULTADOS DE EVALUACIÓN DE ALERTAS MULTIMÓDULO:');
  console.log('----------------------------------------------------');
  console.log(`• Total Alertas Activas: ${stats.active}`);
  console.log(`• Emergencias Críticas: ${stats.emergencias}`);
  console.log(`• Riesgo Alto / Críticas: ${stats.criticas}`);
  console.log(`• Advertencias Preventivas: ${stats.advertencias}`);
  console.log('----------------------------------------------------');
  console.log('Top 10 Alertas Generadas:');
  activeAlerts.slice(0, 10).forEach((a, i) => {
    console.log(`[${i + 1}] (${a.severidad}) [${a.categoria}] ${a.titulo} -> ${a.mensaje}`);
  });

  await prisma.$disconnect();
}

testGlobalRules().catch((e) => {
  console.error('❌ Error testing rules:', e);
  process.exit(1);
});
