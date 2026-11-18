"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import SiteHeader from "./site-header";
import { rotaInicial } from "../lib/regras";

// requiredRole: um perfil ("ADMIN") ou uma lista (["USER", "CORRETOR"])
export default function ProtectedArea({ requiredRole, children }) {
  const { session, ready } = useAuth();
  const router = useRouter();
  const perfis = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const permitido = Boolean(session && perfis.includes(session.tipo));

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!permitido) router.replace(rotaInicial(session.tipo));
  }, [ready, router, session, permitido]);

  if (!ready || !permitido) {
    return (
      <main>
        <SiteHeader />
        <div className="protected-loading" role="status">Verificando seu acesso...</div>
      </main>
    );
  }

  return <main><SiteHeader />{children}</main>;
}
