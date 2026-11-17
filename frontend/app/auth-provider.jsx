"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "casa-clara-session";

function getTokenExpiration(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(window.atob(base64));
    return typeof claims.exp === "number" ? claims.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

function isExpired(token) {
  const expiration = getTokenExpiration(token);
  return expiration <= Date.now();
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback((redirect = true, expired = false) => {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
    if (redirect) window.location.replace(expired ? "/login?expired=1" : "/login");
  }, []);

  useEffect(() => {
    const storedSession = window.sessionStorage.getItem(STORAGE_KEY);
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        if (typeof parsedSession.token === "string" && !isExpired(parsedSession.token)) {
          setSession(parsedSession);
        } else {
          window.sessionStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!session?.token) return undefined;
    const expiration = getTokenExpiration(session.token);
    if (expiration === null) return undefined;

    let timeout;
    const checkExpiration = () => {
      const remaining = expiration - Date.now();
      if (remaining <= 0) {
        logout(true, true);
        return;
      }
      timeout = window.setTimeout(checkExpiration, Math.min(remaining, 2_147_000_000));
    };
    checkExpiration();
    return () => window.clearTimeout(timeout);
  }, [session, logout]);

  const login = useCallback(async (email, senha) => {
    let response;
    try {
      response = await fetch("/backend-api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
    } catch {
      throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
    }

    if (response.status === 401) throw new Error("E-mail ou senha incorretos.");
    if (!response.ok) throw new Error("O servidor não conseguiu concluir o login. Tente novamente.");

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("O servidor retornou uma resposta inválida. Tente novamente.");
    }
    if (typeof data.token !== "string" || !data.token) {
      throw new Error("O servidor não retornou um token de acesso válido.");
    }

    const nextSession = {
      token: data.token,
      email: data.email || email,
      tipo: String(data.tipo || "").replace(/^ROLE_/, "").toUpperCase(),
    };
    if (!["ADMIN", "USER"].includes(nextSession.tipo)) {
      throw new Error("O servidor retornou um perfil de acesso inválido.");
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    return nextSession;
  }, []);

  const apiFetch = useCallback(async (path, options = {}) => {
    if (!session?.token) {
      logout();
      throw new Error("Sua sessão terminou. Entre novamente.");
    }

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${session.token}`);
    const response = await fetch(`/backend-api${path}`, { ...options, headers });
    if (response.status === 401) {
      logout(true, true);
      throw new Error("Sua sessão expirou. Entre novamente.");
    }
    if (response.status === 403) throw new Error("Seu perfil não tem permissão para esta ação.");
    return response;
  }, [logout, session]);

  const value = useMemo(
    () => ({ session, ready, login, logout, apiFetch }),
    [session, ready, login, logout, apiFetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa ser usado dentro de AuthProvider.");
  return context;
}
