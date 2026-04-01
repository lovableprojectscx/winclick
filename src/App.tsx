import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";

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
import NotFound from "./pages/NotFound";

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/login-afiliado" replace />;
  return <>{children}</>;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login-afiliado" replace />;
  return <>{children}</>;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Navbar />
            <CartDrawer />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/catalogo" element={<Catalogo />} />
              <Route path="/catalogo/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
