import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Suspense, lazy, useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";

import Index from "./pages/Index";
import Catalogo from "./pages/Catalogo";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import ProgramaAfiliados from "./pages/ProgramaAfiliados";
import RegistroAfiliado from "./pages/RegistroAfiliado";
import LoginAfiliado from "./pages/LoginAfiliado";
import AreaAfiliado from "./pages/AreaAfiliado";
import MiBilletera from "./pages/MiBilletera";
import TiendaAfiliado from "./pages/TiendaAfiliado";
import AdminDashboard from "./pages/AdminDashboard";
import EditarTienda from "./pages/EditarTienda";
import Contacto from "./pages/Contacto";
import ResetPassword from "./pages/ResetPassword";
import Terminos from "./pages/Terminos";
import Privacidad from "./pages/Privacidad";
import AdminLogin from "./pages/AdminLogin";
import PromoAbril from "./pages/PromoAbril";
import NotFound from "./pages/NotFound";

const DevTools = import.meta.env.DEV
  ? lazy(() => import("./pages/DevTools"))
  : null;

function FullPageLoader() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "hsl(var(--background))",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "1rem"
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%",
        border: "2.5px solid hsl(var(--primary))",
        borderTopColor: "transparent",
        animation: "spin 0.75s linear infinite"
      }} />
      <p style={{ fontFamily: "var(--font-jakarta, sans-serif)", fontSize: 13, color: "hsl(var(--wo-crema-muted, 210 10% 60%))" }}>
        Cargando...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin, session, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  // No hay sesión → puede ser el admin intentando entrar
  if (!session) return <Navigate to="/admin-login" replace />;
  // Hay sesión pero no es admin → es un afiliado, mandarlo a su área
  if (!isAdmin) return <Navigate to="/area-afiliado" replace />;
  return <>{children}</>;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!session) return <Navigate to="/login-afiliado" replace />;
  return <>{children}</>;
}


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Only retry once — with the fetch timeout above the user sees
      // an error within ~25s instead of hanging for minutes
      retry: 1,
      retryDelay: 1500,
      // Treat cached data as fresh for 2 min — avoids redundant refetches
      staleTime: 2 * 60 * 1000,
      // Always attempt fetching even on slow/unreliable connections
      networkMode: "always",
    },
  },
});

const PROMO_END = new Date("2026-04-30T23:59:59");
function barInitiallyVisible() {
  try { if (localStorage.getItem("promo_abril_bar_dismissed") === "1") return false; } catch {}
  return new Date() < PROMO_END;
}

// Oculta Navbar y Footer en las páginas de tienda de afiliado
function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isTienda    = pathname.startsWith("/tienda/");
  const isPromoPage = pathname === "/promo-abril";
  const hideBarRoutes = ["/admin-dashboard", "/area-afiliado", "/mi-billetera", "/editar-tienda", "/admin-login"];
  const showBar = !isTienda && !isPromoPage && !hideBarRoutes.some((r) => pathname.startsWith(r));

  const [barVisible, setBarVisible] = useState(showBar && barInitiallyVisible());

  const BAR_H = barVisible && showBar ? 36 : 0; // px — altura de la barra

  return (
    <>
      {showBar && (
        <AnnouncementBar
          visible={barVisible}
          onDismiss={() => setBarVisible(false)}
        />
      )}
      {!isTienda && <Navbar topOffset={BAR_H} />}
      <CartDrawer />
      {/* Desplaza el bloque de contenido hacia abajo cuando la barra está activa.
          Las páginas ya tienen pt-16 (64px) para limpiar la navbar; sólo
          necesitamos empujarlas por la altura adicional de la barra. */}
      <div style={{ marginTop: BAR_H }}>
        {children}
      </div>
      {!isTienda && <Footer />}
    </>
  );
}


const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ConditionalLayout>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/catalogo" element={<Catalogo />} />
              <Route path="/catalogo/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
              <Route path="/programa-afiliados" element={<ProgramaAfiliados />} />
              <Route path="/registro-afiliado" element={<RegistroAfiliado />} />
              <Route path="/login-afiliado" element={<LoginAfiliado />} />
              <Route path="/area-afiliado" element={<RequireAuth><AreaAfiliado /></RequireAuth>} />
              <Route path="/mi-billetera" element={<RequireAuth><MiBilletera /></RequireAuth>} />
              <Route path="/tienda/:codigo" element={<TiendaAfiliado />} />
              <Route path="/admin-dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
              <Route path="/editar-tienda" element={<RequireAuth><EditarTienda /></RequireAuth>} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/terminos" element={<Terminos />} />
              <Route path="/privacidad" element={<Privacidad />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/promo-abril" element={<PromoAbril />} />
              {import.meta.env.DEV && DevTools && (
                <Route path="/dev-tools" element={<Suspense fallback={null}><DevTools /></Suspense>} />
              )}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </ConditionalLayout>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
