/**
 * QA — Marca y rebrand
 * Verifica que no queden rastros de "Winner Organa" en ningún archivo fuente.
 * Si alguno falla significa que hay texto de la marca vieja sin actualizar.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const SRC_ROOT = join(process.cwd(), "src");
const PUBLIC_ROOT = join(process.cwd(), "public");

function getAllFiles(dir: string, exts: string[]): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory() && entry !== "node_modules") {
      results.push(...getAllFiles(full, exts));
    } else if (exts.some((e) => entry.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

const sourceFiles = getAllFiles(SRC_ROOT, [".tsx", ".ts", ".css"])
  .filter((f) => !f.includes(`${require("path").sep}test${require("path").sep}`));
const htmlFile    = join(process.cwd(), "index.html");

describe("Rebrand — sin rastros de la marca anterior", () => {
  const FORBIDDEN = [
    "Winner Organa",
    "winner organa",
    "WINNER ORGANA",
    "WinnerOrgana",
    "winnerorgana",
    "Natura que te hace ganar",
    "Win click",          // con espacio
    "Billetera Winner",
  ];

  for (const pattern of FORBIDDEN) {
    it(`no debe aparecer "${pattern}" en ningún archivo .tsx/.ts/.css`, () => {
      const offenders: string[] = [];
      for (const file of sourceFiles) {
        const content = readFileSync(file, "utf-8");
        if (content.includes(pattern)) {
          offenders.push(file.replace(process.cwd(), ""));
        }
      }
      expect(offenders, `"${pattern}" encontrado en: ${offenders.join(", ")}`).toHaveLength(0);
    });

    it(`no debe aparecer "${pattern}" en index.html`, () => {
      const content = readFileSync(htmlFile, "utf-8");
      expect(content.includes(pattern), `"${pattern}" encontrado en index.html`).toBe(false);
    });
  }

  it('index.html debe contener "Winclick" en el título', () => {
    const content = readFileSync(htmlFile, "utf-8");
    expect(content).toContain("Winclick");
  });

  it('index.html debe tener lang="es-PE"', () => {
    const content = readFileSync(htmlFile, "utf-8");
    expect(content).toContain('lang="es-PE"');
  });

  it('slogan correcto "Tu éxito a un solo click" presente en index.html', () => {
    const content = readFileSync(htmlFile, "utf-8");
    expect(content).toContain("éxito a un solo click");
  });
});

describe("Assets — imágenes requeridas en /public", () => {
  const REQUIRED_ASSETS = [
    "logo-winclick.png",
    "logo-winclick.webp",
    "icono-winclick.png",
    "icono-winclick.webp",
    "foto-index.webp",
    "foto-index.png",
    "favicon-32.png",
    "apple-touch-icon.png",
    "robots.txt",
    "sitemap.xml",
  ];

  for (const asset of REQUIRED_ASSETS) {
    it(`/public/${asset} debe existir`, () => {
      const { existsSync } = require("fs");
      expect(existsSync(join(PUBLIC_ROOT, asset))).toBe(true);
    });
  }

  it("foto-index.webp debe pesar menos de 200KB (optimizada)", () => {
    const size = statSync(join(PUBLIC_ROOT, "foto-index.webp")).size;
    expect(size).toBeLessThan(200 * 1024);
  });

  it("logo-winclick.png debe pesar menos de 100KB (optimizado)", () => {
    const size = statSync(join(PUBLIC_ROOT, "logo-winclick.png")).size;
    expect(size).toBeLessThan(100 * 1024);
  });
});
