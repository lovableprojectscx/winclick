/**
 * QA — Hook useSEO
 * Verifica que el hook actualice correctamente document.title y los meta tags.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSEO } from "@/hooks/useSEO";

beforeEach(() => {
  document.title = "";
  document.head.innerHTML = `
    <meta name="description" content="" />
    <meta property="og:title" content="" />
    <meta property="og:description" content="" />
    <meta property="og:image" content="" />
  `;
});

describe("useSEO hook", () => {
  it("actualiza document.title", () => {
    renderHook(() => useSEO({
      title: "Winclick Perú | Gana Comisiones",
      description: "Test description",
    }));
    expect(document.title).toBe("Winclick Perú | Gana Comisiones");
  });

  it("actualiza meta description", () => {
    renderHook(() => useSEO({
      title: "Test",
      description: "Descripción de prueba para Winclick",
    }));
    const el = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    expect(el?.content).toBe("Descripción de prueba para Winclick");
  });

  it("actualiza og:title", () => {
    renderHook(() => useSEO({
      title: "OG Title Test",
      description: "desc",
    }));
    const el = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    expect(el?.content).toBe("OG Title Test");
  });

  it("actualiza og:image cuando se provee", () => {
    renderHook(() => useSEO({
      title: "Test",
      description: "desc",
      ogImage: "https://winclick.pe/foto-index.webp",
    }));
    const el = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
    expect(el?.content).toBe("https://winclick.pe/foto-index.webp");
  });

  it("crea canonical link cuando se provee", () => {
    renderHook(() => useSEO({
      title: "Test",
      description: "desc",
      canonical: "https://winclick.pe/catalogo",
    }));
    const el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(el?.href).toBe("https://winclick.pe/catalogo");
  });

  it("no crea canonical link cuando no se provee", () => {
    renderHook(() => useSEO({ title: "Test", description: "desc" }));
    const el = document.querySelector('link[rel="canonical"]');
    expect(el).toBeNull();
  });

  it("crea el meta tag si no existe en el DOM", () => {
    document.head.innerHTML = ""; // DOM limpio sin metas
    renderHook(() => useSEO({
      title: "Winclick",
      description: "Nueva descripción",
    }));
    expect(document.title).toBe("Winclick");
    const desc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    expect(desc?.content).toBe("Nueva descripción");
  });
});
