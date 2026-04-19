import { Link } from "react-router-dom";

export default function Terminos() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="font-jakarta text-xs text-wo-crema-muted hover:text-primary">← Volver al inicio</Link>
        </div>

        <div className="mb-10">
          <p className="font-jakarta text-[10px] font-bold tracking-[0.16em] uppercase text-primary mb-3">LEGAL</p>
          <h1 className="font-syne font-extrabold text-[32px] text-wo-crema mb-2">Términos y Condiciones</h1>
          <p className="font-jakarta text-sm text-wo-crema-muted">Última actualización: 29 de marzo de 2026 · Versión 1.0</p>
        </div>

        <div className="space-y-8 font-jakarta text-sm text-wo-crema-muted leading-relaxed">
          {[
            {
              title: "1. Aceptación de los términos",
              body: "Al registrarte como socio afiliado de Winclick, aceptas quedar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no podrás participar en el programa de afiliados.",
            },
            {
              title: "2. Descripción del programa",
              body: "Winclick opera un programa de afiliados de marketing multinivel (MLM) que permite a sus socios ganar comisiones por ventas directas y por las ventas generadas por su red de afiliados referidos, hasta los niveles desbloqueados por su paquete de activación.",
            },
            {
              title: "3. Paquetes de activación",
              body: "Existen tres paquetes de activación definidos por la compra de volumen de productos: Básico (Meta de compras S/ 120, niveles 1-3), Intermedio (S/ 2,000, niveles 1-7) y VIP (S/ 10,000, niveles 1-10). Todos los paquetes requieren compras personales acumulables en el catálogo de productos por un valor estipulado (ej. S/ 300 mensuales) para mantener activo el derecho a percibir comisiones.",
            },
            {
              title: "4. Comisiones",
              body: "Las comisiones se calculan sobre las ventas de productos según la estructura de 10 niveles vigente. La empresa se reserva el derecho de modificar los porcentajes de comisión con un aviso previo de 30 días. Las comisiones acreditadas no se pierden por suspensión de cuenta.",
            },
            {
              title: "5. Suspensión y reactivación",
              body: "Si un afiliado no realiza las compras mínimas para su reactivación mensual, su cuenta pasa a estado 'suspendido'. Durante este período no genera nuevas comisiones, pero conserva las ya acreditadas en su billetera. La reactivación se produce orgánicamente una vez que el afiliado realiza compras de productos en la plataforma y se aprueba dicho pedido.",
            },
            {
              title: "6. Retiros",
              body: "Los afiliados pueden solicitar retiros de su saldo de billetera en cualquier momento. Los retiros mínimos son de S/ 20. El procesamiento puede tomar hasta 3 días hábiles. Winclick se reserva el derecho de verificar la legitimidad de las comisiones antes de aprobar retiros.",
            },
            {
              title: "7. Prohibiciones",
              body: "Está prohibido el registro múltiple bajo diferentes identidades, el uso de información falsa, la captación engañosa de referidos, o cualquier práctica que distorsione el funcionamiento normal de la red. El incumplimiento puede resultar en la suspensión permanente de la cuenta y la pérdida de comisiones pendientes.",
            },
            {
              title: "8. Limitación de responsabilidad",
              body: "Winclick no garantiza ingresos mínimos. Los resultados dependen del esfuerzo individual de cada afiliado. La empresa no es responsable por las declaraciones o promesas realizadas por afiliados a sus referidos.",
            },
            {
              title: "9. Modificaciones",
              body: "Winclick se reserva el derecho de modificar estos términos en cualquier momento. Las modificaciones entran en vigencia a los 30 días de su publicación en la plataforma. El uso continuado del servicio implica la aceptación de los nuevos términos.",
            },
            {
              title: "10. Ley aplicable",
              body: "Estos términos se rigen por las leyes de la República del Perú. Cualquier disputa será sometida a los tribunales competentes de la ciudad de Lima.",
            },
          ].map((section) => (
            <div key={section.title}>
              <h2 className="font-syne font-bold text-base text-wo-crema mb-2">{section.title}</h2>
              <p>{section.body}</p>
            </div>
          ))}

          <div className="rounded-wo-card p-5 mt-10" style={{ background: "rgba(232,116,26,0.04)", border: "0.5px solid rgba(232,116,26,0.15)" }}>
            <p className="font-jakarta text-xs text-wo-crema-muted">
              Para consultas sobre estos términos, contáctanos en <span className="text-primary">Winnersmax369@gmail.com</span> · Winclick S.A.C. · Lima, Perú
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
