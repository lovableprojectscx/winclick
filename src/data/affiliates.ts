export type PackageType = "Básico" | "Ejecutivo" | "Intermedio" | "VIP";

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  code: string;
  package: PackageType;
  sales: number;
  commissions: number;
  referrals: number;
  yape: string;
  active: boolean;
  joinDate: string;
  storeName: string;
  storeTagline: string;
  storeColor: string;
  storeEmoji: string;
  storeWhatsapp: string;
  storeActive: boolean;
  featuredProducts: string[];
  reactivationActive: boolean;
  accountStatus: "active" | "suspended" | "pending";
}

export const packages = [
  {
    name: "Básico" as const,
    investment: 120,
    depthUnlocked: 3,
    reactivation: 300,
    reactivationProducts: 3,
    description: "Ideal para empezar. Accede a los 3 primeros niveles de comisión.",
  },
  {
    name: "Ejecutivo" as const,
    investment: 600,
    depthUnlocked: 5,
    reactivation: 300,
    reactivationProducts: 3,
    description: "Crecimiento rápido. Desbloquea 5 niveles de profundidad.",
  },
  {
    name: "Intermedio" as const,
    investment: 2000,
    depthUnlocked: 7,
    reactivation: 300,
    reactivationProducts: 3,
    description: "Para socios serios. Desbloquea 7 niveles de profundidad.",
  },
  {
    name: "VIP" as const,
    investment: 10000,
    depthUnlocked: 10,
    reactivation: 300,
    reactivationProducts: 3,
    description: "Máximo potencial. Todos los niveles desbloqueados.",
  },
];

export const commissionLevels = [
  { level: 1, percentage: 10, label: "Tus referidos directos" },
  { level: 2, percentage: 4, label: "Nivel 2" },
  { level: 3, percentage: 2, label: "Nivel 3" },
  { level: 4, percentage: 2, label: "Nivel 4" },
  { level: 5, percentage: 1, label: "Nivel 5" },
  { level: 6, percentage: 1, label: "Nivel 6" },
  { level: 7, percentage: 1, label: "Nivel 7" },
  { level: 8, percentage: 3, label: "Nivel 8" },
  { level: 9, percentage: 0.5, label: "Nivel 9" },
  { level: 10, percentage: 0.5, label: "Nivel 10 (Bono liderazgo)" },
];

export const mockAffiliates: Affiliate[] = [
  {
    id: "1",
    name: "María García López",
    email: "maria@email.com",
    code: "WIN-MAR001",
    package: "VIP",
    sales: 4500,
    commissions: 675,
    referrals: 12,
    yape: "987654321",
    active: true,
    accountStatus: "active",
    joinDate: "2025-01-15",
    storeName: "Natural Life María",
    storeTagline: "Tu bienestar es mi misión",
    storeColor: "#2ECC71",
    storeEmoji: "🌿",
    storeWhatsapp: "987654321",
    storeActive: true,
    featuredProducts: ["1", "3", "4"],
    reactivationActive: true,
  },
  {
    id: "2",
    name: "Carlos Mendoza",
    email: "carlos@email.com",
    code: "WIN-CAR002",
    package: "Intermedio",
    sales: 2100,
    commissions: 315,
    referrals: 6,
    yape: "912345678",
    active: true,
    accountStatus: "active",
    joinDate: "2025-03-20",
    storeName: "Orgánico Carlos",
    storeTagline: "Salud natural para todos",
    storeColor: "#F2C94C",
    storeEmoji: "💪",
    storeWhatsapp: "912345678",
    storeActive: true,
    featuredProducts: ["1", "2", "5"],
    reactivationActive: true,
  },
  {
    id: "3",
    name: "Ana Torres Ruiz",
    email: "ana@email.com",
    code: "WIN-ANA003",
    package: "Básico",
    sales: 350,
    commissions: 52.5,
    referrals: 2,
    yape: "956789012",
    active: false,
    accountStatus: "suspended",
    joinDate: "2025-06-10",
    storeName: "Ana Orgánica",
    storeTagline: "Natura para ti",
    storeColor: "#2ECC71",
    storeEmoji: "🌱",
    storeWhatsapp: "956789012",
    storeActive: false,
    featuredProducts: ["2", "6"],
    reactivationActive: false,
  },
  {
    id: "4",
    name: "Jorge Ramírez",
    email: "jorge@email.com",
    code: "WIN-JOR011",
    package: "Básico",
    sales: 0,
    commissions: 0,
    referrals: 0,
    yape: "934567890",
    active: false,
    accountStatus: "pending",
    joinDate: "2026-03-28",
    storeName: "Jorge Natural",
    storeTagline: "",
    storeColor: "#F2C94C",
    storeEmoji: "🌿",
    storeWhatsapp: "934567890",
    storeActive: false,
    featuredProducts: [],
    reactivationActive: false,
  },
];

export const mockReferralTree = {
  id: "1",
  name: "María García",
  code: "WIN-MAR001",
  package: "VIP",
  sales: 4500,
  level: 0,
  active: true,
  children: [
    {
      id: "2",
      name: "Carlos Mendoza",
      code: "WIN-CAR002",
      package: "Intermedio",
      sales: 2100,
      level: 1,
      active: true,
      children: [
        { id: "4", name: "Pedro Sánchez", code: "WIN-PED004", package: "Básico", sales: 200, level: 2, active: true, children: [] },
      ],
    },
    {
      id: "3",
      name: "Ana Torres",
      code: "WIN-ANA003",
      package: "Básico",
      sales: 350,
      level: 1,
      active: false,
      children: [],
    },
    {
      id: "5",
      name: "Luis Vargas",
      code: "WIN-LUI005",
      package: "Intermedio",
      sales: 600,
      level: 1,
      active: true,
      children: [
        { id: "6", name: "Rosa Medina", code: "WIN-ROS006", package: "Básico", sales: 100, level: 2, active: true, children: [] },
        { id: "7", name: "Jorge Díaz", code: "WIN-JOR007", package: "Básico", sales: 50, level: 2, active: false, children: [] },
      ],
    },
  ],
};
