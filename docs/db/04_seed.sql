-- =============================================================================
-- WINCLICK — Datos semilla (seed)
-- Motor: PostgreSQL (Supabase)
-- Archivo: 04_seed.sql
-- Ejecutar después de 03_rls.sql
-- Contiene datos iniciales del sistema + datos de prueba para desarrollo.
-- =============================================================================


-- =============================================================================
-- PAQUETES
-- =============================================================================

INSERT INTO packages (name, investment_amount, depth_unlocked, reactivation_amount, description) VALUES
  ('Básico',     100.00,   3,  300.00, 'Ideal para empezar. Accede a los 3 primeros niveles de comisión.'),
  ('Intermedio', 2000.00,  7,  300.00, 'Para socios serios. Desbloquea 7 niveles de profundidad.'),
  ('VIP',        10000.00, 10, 300.00, 'Máximo potencial. Todos los niveles desbloqueados.');


-- =============================================================================
-- NIVELES DE COMISIÓN
-- Nivel 8 tiene spike 3% (argumento de venta VIP)
-- requires_package indica qué paquetes tienen acceso a cada nivel
-- =============================================================================

INSERT INTO commission_levels (level, percentage, label, requires_package) VALUES
  (1,  10.0, 'Tus referidos directos',    ARRAY['Básico','Intermedio','VIP']::package_type[]),
  (2,   4.0, 'Nivel 2',                   ARRAY['Básico','Intermedio','VIP']::package_type[]),
  (3,   2.0, 'Nivel 3',                   ARRAY['Básico','Intermedio','VIP']::package_type[]),
  (4,   2.0, 'Nivel 4',                   ARRAY['Intermedio','VIP']::package_type[]),
  (5,   1.0, 'Nivel 5',                   ARRAY['Intermedio','VIP']::package_type[]),
  (6,   1.0, 'Nivel 6',                   ARRAY['Intermedio','VIP']::package_type[]),
  (7,   1.0, 'Nivel 7',                   ARRAY['Intermedio','VIP']::package_type[]),
  (8,   3.0, 'Nivel 8',                   ARRAY['VIP']::package_type[]),
  (9,   0.5, 'Nivel 9',                   ARRAY['VIP']::package_type[]),
  (10,  0.5, 'Nivel 10 (Bono liderazgo)', ARRAY['VIP']::package_type[]);


-- =============================================================================
-- CONFIGURACIÓN DEL SISTEMA
-- =============================================================================

INSERT INTO system_config (key, value, description) VALUES
  ('min_withdrawal',    '20',                          'Monto mínimo de retiro en soles'),
  ('withdrawal_days',   '3',                           'Días hábiles para procesar retiros'),
  ('reactivation_fee',  '300',                         'Costo de reactivación mensual en soles'),
  ('company_yape',      '"985000000"',                 'Número Yape de la empresa para pagos'),
  ('company_bcp',       '"191-12345678-0-01"',         'Cuenta BCP de la empresa'),
  ('company_name',      '"Winclick S.A.C."',      'Razón social'),
  ('company_ruc',       '"20XXXXXXXXX"',               'RUC de la empresa'),
  ('commission_active', 'true',                        'Flag global para habilitar/deshabilitar comisiones');


-- =============================================================================
-- PRODUCTOS (mirror del mock)
-- =============================================================================

INSERT INTO products (id, name, description, price, stock, category, tags, rating, reviews_count, image_url, organic, active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Detox Green Supreme',
   'Fórmula avanzada de limpieza natural con espirulina, chlorella y moringa.',
   89.90, 45, 'Detox', ARRAY['detox','green','limpieza'], 4.8, 124,
   'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600&h=600&fit=crop&crop=entropy&auto=format&q=82', TRUE, TRUE),

  ('00000000-0000-0000-0000-000000000002', 'Vitamina C + Zinc Orgánico',
   'Complejo vitamínico natural extraído de acerola y guayaba.',
   59.90, 120, 'Vitaminas', ARRAY['vitaminas','inmunidad','natural'], 4.6, 89,
   'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=600&fit=crop&crop=entropy&auto=format&q=82', TRUE, TRUE),

  ('00000000-0000-0000-0000-000000000003', 'Proteína Vegetal Premium',
   'Mezcla de proteínas de guisante, arroz y cáñamo. 25g de proteína por porción.',
   129.90, 8, 'Proteínas', ARRAY['proteína','vegetal','fitness'], 4.9, 203,
   'https://images.unsplash.com/photo-1579722820309-ad7660e21001?w=600&h=600&fit=crop&crop=entropy&auto=format&q=82', TRUE, TRUE),

  ('00000000-0000-0000-0000-000000000004', 'Colágeno Marino Hidrolizado',
   'Colágeno tipo I y III de origen marino. Mejora la elasticidad de la piel.',
   109.90, 32, 'Colágeno', ARRAY['colágeno','piel','belleza'], 4.7, 156,
   'https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600&h=600&fit=crop&crop=entropy&auto=format&q=82', FALSE, TRUE),

  ('00000000-0000-0000-0000-000000000005', 'Té Detox Nocturno',
   'Infusión relajante con manzanilla, lavanda y extracto de cúrcuma.',
   45.90, 67, 'Detox', ARRAY['té','detox','relajante'], 4.5, 78,
   'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=600&h=600&fit=crop&crop=entropy&auto=format&q=82', TRUE, TRUE),

  ('00000000-0000-0000-0000-000000000006', 'Multivitamínico Natural',
   '22 vitaminas y minerales de fuentes naturales.',
   79.90, 54, 'Vitaminas', ARRAY['multivitamínico','diario','salud'], 4.4, 112,
   'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=600&h=600&fit=crop&crop=entropy&auto=format&q=82', TRUE, TRUE),

  ('00000000-0000-0000-0000-000000000007', 'Aceite de Coco Virgen Extra',
   'Aceite de coco prensado en frío, 100% orgánico.',
   39.90, 200, 'Naturales', ARRAY['aceite','coco','multiuso'], 4.3, 67,
   'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&h=600&fit=crop&crop=entropy&auto=format&q=82', TRUE, TRUE),

  ('00000000-0000-0000-0000-000000000008', 'Colágeno + Biotina Beauty',
   'Fórmula de belleza integral con colágeno, biotina, ácido hialurónico y vitamina E.',
   139.90, 5, 'Colágeno', ARRAY['belleza','colágeno','biotina'], 4.8, 189,
   'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=600&fit=crop&crop=entropy&auto=format&q=82', FALSE, TRUE);


-- =============================================================================
-- NOTA: Los usuarios de prueba (afiliados) se crean a través de auth.users
-- de Supabase y se propagan a profiles vía trigger. No se insertan aquí
-- directamente en producción.
--
-- Para desarrollo local, usar el script 05_dev_seed.sql que inserta
-- usuarios de prueba con UUIDs fijos sin pasar por auth.
-- =============================================================================
