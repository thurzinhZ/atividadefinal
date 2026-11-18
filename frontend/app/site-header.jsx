"use client";

import Link from "next/link";
import { useAuth } from "./auth-provider";
import { ROTULO_PERFIL, rotaInicial } from "../lib/regras";

const ROTULO_AREA = { ADMIN: "Painel", CORRETOR: "Área do corretor", USER: "Minha área" };

export default function SiteHeader() {
  const { session, ready, logout } = useAuth();

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Casa Clara, início">
        <span className="brand-symbol" aria-hidden="true">c</span>
        <span>casa clara</span>
      </Link>
      <nav className="header-nav" aria-label="Navegação principal">
        <Link href="/">Início</Link>
        <Link href="/#imoveis">Imóveis</Link>
        {ready && session && <Link href={rotaInicial(session.tipo)}>{ROTULO_AREA[session.tipo]}</Link>}
        {ready && session && <Link href="/perfil">Meu perfil</Link>}
      </nav>
      {ready && session ? (
        <div className="header-account">
          <span className="header-user">
            <span className="header-perfil">{ROTULO_PERFIL[session.tipo]}</span> {session.email}
          </span>
          <button className="header-action" type="button" onClick={() => logout()}>
            Sair <span aria-hidden="true">↗</span>
          </button>
        </div>
      ) : (
        <Link className="header-action" href="/login">
          Entrar <span aria-hidden="true">↗</span>
        </Link>
      )}
    </header>
  );
}
