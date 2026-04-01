export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  tags: string[];
  rating: number;
  reviews: number;
  image: string;
  organic: boolean;
  active: boolean;
}

export const categories = ["Todos", "Detox", "Vitaminas", "Proteínas", "Naturales", "Colágeno"];

export const products: Product[] = [
  {
    id: "1",
    name: "Detox Green Supreme",
    description: "Fórmula avanzada de limpieza natural con espirulina, chlorella y moringa. Elimina toxinas y revitaliza tu cuerpo desde adentro. Ideal para iniciar tu día con energía renovada.\n\n**Beneficios:**\n- Limpieza profunda del organismo\n- Mejora la digestión\n- Aumenta niveles de energía\n- Rico en antioxidantes",
    price: 89.90,
    stock: 45,
    category: "Detox",
    tags: ["detox", "green", "limpieza"],
    rating: 4.8,
    reviews: 124,
    image: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=400&fit=crop",
    organic: true,
    active: true,
  },
  {
    id: "2",
    name: "Vitamina C + Zinc Orgánico",
    description: "Complejo vitamínico natural extraído de acerola y guayaba. Fortalece tu sistema inmunológico de forma natural y efectiva.",
    price: 59.90,
    stock: 120,
    category: "Vitaminas",
    tags: ["vitaminas", "inmunidad", "natural"],
    rating: 4.6,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
    organic: true,
    active: true,
  },
  {
    id: "3",
    name: "Proteína Vegetal Premium",
    description: "Mezcla de proteínas de guisante, arroz y cáñamo. 25g de proteína por porción. Sabor vainilla natural sin azúcar añadida.",
    price: 129.90,
    stock: 8,
    category: "Proteínas",
    tags: ["proteína", "vegetal", "fitness"],
    rating: 4.9,
    reviews: 203,
    image: "https://images.unsplash.com/photo-1593095948071-474c5cc2c4d8?w=400&h=400&fit=crop",
    organic: true,
    active: true,
  },
  {
    id: "4",
    name: "Colágeno Marino Hidrolizado",
    description: "Colágeno tipo I y III de origen marino. Mejora la elasticidad de la piel, fortalece articulaciones y cabello.",
    price: 109.90,
    stock: 32,
    category: "Colágeno",
    tags: ["colágeno", "piel", "belleza"],
    rating: 4.7,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop",
    organic: false,
    active: true,
  },
  {
    id: "5",
    name: "Té Detox Nocturno",
    description: "Infusión relajante con manzanilla, lavanda y extracto de cúrcuma. Ayuda a la desintoxicación mientras duermes.",
    price: 45.90,
    stock: 67,
    category: "Detox",
    tags: ["té", "detox", "relajante"],
    rating: 4.5,
    reviews: 78,
    image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop",
    organic: true,
    active: true,
  },
  {
    id: "6",
    name: "Multivitamínico Natural",
    description: "22 vitaminas y minerales de fuentes naturales. Una cápsula diaria para cubrir tus necesidades nutricionales.",
    price: 79.90,
    stock: 54,
    category: "Vitaminas",
    tags: ["multivitamínico", "diario", "salud"],
    rating: 4.4,
    reviews: 112,
    image: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&h=400&fit=crop",
    organic: true,
    active: true,
  },
  {
    id: "7",
    name: "Aceite de Coco Virgen Extra",
    description: "Aceite de coco prensado en frío, 100% orgánico. Para cocinar, cuidado de piel y cabello.",
    price: 39.90,
    stock: 200,
    category: "Naturales",
    tags: ["aceite", "coco", "multiuso"],
    rating: 4.3,
    reviews: 67,
    image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop",
    organic: true,
    active: true,
  },
  {
    id: "8",
    name: "Colágeno + Biotina Beauty",
    description: "Fórmula de belleza integral con colágeno, biotina, ácido hialurónico y vitamina E. Piel radiante desde adentro.",
    price: 139.90,
    stock: 5,
    category: "Colágeno",
    tags: ["belleza", "colágeno", "biotina"],
    rating: 4.8,
    reviews: 189,
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop",
    organic: false,
    active: true,
  },
];
