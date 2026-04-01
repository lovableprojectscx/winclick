import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { ShoppingCart, Menu, X, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount, setIsOpen, lastAddedId } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/catalogo", label: "Productos" },
    { to: "/programa-afiliados", label: "Ganar" },
    { to: "/contacto", label: "Contacto" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-wo-obsidiana/90 backdrop-blur-md" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 font-syne text-lg font-extrabold">
            <span className="text-wo-crema">Winner</span>
            <span className="text-primary">Organa</span>
          </Link>

          {/* Center links - desktop */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`font-jakarta text-[13px] font-medium transition-colors hover:text-wo-crema ${isActive(l.to) ? "text-wo-crema" : "text-wo-crema-muted"}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 text-wo-crema-muted hover:text-wo-crema transition-colors"
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className={`absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${lastAddedId ? "badge-pop" : ""}`}>
                  {itemCount}
                </span>
              )}
            </button>

            {/* Auth */}
            {user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-jakarta font-bold text-xs flex items-center justify-center"
                >
                  {user.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-wo-grafito rounded-wo-card py-2" style={{ border: "0.5px solid rgba(255,255,255,0.07)" }}>
                    <Link to="/mi-billetera" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-wo-crema-muted hover:text-wo-crema hover:bg-wo-carbon font-jakarta">
                      Mi Billetera
                    </Link>
                    <Link to={user.role === "admin" ? "/admin-dashboard" : "/area-afiliado"} onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-wo-crema-muted hover:text-wo-crema hover:bg-wo-carbon font-jakarta">
                      {user.role === "admin" ? "Panel Admin" : "Área de Socio"}
                    </Link>
                    <button onClick={() => { logout(); setDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-wo-crema-muted hover:text-destructive hover:bg-wo-carbon font-jakarta">
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/registro-afiliado"
                className="hidden md:flex items-center gap-1.5 bg-primary text-primary-foreground font-jakarta font-bold text-xs px-4 py-2 rounded-lg hover:bg-wo-oro-dark transition-colors"
              >
                <Star size={12} /> Únete
              </Link>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-wo-crema">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="md:hidden bg-wo-grafito" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
          <div className="px-4 py-4 space-y-3">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-2">
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to={user.role === "admin" ? "/admin-dashboard" : "/area-afiliado"} onClick={() => setMobileOpen(false)} className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-2">
                  {user.role === "admin" ? "Panel Admin" : "Área de Socio"}
                </Link>
                <Link to="/mi-billetera" onClick={() => setMobileOpen(false)} className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-2">
                  Mi Billetera
                </Link>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="block font-jakarta text-sm text-destructive py-2">
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link to="/registro-afiliado" onClick={() => setMobileOpen(false)} className="block bg-primary text-primary-foreground font-jakarta font-bold text-sm text-center py-3 rounded-wo-btn">
                ★ Únete
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
