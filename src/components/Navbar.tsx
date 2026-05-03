import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ShoppingCart, Menu, X, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

export default function Navbar() {
  const { session, affiliate, role, logout } = useAuth();
  const { itemCount, setIsOpen, lastAddedId } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  // Use the auth role (not hardcoded from affiliate presence) so admins who
  // also have an affiliate record still see "Panel Admin" in the navbar.
  const user = session ? { name: affiliate?.name ?? session.user.email ?? "Admin", role } : null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { to: "/catalogo", label: "Productos" },
    { to: "/planes", label: "Planes" },
    { to: "/bonos", label: "Bonos" },
    { to: "/programa-afiliados", label: "Ganar" },
    { to: "/contacto", label: "Contacto" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-wo-obsidiana/95 backdrop-blur-md transition-shadow duration-300 ${scrolled ? "navbar-scrolled" : ""}`}
      style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo-winclick.png" alt="Winclick" className="h-8 w-auto" />
          </Link>

          {/* Center links — desktop */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`font-jakarta text-[13px] font-medium transition-colors hover:text-wo-crema ${isActive(l.to) ? "nav-link-active" : "text-wo-crema-muted"}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Cart */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-3 text-wo-crema-muted hover:text-wo-crema transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Abrir carrito"
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className={`absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${lastAddedId ? "badge-pop" : ""}`}>
                  {itemCount}
                </span>
              )}
            </button>

            {/* Auth — desktop */}
            {user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-jakarta font-bold text-xs flex items-center justify-center"
                >
                  {(user?.name || "U").split(" ").map((n) => n[0] || "").join("").substring(0, 2)}
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-wo-grafito rounded-wo-card py-1 shadow-xl" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>
                    <Link to="/mi-billetera" onClick={() => setDropdownOpen(false)} className="block px-4 py-3 text-sm text-wo-crema-muted hover:text-wo-crema hover:bg-wo-carbon font-jakarta transition-colors">
                      Mi Billetera
                    </Link>
                    <Link to={user.role === "admin" ? "/admin-dashboard" : "/area-afiliado"} onClick={() => setDropdownOpen(false)} className="block px-4 py-3 text-sm text-wo-crema-muted hover:text-wo-crema hover:bg-wo-carbon font-jakarta transition-colors">
                      {user.role === "admin" ? "Panel Admin" : "Área de Socio"}
                    </Link>
                    <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }} />
                    <button onClick={() => { logout(); setDropdownOpen(false); }} className="block w-full text-left px-4 py-3 text-sm text-wo-crema-muted hover:text-destructive hover:bg-wo-carbon font-jakarta transition-colors">
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login-afiliado"
                  className="font-jakarta font-semibold text-xs text-wo-crema-muted hover:text-wo-crema px-3 py-2.5 rounded-lg transition-colors hover:bg-wo-carbon"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro-afiliado"
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground font-jakarta font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-wo-oro-dark transition-colors"
                >
                  <Star size={12} /> Únete
                </Link>
              </div>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-3 text-wo-crema min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="mobile-menu-animate md:hidden bg-wo-grafito" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
          <div className="px-4 py-3 space-y-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center font-jakarta text-[15px] py-3.5 px-2 rounded-lg transition-colors ${isActive(l.to) ? "text-wo-crema bg-wo-carbon" : "text-wo-crema-muted hover:text-wo-crema hover:bg-wo-carbon/50"}`}
              >
                {l.label}
              </Link>
            ))}

            <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)", margin: "8px 0" }} />

            {user ? (
              <>
                <Link to={user.role === "admin" ? "/admin-dashboard" : "/area-afiliado"} onClick={() => setMobileOpen(false)} className="flex items-center font-jakarta text-[15px] text-wo-crema-muted hover:text-wo-crema hover:bg-wo-carbon/50 py-3.5 px-2 rounded-lg transition-colors">
                  {user.role === "admin" ? "Panel Admin" : "Área de Socio"}
                </Link>
                <Link to="/mi-billetera" onClick={() => setMobileOpen(false)} className="flex items-center font-jakarta text-[15px] text-wo-crema-muted hover:text-wo-crema hover:bg-wo-carbon/50 py-3.5 px-2 rounded-lg transition-colors">
                  Mi Billetera
                </Link>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="flex items-center w-full font-jakarta text-[15px] text-destructive py-3.5 px-2 rounded-lg hover:bg-wo-carbon/50 transition-colors">
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <div className="py-2 space-y-2">
                <Link
                  to="/login-afiliado"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center font-jakarta font-bold text-sm text-wo-crema py-3.5 rounded-wo-btn bg-wo-carbon hover:bg-wo-carbon/80 transition-colors"
                  style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro-afiliado"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-jakarta font-bold text-sm py-3.5 rounded-wo-btn hover:bg-wo-oro-dark transition-colors"
                >
                  <Star size={14} /> Únete gratis
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
