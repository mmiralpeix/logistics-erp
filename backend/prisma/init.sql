-- Inicialización de la base de datos LogisticsPro ERP
-- Este script se ejecuta automáticamente al crear el contenedor PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configuración de zona horaria para Argentina
SET timezone = 'America/Argentina/Buenos_Aires';
