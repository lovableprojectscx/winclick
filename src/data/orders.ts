export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  clientEmail: string;
  total: number;
  paymentMethod: "wallet" | "cash";
  status: "pendiente" | "procesando" | "enviado" | "entregado" | "cancelado";
  items: { productId: string; name: string; quantity: number; price: number }[];
  affiliateCode?: string;
  date: string;
  receiptUrl?: string;
  shippingAddress?: string;
  phone?: string;
  dni?: string;
  trackingNumber?: string;
  notes?: string;
}

export interface Commission {
  id: string;
  orderId: string;
  productName: string;
  amount: number;
  level: number;
  status: "pendiente" | "pagada" | "rechazada";
  date: string;
}

export interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
  status: "completada" | "pendiente";
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  method: string;
  accountNumber: string;
  status: "pendiente" | "aprobado" | "rechazado";
  date: string;
}

export const mockOrders: Order[] = [
  {
    id: "1", orderNumber: "WO-0001", clientName: "Juan Pérez", clientEmail: "juan@email.com",
    total: 179.80, paymentMethod: "cash", status: "entregado",
    items: [{ productId: "1", name: "Detox Green Supreme", quantity: 2, price: 89.90 }],
    affiliateCode: "WIN-MAR001", date: "2026-03-25", shippingAddress: "Av. Lima 123, Miraflores",
    phone: "987654321", dni: "12345678",
  },
  {
    id: "2", orderNumber: "WO-0002", clientName: "Laura Ríos", clientEmail: "laura@email.com",
    total: 129.90, paymentMethod: "wallet", status: "procesando",
    items: [{ productId: "3", name: "Proteína Vegetal Premium", quantity: 1, price: 129.90 }],
    date: "2026-03-26",
  },
  {
    id: "3", orderNumber: "WO-0003", clientName: "Roberto Díaz", clientEmail: "roberto@email.com",
    total: 249.70, paymentMethod: "cash", status: "pendiente",
    items: [
      { productId: "4", name: "Colágeno Marino Hidrolizado", quantity: 1, price: 109.90 },
      { productId: "8", name: "Colágeno + Biotina Beauty", quantity: 1, price: 139.90 },
    ],
    affiliateCode: "WIN-CAR002", date: "2026-03-27", receiptUrl: "https://placehold.co/400x600",
  },
];

export const mockCommissions: Commission[] = [
  { id: "1", orderId: "WO-0001", productName: "Detox Green Supreme", amount: 14.38, level: 1, status: "pagada", date: "2026-03-25" },
  { id: "2", orderId: "WO-0001", productName: "Detox Green Supreme", amount: 8.99, level: 2, status: "pendiente", date: "2026-03-25" },
  { id: "3", orderId: "WO-0003", productName: "Colágeno Marino", amount: 19.98, level: 1, status: "pendiente", date: "2026-03-27" },
];

export const mockTransactions: Transaction[] = [
  { id: "1", type: "credit", amount: 14.38, description: "Comisión pedido WO-0001", date: "2026-03-25", status: "completada" },
  { id: "2", type: "debit", amount: 129.90, description: "Compra pedido WO-0002", date: "2026-03-26", status: "completada" },
  { id: "3", type: "credit", amount: 50.00, description: "Recarga de saldo", date: "2026-03-24", status: "completada" },
  { id: "4", type: "credit", amount: 19.98, description: "Comisión pedido WO-0003", date: "2026-03-27", status: "pendiente" },
];

export const mockWithdrawals: WithdrawalRequest[] = [
  { id: "1", amount: 100, method: "Yape", accountNumber: "987654321", status: "aprobado", date: "2026-03-20" },
  { id: "2", amount: 50, method: "Plin", accountNumber: "912345678", status: "pendiente", date: "2026-03-26" },
];
