import { useEffect, useRef } from "react";

/**
 * Agrega clase "revealed" cuando el elemento entra en viewport.
 * Usar junto con clase CSS "reveal" (definida en index.css).
 *
 * Uso:
 *   const ref = useScrollReveal<HTMLElement>();
 *   <section ref={ref} className="reveal"> ... </section>
 */
export function useScrollReveal<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el); // solo se dispara una vez
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
