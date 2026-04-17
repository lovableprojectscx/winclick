import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Zap } from "lucide-react";

const PROMO_END = new Date("2026-04-30T23:59:59");
const STORAGE_KEY = "promo_abril_bar_dismissed";
const BAR_H = 36; // px — debe coincidir con ConditionalLayout

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

function useCountdownShort(target: Date) {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      days:    Math.floor(diff / 86_400_000),
      hours:   Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      expired: diff === 0,
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 60_000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export default function AnnouncementBar({ visible, onDismiss }: Props) {
  const { days, hours, minutes } = useCountdownShort(PROMO_END);

  const handleDismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    onDismiss();
  };

  if (!visible) return null;

  const countdown = days > 0
    ? `${days}d ${hours}h`
    : hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes} min`;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 px-10"
      style={{
        height: BAR_H,
        background: "linear-gradient(90deg, hsl(var(--wo-oro-dark)) 0%, hsl(var(--wo-oro)) 50%, hsl(var(--wo-oro-dark)) 100%)",
      }}
    >
      <Zap size={12} className="fill-primary-foreground text-primary-foreground flex-shrink-0" />
      <p className="font-jakarta text-[12px] sm:text-[13px] font-bold text-primary-foreground text-center">
        <span className="hidden sm:inline">🎉 Promo Abril — </span>
        Únete con <strong>40% OFF</strong> en tu kit.{" "}
        <span className="opacity-80 hidden sm:inline">Vence en {countdown}.</span>{" "}
        <Link
          to="/promo-abril"
          className="underline underline-offset-2 hover:opacity-80 transition-opacity font-extrabold"
        >
          Ver oferta →
        </Link>
      </p>
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
        aria-label="Cerrar anuncio"
      >
        <X size={13} />
      </button>
    </div>
  );
}
