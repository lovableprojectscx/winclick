import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(242,201,76,0.06) 0%, transparent 60%)" }} />
      </div>
      <span className="absolute font-syne font-extrabold text-[96px] text-primary opacity-[0.08] select-none">404</span>
      <div className="relative z-10 text-center px-4">
        <h1 className="font-syne font-extrabold text-[28px] text-wo-crema mb-3">Página no encontrada</h1>
        <p className="font-jakarta text-[15px] text-wo-crema-muted mb-8">La página que buscas no existe o fue movida.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/" className="bg-primary text-primary-foreground font-jakarta font-bold text-sm px-6 py-3 rounded-wo-btn hover:bg-wo-oro-dark transition-colors">Ir al inicio</Link>
          <Link to="/catalogo" className="font-jakarta font-bold text-sm text-wo-crema/80 px-6 py-3 rounded-wo-btn hover:text-wo-crema transition-colors" style={{ border: "0.5px solid rgba(248,244,236,0.2)" }}>Ver catálogo</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
