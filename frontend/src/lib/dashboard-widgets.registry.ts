export interface WidgetCatalogItem {
  type: string;
  title: string;
  description: string;
  category: 'kpi' | 'chart' | 'list' | 'quick_action';
  defaultWidth: '1col' | '2col' | 'full';
  icon: string;
}

export interface UserWidgetItem {
  id: string;
  widgetType: string;
  width: '1col' | '2col' | 'full';
  order: number;
  visible: boolean;
}

export const WIDGET_CATALOG: Record<string, WidgetCatalogItem> = {
  'kpi-fleet': {
    type: 'kpi-fleet',
    title: 'Resumen de Flota',
    description: 'Vehículos totales, disponibles, en viaje y en taller',
    category: 'kpi',
    defaultWidth: '1col',
    icon: 'Truck',
  },
  'kpi-trips': {
    type: 'kpi-trips',
    title: 'Viajes Activos & Pendientes',
    description: 'Estado de viajes en curso y programados',
    category: 'kpi',
    defaultWidth: '1col',
    icon: 'MapPin',
  },
  'kpi-revenue': {
    type: 'kpi-revenue',
    title: 'Facturación & Margen Bruto',
    description: 'Ingresos del mes y porcentaje de margen',
    category: 'kpi',
    defaultWidth: '1col',
    icon: 'DollarSign',
  },
  'kpi-alerts': {
    type: 'kpi-alerts',
    title: 'Alertas Totales ERP',
    description: 'Vencimientos de documentos, OTs y licencias',
    category: 'kpi',
    defaultWidth: '1col',
    icon: 'AlertTriangle',
  },
  'kpi-drivers': {
    type: 'kpi-drivers',
    title: 'Gestión de Conductores',
    description: 'Conductores activos y estado de jornadas',
    category: 'kpi',
    defaultWidth: '1col',
    icon: 'Users',
  },
  'kpi-tires': {
    type: 'kpi-tires',
    title: 'Gestión de Neumáticos',
    description: 'Neumáticos activos, desgaste crítico <3mm y CPK',
    category: 'kpi',
    defaultWidth: '1col',
    icon: 'CircleDot',
  },
  'kpi-fuel': {
    type: 'kpi-fuel',
    title: 'Consumo de Combustible',
    description: 'Litros totales consumidos y rendimiento km/l',
    category: 'kpi',
    defaultWidth: '1col',
    icon: 'Fuel',
  },
  'kpi-maintenance': {
    type: 'kpi-maintenance',
    title: 'Salud de Mantenimiento',
    description: 'Vehículos en taller y órdenes de trabajo pendientes',
    category: 'kpi',
    defaultWidth: '1col',
    icon: 'Wrench',
  },
  'chart-monthly-revenue': {
    type: 'chart-monthly-revenue',
    title: 'Gráfico: Facturación Mensual vs Costos',
    description: 'Evolución temporal de ingresos y costos operativos',
    category: 'chart',
    defaultWidth: '2col',
    icon: 'TrendingUp',
  },
  'chart-fuel-consumption': {
    type: 'chart-fuel-consumption',
    title: 'Gráfico: Consumo Diésel por Vehículo',
    description: 'Rendimiento en L/100km y costo total por unidad',
    category: 'chart',
    defaultWidth: '2col',
    icon: 'BarChart3',
  },
  'chart-trip-distribution': {
    type: 'chart-trip-distribution',
    title: 'Gráfico: Distribución de Viajes por Estado',
    description: 'Gráfico circular de viajes en curso, completados y demorados',
    category: 'chart',
    defaultWidth: '2col',
    icon: 'PieChart',
  },
  'list-recent-trips': {
    type: 'list-recent-trips',
    title: 'Lista: Viajes Recientes',
    description: 'Últimas operaciones con origen, destino y estado en tiempo real',
    category: 'list',
    defaultWidth: '2col',
    icon: 'List',
  },
  'list-expiring-alerts': {
    type: 'list-expiring-alerts',
    title: 'Lista: Vencimientos & Documentación',
    description: 'Próximos vencimientos de VTV, seguros y licencias',
    category: 'list',
    defaultWidth: '2col',
    icon: 'ShieldAlert',
  },
  'list-critical-tires': {
    type: 'list-critical-tires',
    title: 'Lista: Neumáticos con Desgaste Crítico',
    description: 'Neumáticos que requieren reemplazo urgente (<3.0 mm)',
    category: 'list',
    defaultWidth: '2col',
    icon: 'AlertCircle',
  },
  'list-driver-schedules': {
    type: 'list-driver-schedules',
    title: 'Lista: Jornadas de Choferes',
    description: 'Choferes próximos a descanso o excedidos en ruta',
    category: 'list',
    defaultWidth: '2col',
    icon: 'Clock',
  },
  'quick-reports': {
    type: 'quick-reports',
    title: 'Accesos Rápidos a Reportes & Operaciones',
    description: 'Botones directos para exportar Excel, crear viajes y generar OTs',
    category: 'quick_action',
    defaultWidth: 'full',
    icon: 'Zap',
  },
};

export const DEFAULT_DASHBOARD_LAYOUT: UserWidgetItem[] = [
  { id: 'w1', widgetType: 'kpi-fleet', width: '1col', order: 1, visible: true },
  { id: 'w2', widgetType: 'kpi-trips', width: '1col', order: 2, visible: true },
  { id: 'w3', widgetType: 'kpi-revenue', width: '1col', order: 3, visible: true },
  { id: 'w4', widgetType: 'kpi-alerts', width: '1col', order: 4, visible: true },
  { id: 'w5', widgetType: 'kpi-drivers', width: '1col', order: 5, visible: true },
  { id: 'w6', widgetType: 'kpi-tires', width: '1col', order: 6, visible: true },
  { id: 'w7', widgetType: 'kpi-fuel', width: '1col', order: 7, visible: true },
  { id: 'w8', widgetType: 'kpi-maintenance', width: '1col', order: 8, visible: true },
  { id: 'w9', widgetType: 'chart-monthly-revenue', width: '2col', order: 9, visible: true },
  { id: 'w10', widgetType: 'chart-trip-distribution', width: '2col', order: 10, visible: true },
  { id: 'w11', widgetType: 'chart-fuel-consumption', width: '2col', order: 11, visible: true },
  { id: 'w12', widgetType: 'list-recent-trips', width: '2col', order: 12, visible: true },
  { id: 'w13', widgetType: 'list-expiring-alerts', width: '2col', order: 13, visible: true },
  { id: 'w14', widgetType: 'list-critical-tires', width: '2col', order: 14, visible: true },
  { id: 'w15', widgetType: 'list-driver-schedules', width: '2col', order: 15, visible: true },
  { id: 'w16', widgetType: 'quick-reports', width: 'full', order: 16, visible: true },
];
