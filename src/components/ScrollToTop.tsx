import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Componente que resetea la posición del scroll al inicio (0,0)
 * cada vez que el usuario navega a una nueva ruta.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Forzamos el scroll al inicio de la ventana
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant" // Usamos instant para que no haya salto visual molesto
    });
  }, [pathname]);

  return null;
}
