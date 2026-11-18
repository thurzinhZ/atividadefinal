"use client";

import { BotaoFavorito, useFavoritos } from "./favoritos";

// Botão de favorito da página de detalhes (aparece só para clientes)
export default function ImovelFavorito({ imovelId, titulo }) {
  const { ativo, ids, alternar, erro } = useFavoritos();
  if (!ativo) return null;
  return (
    <div className="detalhe-favorito">
      <BotaoFavorito grande favorito={ids.has(imovelId)} titulo={titulo} onClick={() => alternar(imovelId)} />
      {erro && <p className="campo-erro" role="alert">{erro}</p>}
    </div>
  );
}
