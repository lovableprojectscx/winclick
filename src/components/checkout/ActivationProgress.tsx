import { Link } from "react-router-dom";
import { Check, TrendingUp } from "lucide-react";
import { ACTIVATION_TARGET } from "@/lib/activationPrice";

export function ActivationProgress({
  packageName,
  alreadySpent,
  cartTotal,
}: {
  packageName: string;
  alreadySpent: number;
  cartTotal: number;
}) {
  const target      = ACTIVATION_TARGET[packageName] ?? 120;
  const afterCart   = alreadySpent + cartTotal;
  const pct         = Math.min(100, (afterCart / target) * 100);
  const prevPct     = Math.min(100, (alreadySpent / target) * 100);
  const remaining   = Math.max(0, target - afterCart);
  const willActivate = afterCart >= target;

  return (
    <div className="rounded-xl overflow-hidden mb-5"
      style={{ border: willActivate ? "0.5px solid rgba(30,192,213,0.35)" : "0.5px solid rgba(232,116,26,0.28)" }}>

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-3"
        style={{ background: willActivate ? "rgba(30,192,213,0.06)" : "rgba(232,116,26,0.05)" }}>
        <div className="flex items-center gap-2.5">
          <TrendingUp size={15} style={{ color: willActivate ? "hsl(var(--secondary))" : "hsl(var(--primary))", flexShrink: 0 }} />
          <p className="font-jakarta font-bold text-[13px]"
            style={{ color: willActivate ? "hsl(var(--secondary))" : "hsl(var(--primary))" }}>
            {willActivate ? "¡Esta compra activa tu cuenta!" : `Membresía ${packageName} — progreso`}
          </p>
        </div>
        <span className="font-syne font-extrabold text-[18px] leading-none"
          style={{ color: willActivate ? "hsl(var(--secondary))" : "hsl(var(--primary))" }}>
          {pct.toFixed(0)}%
        </span>
      </div>

      {/* Barra */}
      <div className="px-4 py-3" style={{ background: willActivate ? "rgba(30,192,213,0.03)" : "rgba(232,116,26,0.02)" }}>
        <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: "rgba(255,255,255,0.06)" }}>
          {/* Segmento ya gastado */}
          {prevPct > 0 && (
            <div className="h-full rounded-l-full inline-block"
              style={{ width: `${prevPct}%`, background: "rgba(232,116,26,0.4)", float: "left" }} />
          )}
          {/* Segmento que agrega este carrito */}
          <div className="h-full inline-block transition-all duration-500"
            style={{
              width: `${pct - prevPct}%`,
              background: willActivate ? "hsl(var(--secondary))" : "hsl(var(--primary))",
              float: "left",
            }} />
        </div>
        <div className="flex justify-between">
          <span className="font-jakarta text-[10px] text-wo-crema-muted/50">Ya acumulado: S/ {alreadySpent.toFixed(2)}</span>
          <span className="font-jakarta text-[10px] font-bold"
            style={{ color: willActivate ? "hsl(var(--secondary))" : "rgba(232,116,26,0.7)" }}>
            Meta: S/ {target.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-3.5" style={{ background: willActivate ? "rgba(30,192,213,0.03)" : "rgba(232,116,26,0.02)" }}>
        {willActivate ? (
          <div className="flex items-center gap-2">
            <Check size={13} style={{ color: "hsl(var(--secondary))" }} />
            <p className="font-jakarta text-[12px] text-secondary font-semibold">
              Al completar este pedido tu cuenta quedará en revisión para activación ({"<"}24 h).
            </p>
          </div>
        ) : (
          <p className="font-jakarta text-[12px] text-wo-crema-muted">
            Con este pedido llegas a{" "}
            <span className="font-bold text-wo-crema">S/ {afterCart.toFixed(2)}</span>.
            {" "}Te faltan{" "}
            <span className="font-bold" style={{ color: "hsl(var(--primary))" }}>
              S/ {remaining.toFixed(2)}
            </span>{" "}más para activar tu membresía {packageName}.{" "}
            <Link to="/catalogo" className="font-bold underline" style={{ color: "hsl(var(--primary))" }}>
              Agregar más productos →
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
