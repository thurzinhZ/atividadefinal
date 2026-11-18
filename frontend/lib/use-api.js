"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Carrega um recurso e expõe os três estados da tela: carregando, erro e dados.
// `carregar` recebe um AbortSignal e devolve uma Promise com os dados.
// Passe `null` em `chave` para não carregar (ex.: usuário ainda não logado).
export function useRecurso(carregar, chave) {
  const [estado, setEstado] = useState({ data: null, loading: chave != null, error: "" });
  const [versao, setVersao] = useState(0);
  const carregarRef = useRef(carregar);
  carregarRef.current = carregar;

  useEffect(() => {
    if (chave == null) return undefined;
    const controller = new AbortController();
    setEstado((atual) => ({ ...atual, loading: true, error: "" }));
    Promise.resolve()
      .then(() => carregarRef.current(controller.signal))
      .then((data) => {
        if (!controller.signal.aborted) setEstado({ data, loading: false, error: "" });
      })
      .catch((erro) => {
        if (controller.signal.aborted || erro?.name === "AbortError") return;
        setEstado((atual) => ({ ...atual, loading: false, error: erro?.message || "Não foi possível carregar os dados." }));
      });
    return () => controller.abort();
  }, [chave, versao]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);
  // permite atualizar a lista localmente depois de uma ação, sem recarregar tudo
  const atualizar = useCallback((fn) => setEstado((atual) => ({ ...atual, data: fn(atual.data) })), []);

  return { ...estado, recarregar, atualizar };
}
