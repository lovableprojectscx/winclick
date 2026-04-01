import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-wo-grafito" style={{ borderTop: "0.5px solid hsl(var(--wo-oro-muted) / 0.3)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo */}
          <div>
            <Link to="/" className="font-syne font-extrabold text-lg">
              <span className="text-wo-crema">Winner</span>{" "}
              <span className="text-primary">Organa</span>
            </Link>
            <p className="font-jakarta text-sm text-wo-crema-muted mt-2">Natura que te hace ganar</p>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="font-jakarta font-semibold text-wo-crema text-sm mb-3">Empresa</h4>
            <div className="space-y-2">
              <Link to="/" className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema">Inicio</Link>
              <Link to="/catalogo" className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema">Catálogo</Link>
              <Link to="/contacto" className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema">Contacto</Link>
            </div>
          </div>

          {/* Socios */}
          <div>
            <h4 className="font-jakarta font-semibold text-wo-crema text-sm mb-3">Socios</h4>
            <div className="space-y-2">
              <Link to="/programa-afiliados" className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema">Programa</Link>
              <Link to="/registro-afiliado" className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema">Registro</Link>
              <Link to="/login-afiliado" className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema">Login</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-jakarta font-semibold text-wo-crema text-sm mb-3">Legal</h4>
            <div className="space-y-2">
              <Link to="/terminos" className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema">Términos</Link>
              <Link to="/privacidad" className="block font-jakarta text-sm text-wo-crema-muted hover:text-wo-crema">Privacidad</Link>
              <span className="block font-jakarta text-sm text-wo-crema-muted">Devoluciones</span>
            </div>
          </div>
        </div>

        {/* Social + copyright */}
        <div className="mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
          <div className="flex gap-3">
            {["FB", "IG", "TK"].map((s) => (
              <div key={s} className="w-9 h-9 rounded-full bg-wo-carbon flex items-center justify-center text-wo-crema-muted font-jakarta text-xs font-medium">
                {s}
              </div>
            ))}
          </div>
          <p className="font-jakarta text-xs text-wo-crema-muted opacity-60">
            © 2026 Winner Organa. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
