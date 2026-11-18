"use client";

import { useCallback, useState } from "react";

// Controla o estado de um botão de ação: executando, erro e sucesso
export function useAcao() {
  const [executando, setExecutando] = useState(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const executar = useCallback(async (chave, fn, mensagemSucesso) => {
    setExecutando(chave);
    setErro("");
    setSucesso("");
    try {
      const resultado = await fn();
      if (mensagemSucesso) setSucesso(mensagemSucesso);
      return resultado;
    } catch (e) {
      setErro(e?.message || "Não foi possível concluir a operação.");
      return undefined;
    } finally {
      setExecutando(null);
    }
  }, []);

  return { executando, erro, sucesso, executar, limpar: () => { setErro(""); setSucesso(""); } };
}
