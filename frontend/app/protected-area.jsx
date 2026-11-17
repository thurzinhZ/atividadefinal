"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import SiteHeader from "./site-header";

export default function ProtectedArea({ requiredRole, children }) {
  const { session, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.tipo !== requiredRole) {
      router.replace(session.tipo === "ADMIN" ? "/painel" : "/area-cliente");
    }
  }, [ready, requiredRole, router, session]);

  if (!ready || !session || session.tipo !== requiredRole) {
    return (
      <main>
        <SiteHeader />
        <div className="protected-loading" role="status">Verificando seu acesso...</div>
      </main>
    );
  }

  return <main><SiteHeader />{children}</main>;
}
