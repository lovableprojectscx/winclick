import { Link } from "react-router-dom";

const WHATSAPP = "51993516053";
const EMAIL    = "Winnersmax369@gmail.com";

export default function Footer() {
  return (
    <footer className="bg-wo-grafito" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Logo */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img src="/logo-winclick.png" alt="Winclick" className="h-7 w-auto brightness-0 invert opacity-90" />
            </Link>
            <p className="font-jakarta text-sm mt-2" style={{ color: "hsl(var(--wc-gris))" }}>Tu éxito a un solo click</p>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="font-jakarta font-semibold text-wo-crema text-sm mb-3">Empresa</h4>
            <div className="space-y-1">
              <Link to="/" className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-1.5 transition-colors">Inicio</Link>
              <Link to="/catalogo" className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-1.5 transition-colors">Catálogo</Link>
              <Link to="/contacto" className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-1.5 transition-colors">Contacto</Link>
            </div>
          </div>

          {/* Socios */}
          <div>
            <h4 className="font-jakarta font-semibold text-wo-crema text-sm mb-3">Socios</h4>
            <div className="space-y-1">
              <Link to="/programa-afiliados" className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-1.5 transition-colors">Programa</Link>
              <Link to="/registro-afiliado" className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-1.5 transition-colors">Registro</Link>
              <Link to="/login-afiliado" className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-1.5 transition-colors">Login</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-jakarta font-semibold text-wo-crema text-sm mb-3">Legal</h4>
            <div className="space-y-1">
              <Link to="/terminos" className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-1.5 transition-colors">Términos</Link>
              <Link to="/privacidad" className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-1.5 transition-colors">Privacidad</Link>
              <span className="block font-jakarta text-sm text-wo-crema-muted py-1.5">Devoluciones</span>
            </div>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-jakarta font-semibold text-wo-crema text-sm mb-3">Contacto</h4>
            <div className="space-y-1">
              <a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block font-jakarta text-sm text-wo-crema-muted hover:text-[#25D366] py-1.5 transition-colors"
              >
                WhatsApp
              </a>
              <a
                href={`mailto:${EMAIL}`}
                className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema py-1.5 transition-colors truncate"
              >
                {EMAIL}
              </a>
            </div>
          </div>
        </div>

        {/* Social + copyright */}
        <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
          <div className="flex gap-3">
            {["FB", "IG", "TK"].map((s) => (
              <div key={s} className="w-11 h-11 rounded-full bg-wo-carbon flex items-center justify-center text-wo-crema-muted font-jakarta text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                {s}
              </div>
            ))}
          </div>
          <p className="font-jakarta text-xs text-wo-crema-muted opacity-50 text-center sm:text-right">
            © 2026 Winclick. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
