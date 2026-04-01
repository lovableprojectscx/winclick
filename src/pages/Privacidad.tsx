import { Link } from "react-router-dom";

export default function Privacidad() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="font-jakarta text-xs text-wo-crema-muted hover:text-primary">← Volver al inicio</Link>
        </div>

        <div className="mb-10">
          <p className="font-jakarta text-[10px] font-bold tracking-[0.16em] uppercase text-primary mb-3">LEGAL</p>
          <h1 className="font-syne font-extrabold text-[32px] text-wo-crema mb-2">Política de Privacidad</h1>
          <p className="font-jakarta text-sm text-wo-crema-muted">Última actualización: 29 de marzo de 2026 · Versión 1.0</p>
        </div>

        <div className="space-y-8 font-jakarta text-sm text-wo-crema-muted leading-relaxed">
          {[
            {
              title: "1. Responsable del tratamiento",
              body: "Winner Organa S.A.C. (RUC: 20XXXXXXXXX), con domicilio en Lima, Perú, es el responsable del tratamiento de los datos personales recopilados a través de esta plataforma.",
            },
            {
              title: "2. Datos que recopilamos",
              body: "Recopilamos nombre completo, DNI, correo electrónico, número de teléfono (Yape/Plin), dirección de envío, historial de compras y transacciones, e información de comprobantes de pago. No almacenamos información de tarjetas de crédito.",
            },
            {
              title: "3. Finalidad del tratamiento",
              body: "Los datos se utilizan para: gestionar el registro y cuenta del afiliado, procesar pedidos y pagos, calcular y acreditar comisiones, comunicar novedades del programa, y cumplir obligaciones legales y tributarias.",
            },
            {
              title: "4. Almacenamiento de sesiones",
              body: "Los tokens de sesión se almacenan de forma segura y expiran automáticamente. No compartimos tokens de sesión con terceros ni los almacenamos en texto plano.",
            },
            {
              title: "5. Compartición de datos",
              body: "No vendemos ni cedemos datos personales a terceros con fines comerciales. Los datos pueden ser compartidos con proveedores de servicios de pago y logística únicamente en la medida necesaria para procesar transacciones.",
            },
            {
              title: "6. Derechos del titular",
              body: "Tienes derecho a acceder, rectificar, cancelar u oponerte al tratamiento de tus datos personales. Para ejercer estos derechos, envía una solicitud a privacidad@winnerorgana.com con tu nombre, código de afiliado y el derecho que deseas ejercer.",
            },
            {
              title: "7. Conservación de datos",
              body: "Los datos se conservan durante el tiempo que la cuenta esté activa y por un período adicional de 5 años para cumplir obligaciones legales y tributarias.",
            },
            {
              title: "8. Seguridad",
              body: "Implementamos medidas técnicas y organizativas para proteger tus datos contra acceso no autorizado, pérdida o destrucción. Sin embargo, ningún sistema es completamente seguro y no podemos garantizar la seguridad absoluta.",
            },
            {
              title: "9. Cookies",
              body: "Usamos cookies de sesión esenciales para el funcionamiento de la plataforma. No usamos cookies de rastreo de terceros ni publicidad comportamental.",
            },
            {
              title: "10. Cambios a esta política",
              body: "Notificaremos cualquier cambio significativo a esta política mediante correo electrónico o un aviso prominente en la plataforma con al menos 15 días de antelación.",
            },
          ].map((section) => (
            <div key={section.title}>
              <h2 className="font-syne font-bold text-base text-wo-crema mb-2">{section.title}</h2>
              <p>{section.body}</p>
            </div>
          ))}

          <div className="rounded-wo-card p-5 mt-10" style={{ background: "rgba(242,201,76,0.04)", border: "0.5px solid rgba(242,201,76,0.15)" }}>
            <p className="font-jakarta text-xs text-wo-crema-muted">
              Consultas sobre privacidad: <span className="text-primary">privacidad@winnerorgana.com</span> · Winner Organa S.A.C. · Lima, Perú
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
