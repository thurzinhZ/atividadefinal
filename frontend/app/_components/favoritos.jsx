"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth-provider";

// Carrega os ids favoritados do cliente logado e alterna favoritos com atualização otimista
export function useFavoritos() {
  const { session, ready, apiJson } = useAuth();
  const ativo = ready && session?.tipo === "USER";
  const [ids, setIds] = useState(() => new Set());
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!ativo) {
      setIds(new Set());
      return undefined;
    }
    const controller = new AbortController();
    apiJson("/favoritos/ids", { signal: controller.signal })
      .then((lista) => setIds(new Set(Array.isArray(lista) ? lista : [])))
      .catch((e) => {
        if (e?.name !== "AbortError") setErro(e.message);
      });
    return () => controller.abort();
  }, [ativo, apiJson]);

  const alternar = useCallback(async (imovelId) => {
    const eraFavorito = ids.has(imovelId);
    setErro("");
    setIds((atual) => {
      const novo = new Set(atual);
      if (eraFavorito) novo.delete(imovelId);
      else novo.add(imovelId);
      return novo;
    });
    try {
      await apiJson(`/favoritos/${imovelId}`, { method: eraFavorito ? "DELETE" : "POST" });
    } catch (e) {
      // desfaz a mudança otimista
      setIds((atual) => {
        const novo = new Set(atual);
        if (eraFavorito) novo.add(imovelId);
        else novo.delete(imovelId);
        return novo;
      });
      setErro(e.message);
    }
  }, [apiJson, ids]);

  return { ativo, ids, alternar, erro };
}

export function BotaoFavorito({ favorito, onClick, titulo, grande = false }) {
  const rotulo = favorito ? `Remover ${titulo} dos favoritos` : `Favoritar ${titulo}`;
  return (
    <button
      type="button"
      className={`botao-favorito${favorito ? " ativo" : ""}${grande ? " grande" : ""}`}
      aria-pressed={favorito}
      aria-label={rotulo}
      title={rotulo}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
    >
      <span aria-hidden="true">{favorito ? "♥" : "♡"}</span>
      {grande && <span>{favorito ? "Favoritado" : "Favoritar"}</span>}
    </button>
  );
}
