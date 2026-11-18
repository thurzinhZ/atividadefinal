"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../auth-provider";
import SiteHeader from "../site-header";
import { rotaInicial } from "../../lib/regras";

function LoginPageContent() {
  const { login, ready, session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && session) {
      router.replace(rotaInicial(session.tipo));
    }
  }, [ready, session, router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const authenticatedSession = await login(email.trim(), senha);
      router.replace(rotaInicial(authenticatedSession.tipo));
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <SiteHeader />
      <section className="auth-page">
        <div className="auth-card">
          <p className="eyebrow">BEM-VINDO DE VOLTA</p>
          <h1>Acesse sua conta</h1>
          <p className="auth-description">Entre para continuar sua experiência na Casa Clara.</p>
          {searchParams.get("expired") === "1" && (
            <p className="form-message" role="status">Sua sessão expirou. Entre novamente.</p>
          )}
          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              placeholder="Sua senha"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
            />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <details className="contas-teste">
            <summary>Contas de teste (senha 123)</summary>
            <ul>
              <li><strong>Cliente:</strong> user@email.com</li>
              <li><strong>Corretor:</strong> corretor@email.com</li>
              <li><strong>Administrador:</strong> admin@email.com</li>
            </ul>
          </details>
          <p className="auth-footer">Ainda não tem uma conta? <Link href="/#imoveis">Explore os imóveis</Link></p>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main><SiteHeader /><div className="protected-loading">Carregando...</div></main>}>
      <LoginPageContent />
    </Suspense>
  );
}
