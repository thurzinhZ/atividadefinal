"use client";

import Link from "next/link";
import ProtectedArea from "../protected-area";
import { useAuth } from "../auth-provider";

function ClientDashboard() {
  const { session } = useAuth();
  return (
    <ProtectedArea requiredRole="USER">
      <section className="dashboard">
        <p className="eyebrow">ÁREA DO CLIENTE</p>
        <h1>Olá, {session?.email}</h1>
        <p className="dashboard-copy">Encontre um espaço com a sua cara e fale com a nossa equipe para saber mais.</p>
        <Link className="primary-button dashboard-link" href="/#imoveis">Explorar imóveis</Link>
      </section>
    </ProtectedArea>
  );
}

export default function ClientAreaPage() {
  return <ClientDashboard />;
}
