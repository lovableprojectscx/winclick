import { X, Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, total, isOpen, setIsOpen } = useCart();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[92vw] sm:max-w-[400px] bg-wo-grafito flex flex-col" style={{ borderLeft: "0.5px solid rgba(255,255,255,0.08)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
          <h2 className="font-syne font-bold text-lg text-wo-crema">Tu carrito</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-wo-crema-muted hover:text-wo-crema hover:bg-wo-carbon transition-colors"
            aria-label="Cerrar carrito"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
              <ShoppingCart size={52} className="text-wo-crema-muted opacity-30" />
              <p className="text-wo-crema-muted font-jakarta text-sm">Tu carrito está vacío</p>
              <Link
                to="/catalogo"
                onClick={() => setIsOpen(false)}
                className="bg-secondary text-secondary-foreground font-jakarta font-bold text-sm px-7 py-3 rounded-wo-btn hover:bg-wo-esmeralda-dark transition-colors"
              >
                Ver productos
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex gap-3 items-start">
                <img
                  src={item.product.image_url ?? ""}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-lg object-cover bg-wo-carbon shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-jakarta font-semibold text-sm text-wo-crema truncate leading-tight">{item.product.name}</p>
                  <p className="font-syne font-bold text-primary text-sm mt-1">S/ {item.product.price.toFixed(2)}</p>
                  {/* Quantity controls — 44px tap targets */}
                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-9 h-9 flex items-center justify-center bg-wo-carbon rounded-lg text-wo-crema-muted hover:text-wo-crema hover:bg-wo-obsidiana transition-colors"
                      style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                      aria-label="Restar"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="text-wo-crema font-jakarta font-semibold text-sm w-7 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-9 h-9 flex items-center justify-center bg-wo-carbon rounded-lg text-wo-crema-muted hover:text-wo-crema hover:bg-wo-obsidiana transition-colors"
                      style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                      aria-label="Sumar"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="w-9 h-9 flex items-center justify-center text-wo-crema-muted hover:text-destructive transition-colors shrink-0"
                  aria-label="Eliminar producto"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 space-y-3" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between px-1">
              <span className="text-wo-crema-muted font-jakarta text-sm">Total</span>
              <span className="font-syne font-extrabold text-xl text-primary">S/ {total.toFixed(2)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={() => setIsOpen(false)}
              className="block w-full bg-primary text-primary-foreground font-jakarta font-bold text-sm text-center py-4 rounded-wo-btn hover:bg-wo-oro-dark transition-colors"
            >
              Ir al checkout →
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-wo-crema-muted font-jakarta text-sm text-center py-3 hover:text-wo-crema transition-colors rounded-wo-btn"
              style={{ border: "0.5px solid rgba(248,244,236,0.15)" }}
            >
              Seguir comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}
