/**
 * QA — LoginAfiliado
 * Prueba el formulario de login: campos, validación, show/hide password,
 * redirecciones y recuperación de contraseña.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import LoginAfiliado from "@/pages/LoginAfiliado";
import { renderWithProviders } from "./test-utils";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const { mockNavigate, mockLogin, mockResetPassword } = vi.hoisted(() => ({
  mockNavigate:     vi.fn(),
  mockLogin:        vi.fn(),
  mockResetPassword: vi.fn().mockResolvedValue({}),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: mockResetPassword,
    },
  },
}));

import { useAuth } from "@/contexts/AuthContext";

function setAuthState({
  loginResult = { error: null },
  role = null as "affiliate" | "admin" | null,
  isAdmin = false,
  loading = false,
}: {
  loginResult?: { error: string | null };
  role?: "affiliate" | "admin" | null;
  isAdmin?: boolean;
  loading?: boolean;
} = {}) {
  mockLogin.mockResolvedValue(loginResult);
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    login:     mockLogin,
    isAdmin,
    role,
    loading,
    session:   null,
    affiliate: null,
    register:  vi.fn(),
    logout:    vi.fn(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setAuthState(); // sin sesión, sin error por defecto
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderLogin() {
  return renderWithProviders(<LoginAfiliado />);
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup({ delay: null });
  const emailInput    = screen.getByPlaceholderText("tu@email.com");
  const passwordInput = screen.getByPlaceholderText("Tu contraseña");
  const submitBtn     = screen.getByRole("button", { name: /iniciar sesión/i });
  await user.type(emailInput, email);
  await user.type(passwordInput, password);
  await user.click(submitBtn);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("LoginAfiliado — renderizado", () => {
  it("muestra el campo de email", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("tu@email.com")).toBeInTheDocument();
  });

  it("muestra el campo de contraseña", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("Tu contraseña")).toBeInTheDocument();
  });

  it("el campo de contraseña empieza en type='password'", () => {
    renderLogin();
    const pw = screen.getByPlaceholderText("Tu contraseña");
    expect(pw).toHaveAttribute("type", "password");
  });

  it("muestra el botón de submit", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it("muestra el link '¿Olvidaste tu contraseña?'", () => {
    renderLogin();
    expect(screen.getByText(/olvidaste tu contraseña/i)).toBeInTheDocument();
  });

  it("muestra link a /registro-afiliado", () => {
    renderLogin();
    expect(screen.getByRole("link", { name: /regístrate gratis/i })).toHaveAttribute("href", "/registro-afiliado");
  });
});

describe("LoginAfiliado — show/hide password", () => {
  it("click en ojo cambia type a 'text'", async () => {
    const user = userEvent.setup({ delay: null });
    renderLogin();
    const eyeBtn = screen.getByLabelText("Mostrar contraseña");
    await user.click(eyeBtn);
    expect(screen.getByPlaceholderText("Tu contraseña")).toHaveAttribute("type", "text");
  });

  it("segundo click en ojo vuelve a type='password'", async () => {
    const user = userEvent.setup({ delay: null });
    renderLogin();
    const eyeBtn = screen.getByLabelText("Mostrar contraseña");
    await user.click(eyeBtn);
    await user.click(screen.getByLabelText("Ocultar contraseña"));
    expect(screen.getByPlaceholderText("Tu contraseña")).toHaveAttribute("type", "password");
  });
});

describe("LoginAfiliado — submit y validación", () => {
  it("llama a login() con email y password al submitear", async () => {
    renderLogin();
    await fillAndSubmit("test@example.com", "pass123");
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith("test@example.com", "pass123"));
  });

  it("login exitoso de afiliado → navega a /area-afiliado", async () => {
    setAuthState({ loginResult: { error: null }, role: "affiliate", isAdmin: false });
    renderLogin();
    await fillAndSubmit("test@example.com", "pass123");
    // Después del login exitoso se setea pendingNav=true,
    // luego el useEffect detecta role !== null y navega
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/area-afiliado"));
  });

  it("login exitoso de admin → navega a /admin-dashboard", async () => {
    setAuthState({ loginResult: { error: null }, role: "admin", isAdmin: true });
    renderLogin();
    await fillAndSubmit("admin@example.com", "admin123");
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/admin-dashboard"));
  });

  it("login fallido muestra mensaje de error", async () => {
    setAuthState({ loginResult: { error: "Invalid credentials" } });
    renderLogin();
    await fillAndSubmit("bad@example.com", "wrong");
    await waitFor(() =>
      expect(screen.getByText("Email o contraseña incorrectos.")).toBeInTheDocument(),
    );
  });

  it("botón muestra 'Ingresando...' durante loading y está deshabilitado", async () => {
    // Simulamos login que tarda
    mockLogin.mockImplementation(() => new Promise(() => {})); // never resolves
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      login: mockLogin, isAdmin: false, role: null, loading: false,
      session: null, affiliate: null, register: vi.fn(), logout: vi.fn(),
    });
    renderLogin();
    const user = userEvent.setup({ delay: null });
    await user.type(screen.getByPlaceholderText("tu@email.com"), "t@t.com");
    await user.type(screen.getByPlaceholderText("Tu contraseña"), "pass");
    fireEvent.submit(screen.getByRole("button", { name: /iniciar sesión/i }).closest("form")!);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /ingresando/i })).toBeDisabled(),
    );
  });
});

describe("LoginAfiliado — recuperación de contraseña", () => {
  it("click en '¿Olvidaste tu contraseña?' muestra la sección de recuperación", async () => {
    const user = userEvent.setup({ delay: null });
    renderLogin();
    await user.click(screen.getByText(/olvidaste tu contraseña/i));
    // Cuando se abre la sección de recuperación aparece un segundo input de email
    const allEmailInputs = screen.getAllByPlaceholderText("tu@email.com");
    expect(allEmailInputs.length).toBe(2); // login email + recovery email
    expect(screen.getByRole("button", { name: /enviar enlace/i })).toBeInTheDocument();
  });

  it("segundo click en '¿Olvidaste?' oculta la sección", async () => {
    const user = userEvent.setup({ delay: null });
    renderLogin();
    await user.click(screen.getByText(/olvidaste tu contraseña/i));
    await user.click(screen.getByText(/olvidaste tu contraseña/i));
    expect(screen.queryByRole("button", { name: /enviar enlace/i })).not.toBeInTheDocument();
  });

  it("submit de recuperación llama resetPasswordForEmail", async () => {
    const user = userEvent.setup({ delay: null });
    renderLogin();
    await user.click(screen.getByText(/olvidaste tu contraseña/i));

    // Hay dos inputs con placeholder tu@email.com — el de recuperación es el segundo
    const allEmailInputs = screen.getAllByPlaceholderText("tu@email.com");
    const recoveryInput = allEmailInputs[allEmailInputs.length - 1];
    await user.type(recoveryInput, "recover@example.com");
    await user.click(screen.getByRole("button", { name: /enviar enlace/i }));
    await waitFor(() =>
      expect(mockResetPassword).toHaveBeenCalledWith(
        "recover@example.com",
        expect.objectContaining({ redirectTo: expect.stringContaining("reset-password") }),
      ),
    );
  });

  it("muestra confirmación de enlace enviado", async () => {
    const user = userEvent.setup({ delay: null });
    renderLogin();
    await user.click(screen.getByText(/olvidaste tu contraseña/i));
    const allEmailInputs = screen.getAllByPlaceholderText("tu@email.com");
    await user.type(allEmailInputs[allEmailInputs.length - 1], "r@example.com");
    await user.click(screen.getByRole("button", { name: /enviar enlace/i }));
    await waitFor(() =>
      expect(screen.getByText("Enlace enviado a tu correo")).toBeInTheDocument(),
    );
  });
});
