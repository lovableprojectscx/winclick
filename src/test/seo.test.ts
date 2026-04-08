/**
 * QA — SEO técnico
 * Verifica que index.html tenga todos los meta tags, schemas y archivos SEO correctos.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const html     = readFileSync(join(process.cwd(), "index.html"), "utf-8");
const robots   = readFileSync(join(process.cwd(), "public/robots.txt"), "utf-8");
const sitemap  = readFileSync(join(process.cwd(), "public/sitemap.xml"), "utf-8");

describe("SEO — index.html meta tags", () => {
  it("tiene title con keyword principal", () => {
    expect(html).toContain("Gana Comisiones con Productos Orgánicos");
  });

  it("meta description tiene más de 100 y menos de 160 caracteres", () => {
    const match = html.match(/<meta name="description" content="([^"]+)"/);
    expect(match).not.toBeNull();
    const len = match![1].length;
    expect(len, `description tiene ${len} chars`).toBeGreaterThan(100);
    expect(len, `description tiene ${len} chars`).toBeLessThan(160);
  });

  it("meta description incluye CTA de registro", () => {
    expect(html).toContain("Regístrate gratis");
  });

  it("meta description menciona el porcentaje de comisión", () => {
    expect(html).toContain("25%");
  });

  it("tiene geo.region PE", () => {
    expect(html).toContain('name="geo.region" content="PE"');
  });

  it("tiene geo.placename Lima", () => {
    expect(html).toContain("Lima");
  });

  it("tiene canonical hacia winclick.pe", () => {
    expect(html).toContain('rel="canonical"');
    expect(html).toContain("winclick.pe");
  });

  it("Open Graph tiene og:image", () => {
    expect(html).toContain('property="og:image"');
    expect(html).toContain("foto-index.webp");
  });

  it("Open Graph tiene og:locale es_PE", () => {
    expect(html).toContain('content="es_PE"');
  });

  it("Twitter Card es summary_large_image", () => {
    expect(html).toContain('content="summary_large_image"');
  });

  it("favicon-32.png referenciado", () => {
    expect(html).toContain("favicon-32.png");
  });

  it("apple-touch-icon referenciado", () => {
    expect(html).toContain("apple-touch-icon.png");
  });
});

describe("SEO — Schema.org JSON-LD", () => {
  it("tiene schema Organization", () => {
    expect(html).toContain('"@type": "Organization"');
  });

  it("Organization tiene nombre Winclick", () => {
    expect(html).toContain('"name": "Winclick"');
  });

  it("Organization tiene addressCountry PE", () => {
    expect(html).toContain('"addressCountry": "PE"');
  });

  it("tiene schema FAQPage", () => {
    expect(html).toContain('"@type": "FAQPage"');
  });

  it("FAQPage tiene al menos 4 preguntas", () => {
    const matches = html.match(/"@type": "Question"/g);
    expect(matches?.length ?? 0).toBeGreaterThanOrEqual(4);
  });

  it("FAQPage cubre cuánto se puede ganar", () => {
    expect(html).toContain("¿Cuánto puedo ganar con Winclick");
  });

  it("FAQPage cubre legalidad del multinivel", () => {
    expect(html).toContain("¿Es legal el negocio multinivel");
  });

  it("tiene schema LocalBusiness", () => {
    expect(html).toContain('"@type": "LocalBusiness"');
  });

  it("tiene schema WebSite con SearchAction", () => {
    expect(html).toContain('"@type": "WebSite"');
    expect(html).toContain("SearchAction");
  });
});

describe("SEO — robots.txt", () => {
  it("permite rastreo general", () => {
    expect(robots).toContain("Allow: /");
  });

  it("bloquea área de afiliado (página privada)", () => {
    expect(robots).toContain("Disallow: /area-afiliado");
  });

  it("bloquea admin dashboard (página privada)", () => {
    expect(robots).toContain("Disallow: /admin-dashboard");
  });

  it("bloquea mi-billetera (página privada)", () => {
    expect(robots).toContain("Disallow: /mi-billetera");
  });

  it("referencia el sitemap", () => {
    expect(robots).toContain("Sitemap:");
    expect(robots).toContain("sitemap.xml");
  });
});

describe("SEO — sitemap.xml", () => {
  it("es XML válido (tiene declaración XML)", () => {
    expect(sitemap).toContain('<?xml version="1.0"');
  });

  it("incluye la homepage con priority 1.0", () => {
    expect(sitemap).toContain("<priority>1.0</priority>");
  });

  it("incluye /catalogo", () => {
    expect(sitemap).toContain("/catalogo");
  });

  it("incluye /programa-afiliados", () => {
    expect(sitemap).toContain("/programa-afiliados");
  });

  it("incluye /registro-afiliado", () => {
    expect(sitemap).toContain("/registro-afiliado");
  });

  it("NO incluye páginas privadas", () => {
    expect(sitemap).not.toContain("/area-afiliado");
    expect(sitemap).not.toContain("/admin-dashboard");
    expect(sitemap).not.toContain("/mi-billetera");
  });
});
