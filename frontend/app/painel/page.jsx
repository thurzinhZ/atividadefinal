"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProtectedArea from "../protected-area";
import { useAuth } from "../auth-provider";

function AdminDashboard() {
  const { session, apiFetch } = useAuth();
  const [userCount, setUserCount] = useState(null);
  const [userError, setUserError] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch("/users")
      .then(async (response) => {
        if (!response.ok) throw new Error(`A API respondeu com o erro ${response.status}.`);
        const users = await response.json();
        if (!Array.isArray(users)) throw new Error("A resposta da API não contém uma lista de usuários.");
        if (active) setUserCount(users.length);
      })
      .catch((error) => {
        if (active) setUserError(error.message || "Não foi possível carregar os usuários.");
      });

    return () => {
      active = false;
    };
  }, [apiFetch]);

  return (
    <ProtectedArea requiredRole="ADMIN">
      <section className="dashboard">
        <p className="eyebrow">PAINEL ADMINISTRATIVO</p>
        <h1>Olá, administrador</h1>
        <p className="dashboard-copy">Acesso administrativo autenticado para {session?.email}.</p>
        <div className="dashboard-actions">
          <Link className="primary-button dashboard-link" href="/#imoveis">Ver vitrine de imóveis</Link>
          <p aria-live="polite">
            {userError || (userCount === null ? "Carregando usuários..." : `${userCount} usuários cadastrados.`)}
          </p>
          <p>As operações administrativas continuam protegidas pelas permissões da API.</p>
        </div>
      </section>
    </ProtectedArea>
  );
}

export default function AdminPanelPage() {
  return <AdminDashboard />;
}
