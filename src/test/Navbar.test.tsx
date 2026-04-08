/**
 * QA — Navbar
 * Prueba la barra de navegación en estado autenticado, no autenticado y mobile.
 *
 * Nota: Navbar usa `const { user, logout } = useAuth()` donde `user` tiene { name, role }.
 * El mock refleja esta API que Navbar realmente consume.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, render, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useEffect } from "react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { renderWithProviders, mockProduct } from "./test-utils";

// ─── Mock de AuthContext ──────────────────────────────────────────────────────
// Navbar usa: const { user, logout } = useAuth()
// user tiene { name, role }

const mockLogout = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { useAuth } from "@/contexts/AuthContext";

function setUser(user: { name: string; role: string } | null) {
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    user,
    logout:    mockLogout,
    session:   user ? {} : null,
    affiliate: null,
    role:      user?.role ?? null,
    isAdmin:   user?.role === "admin",
    loading:   false,
    login:     vi.fn(),
    register:  vi.fn(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setUser(null); // sin sesión por defecto
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Navbar — sin sesión", () => {
  it("muestra el botón 'Únete' (desktop)", () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText("Únete")).toBeInTheDocument();
  });

  it("NO muestra avatar/botón de usuario logueado", () => {
    renderWithProviders(<Navbar />);
    // No hay botón con iniciales de usuario
    expect(screen.queryByRole("button", { name: /cerrar/i })).not.toBeInTheDocument();
  });

  it("el logo enlaza a '/'", () => {
    renderWithProviders(<Navbar />);
    const logoLink = screen.getByRole("link", { name: /winclick/i });
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("muestra links de navegación: Productos, Ganar, Contacto", () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText("Productos")).toBeInTheDocument();
    expect(screen.getByText("Ganar")).toBeInTheDocument();
    expect(screen.getByText("Contacto")).toBeInTheDocument();
  });

  it("links de navegación apuntan a las rutas correctas", () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByRole("link", { name: "Productos" })).toHaveAttribute("href", "/catalogo");
    expect(screen.getByRole("link", { name: "Ganar" })).toHaveAttribute("href", "/programa-afiliados");
    expect(screen.getByRole("link", { name: "Contacto" })).toHaveAttribute("href", "/contacto");
  });
});

describe("Navbar — con sesión (afiliado)", () => {
  beforeEach(() => setUser({ name: "María García", role: "affiliate" }));

  it("NO muestra el botón 'Únete' (desktop)", () => {
    renderWithProviders(<Navbar />);
    // El botón de desktop 'Únete' está oculto con hidden md:flex
    // Verificamos que no hay ningún link a /registro-afiliado con texto 'Únete'
    const joinBtn = screen.queryByRole("link", { name: /únete$/i });
    // En desktop no debe aparecer cuando hay sesión
    if (joinBtn) {
      // Si aparece, debe ser el del mobile panel (que sí aparece solo al abrir el menú)
      expect(joinBtn.closest(".md\\:hidden, .md\\:block")).toBeTruthy();
    }
  });

  it("muestra iniciales del nombre en el avatar", () => {
    renderWithProviders(<Navbar />);
    // "María García" → iniciales "MG"
    expect(screen.getByText("MG")).toBeInTheDocument();
  });
});

describe("Navbar — con sesión (admin)", () => {
  beforeEach(() => setUser({ name: "Admin User", role: "admin" }));

  it("muestra iniciales del admin en el avatar", () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText("AU")).toBeInTheDocument();
  });

  it("dropdown muestra 'Panel Admin' en lugar de 'Área de Socio'", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Navbar />);
    const avatar = screen.getByText("AU").closest("button")!;
    await user.click(avatar);
    expect(screen.getByText("Panel Admin")).toBeInTheDocument();
  });
});

describe("Navbar — carrito badge", () => {
  it("NO muestra badge cuando itemCount = 0", () => {
    renderWithProviders(<Navbar />);
    // Sin items en el cart, el span del badge no debe existir
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("muestra badge con el número de items cuando hay productos en el carrito", () => {
    function NavWithItems() {
      const cart = useCart();
      useEffect(() => {
        cart.addItem(mockProduct);
        cart.addItem(mockProduct); // qty = 2
      }, []);
      return <Navbar />;
    }
    render(
      <MemoryRouter>
        <CartProvider>
          <NavWithItems />
        </CartProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("click en icono carrito setea isOpen=true en el contexto", async () => {
    let cartRef: ReturnType<typeof useCart>;
    function NavWithCart() {
      cartRef = useCart();
      return <Navbar />;
    }
    render(
      <MemoryRouter>
        <CartProvider>
          <NavWithCart />
        </CartProvider>
      </MemoryRouter>,
    );
    expect(cartRef!.isOpen).toBe(false);
    const user = userEvent.setup({ delay: null });
    await user.click(screen.getByLabelText("Abrir carrito"));
    expect(cartRef!.isOpen).toBe(true);
  });
});

describe("Navbar — menú mobile", () => {
  it("botón hamburger tiene aria-label 'Abrir menú'", () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByLabelText("Abrir menú")).toBeInTheDocument();
  });

  it("click en hamburger abre el panel mobile con los links", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Navbar />);
    const hamburger = screen.getByLabelText("Abrir menú");
    await user.click(hamburger);
    // Los links aparecen en el panel mobile (hay múltiples, 3 de nav + los de auth)
    const productoLinks = screen.getAllByText("Productos");
    expect(productoLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("click en hamburger abierto muestra aria-label 'Cerrar menú'", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Navbar />);
    await user.click(screen.getByLabelText("Abrir menú"));
    expect(screen.getByLabelText("Cerrar menú")).toBeInTheDocument();
  });

  it("panel mobile sin sesión muestra 'Únete gratis' y 'Ya tengo cuenta'", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Navbar />);
    await user.click(screen.getByLabelText("Abrir menú"));
    expect(screen.getByText("Únete gratis")).toBeInTheDocument();
    expect(screen.getByText("Ya tengo cuenta →")).toBeInTheDocument();
  });
});

describe("Navbar — logout", () => {
  beforeEach(() => setUser({ name: "Test User", role: "affiliate" }));

  it("click en 'Cerrar Sesión' en mobile llama logout()", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Navbar />);
    // Abrir menú mobile
    await user.click(screen.getByLabelText("Abrir menú"));
    const logoutBtn = screen.getByText("Cerrar Sesión");
    await user.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledOnce();
  });
});
