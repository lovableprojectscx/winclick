/**
 * QA — AuthContext
 * Prueba login, register, logout y carga de perfil mockeando Supabase.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React, { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { mockAffiliate } from "./test-utils";

// ─── Mock de Supabase (vi.hoisted evita el error de hoisting) ────────────────

const {
  mockUnsubscribe, mockSignIn, mockSignUp, mockSignOut,
  mockGetSession, mockOnAuthChange, mockFrom,
} = vi.hoisted(() => {
  const mockUnsubscribe  = vi.fn();
  const mockOnAuthChange = vi.fn(() => ({
    data: { subscription: { unsubscribe: mockUnsubscribe } },
  }));
  return {
    mockUnsubscribe,
    mockSignIn:      vi.fn(),
    mockSignUp:      vi.fn(),
    mockSignOut:     vi.fn(),
    mockGetSession:  vi.fn(),
    mockOnAuthChange,
    mockFrom:        vi.fn(),
  };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession:            mockGetSession,
      signInWithPassword:    mockSignIn,
      signUp:                mockSignUp,
      signOut:               mockSignOut,
      onAuthStateChange:     mockOnAuthChange,
      resetPasswordForEmail: vi.fn().mockResolvedValue({}),
    },
    from: mockFrom,
    rpc:  vi.fn().mockResolvedValue({ error: null }),
  },
}));

// ─── Helper: fixture de sesión ───────────────────────────────────────────────

function buildSession(userId = "user-1") {
  return { user: { id: userId, email: "test@example.com" } } as any;
}

// ─── Wrapper ─────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

// ─── Setup por defecto: sin sesión activa ─────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  // Sin sesión activa por defecto
  mockGetSession.mockResolvedValue({ data: { session: null } });

  // onAuthStateChange no dispara eventos inmediatos
  mockOnAuthChange.mockReturnValue({
    data: { subscription: { unsubscribe: mockUnsubscribe } },
  });
});

// ─── Helper para mockear queries de tablas ────────────────────────────────────

function mockTable(table: string, data: any, error: any = null) {
  mockFrom.mockImplementation((t: string) => {
    if (t !== table) return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null, count: 0 }), insert: vi.fn().mockResolvedValue({ error: null }) };
    return {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data, error }),
      insert: vi.fn().mockResolvedValue({ error }),
      count:  0,
    };
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("AuthContext — estado inicial", () => {
  it("session es null antes de cargar", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();
    expect(result.current.affiliate).toBeNull();
    expect(result.current.role).toBeNull();
  });

  it("isAdmin es false cuando no hay sesión", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAdmin).toBe(false);
  });
});

describe("AuthContext — login()", () => {
  it("retorna { error: null } con credenciales válidas", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let res: { error: string | null };
    await act(async () => {
      res = await result.current.login("test@example.com", "pass123");
    });
    expect(res!.error).toBeNull();
    expect(mockSignIn).toHaveBeenCalledWith({ email: "test@example.com", password: "pass123" });
  });

  it("retorna { error: mensaje } con credenciales inválidas", async () => {
    mockSignIn.mockResolvedValue({ error: { message: "Invalid credentials" } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let res: { error: string | null };
    await act(async () => {
      res = await result.current.login("bad@example.com", "wrong");
    });
    expect(res!.error).toBe("Invalid credentials");
  });
});

describe("AuthContext — logout()", () => {
  it("llama a supabase.auth.signOut()", async () => {
    mockSignOut.mockResolvedValue({});
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.logout();
    });
    expect(mockSignOut).toHaveBeenCalledOnce();
  });
});

describe("AuthContext — register()", () => {
  it("retorna { error: null } con datos válidos", async () => {
    const userId = "new-user-1";
    mockSignUp.mockResolvedValue({ data: { user: { id: userId } }, error: null });

    // Mock: affiliate_code check → no existe (count = 0)
    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }));

    const { supabase } = await import("@/lib/supabase");
    (supabase.rpc as any).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let res: { error: string | null };
    await act(async () => {
      res = await result.current.register({
        name:        "Juan Pérez",
        email:       "juan@example.com",
        password:    "pass123",
        dni:         "87654321",
        yapeNumber:  "999111222",
        packageType: "Básico",
      });
    });
    expect(res!.error).toBeNull();
    expect(mockSignUp).toHaveBeenCalledWith({
      email:    "juan@example.com",
      password: "pass123",
    });
  });

  it("retorna { error: mensaje } si signUp falla", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: { message: "Email already in use" },
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let res: { error: string | null };
    await act(async () => {
      res = await result.current.register({
        name:        "Test",
        email:       "existing@example.com",
        password:    "pass",
        dni:         "00000000",
        yapeNumber:  "000000000",
        packageType: "Básico",
      });
    });
    expect(res!.error).toBe("Email already in use");
  });
});

describe("AuthContext — isAdmin", () => {
  it("isAdmin es true cuando role = 'admin'", async () => {
    const session = buildSession();
    mockGetSession.mockResolvedValue({ data: { session } });

    // Role = admin
    mockFrom.mockImplementation((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: table === "user_roles"
          ? { role: "admin" }
          : mockAffiliate,
        error: null,
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.role).toBe("admin");
  });
});
