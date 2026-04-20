-- Seed productos orgánicos WinClick
INSERT INTO products (name, description, price, partner_price, public_price, stock, image_url, organic, is_active, tags, rating, reviews_count)
VALUES
(
  'Maca Andina Premium',
  'Maca negra y amarilla cultivada a 4,200 msnm en Junín. Rica en hierro, calcio y aminoácidos esenciales. Ideal para energía, rendimiento físico y equilibrio hormonal natural.',
  89.90, 67.00, 105.00, 120,
  'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=600',
  true, true,
  ARRAY['energía','adaptógeno','superalimento'],
  4.8, 124
),
(
  'Camu Camu Antioxidante',
  'Fruto amazónico con el mayor contenido natural de vitamina C en el mundo. 60 cápsulas de 500 mg. Potencia tu sistema inmune y combate el envejecimiento celular.',
  75.00, 56.00, 89.00, 85,
  'https://images.unsplash.com/photo-1607469256872-f7e3eb15c22a?w=600',
  true, true,
  ARRAY['vitamina C','inmunidad','antioxidante'],
  4.9, 98
),
(
  'Aceite de Sacha Inchi',
  'Prensado en frío de semillas de sacha inchi peruano. Alto en Omega 3, 6 y 9. Sin refinar, sin aditivos. Ideal para ensaladas, piel y cabello.',
  65.00, 49.00, 78.00, 60,
  'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600',
  true, true,
  ARRAY['omega 3','piel','cabello'],
  4.7, 76
),
(
  'Spirulina Pura en Polvo',
  'Microalga cultivada en agua dulce sin contaminantes. 200 g de proteína completa 65%, hierro biodisponible y clorofila. Mezcla perfecta con jugos y batidos.',
  59.90, 45.00, 72.00, 95,
  'https://images.unsplash.com/photo-1622484211823-3d42fdb15bc4?w=600',
  true, true,
  ARRAY['proteína','detox','alga'],
  4.6, 112
),
(
  'Cúrcuma + Pimienta Negra',
  'Curcumina de alta biodisponibilidad combinada con piperina de pimienta negra. Potente antiinflamatorio y antioxidante natural. 60 cápsulas vegetales de 700 mg.',
  52.00, 39.00, 62.00, 110,
  'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600',
  true, true,
  ARRAY['antiinflamatorio','articulaciones','digestión'],
  4.8, 89
),
(
  'Quinoa Orgánica Tricolor',
  'Quinoa roja, blanca y negra de Puno certificada orgánica. 1 kg. Proteína completa con los 9 aminoácidos esenciales. Sin gluten, baja en calorías.',
  42.00, 31.50, 50.00, 150,
  'https://images.unsplash.com/photo-1614477081692-1c3efb7a7b96?w=600',
  true, true,
  ARRAY['proteína','sin gluten','granos'],
  4.7, 145
),
(
  'Jengibre en Polvo Premium',
  'Rizoma de jengibre deshidratado y molido a baja temperatura para preservar gingeroles activos. 150 g. Antiinflamatorio, digestivo y termogénico natural.',
  38.00, 28.50, 45.00, 130,
  'https://images.unsplash.com/photo-1615485008537-7bdeb46ef39e?w=600',
  true, true,
  ARRAY['digestivo','termogénico','especias'],
  4.5, 67
),
(
  'Aceite de Coco Orgánico Extra Virgen',
  'Prensado en frío de coco fresco. Sin refinar, sin blanquear, sin desodorizar. 500 ml. Ideal para cocinar a alta temperatura, piel, cabello y aceite de tirón.',
  48.00, 36.00, 57.00, 75,
  'https://images.unsplash.com/photo-1580776108298-f06e92c4d7de?w=600',
  true, true,
  ARRAY['coco','cocina','piel'],
  4.9, 203
);
