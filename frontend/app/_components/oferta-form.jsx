"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../auth-provider";
import { MAX_MENSAGEM, formatarMoeda, imovelDisponivel, lerValor, validarOferta } from "../../lib/regras";
import { Mensagem } from "./estados";

// Formulário de oferta na página do imóvel (perfil USER)
export default function OfertaForm({ imovel, precoAnunciado }) {
  const { session, ready, apiJson } = useAuth();
  const [valor, setValor] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erros, setErros] = useState({});
  const [erroApi, setErroApi] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(null);

  if (!ready) return null;

  if (!imovelDisponivel(imovel.status)) {
    return <p className="oferta-aviso">Este imóvel não está recebendo ofertas no momento.</p>;
  }
  if (!session) {
    return (
      <p className="oferta-aviso">
        <Link className="text-link" href="/login">Entre na sua conta</Link> para fazer uma oferta por este imóvel.
      </p>
    );
  }
  if (session.tipo !== "USER") {
    return <p className="oferta-aviso">Ofertas são enviadas pelos clientes. Seu perfil acompanha as ofertas pelo painel.</p>;
  }
  if (enviada) {
    return (
      <div className="oferta-box">
        <Mensagem>Oferta de {formatarMoeda(enviada.valor)} enviada! Um corretor vai analisar e responder.</Mensagem>
        <Link className="text-link" href="/area-cliente?aba=ofertas">Acompanhar minhas ofertas →</Link>
      </div>
    );
  }

  async function enviar(event) {
    event.preventDefault();
    const encontrados = validarOferta({ valor, mensagem });
    setErros(encontrados);
    setErroApi("");
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      const oferta = await apiJson("/ofertas", {
        body: { imovelId: imovel.id, valor: lerValor(valor), mensagem: mensagem.trim() || null },
      });
      setEnviada(oferta);
    } catch (e) {
      setErroApi(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="oferta-box" onSubmit={enviar} noValidate>
      <h2>Fazer uma oferta</h2>
      {precoAnunciado != null && <p className="oferta-ajuda">Valor anunciado: {formatarMoeda(precoAnunciado)}</p>}
      <label htmlFor="oferta-valor">Sua proposta (R$)</label>
      <input
        id="oferta-valor"
        inputMode="decimal"
        placeholder="Ex.: 340.000"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        aria-invalid={Boolean(erros.valor)}
        aria-describedby={erros.valor ? "oferta-valor-erro" : undefined}
      />
      {erros.valor && <p className="campo-erro" id="oferta-valor-erro">{erros.valor}</p>}
      <label htmlFor="oferta-mensagem">Mensagem para o corretor (opcional)</label>
      <textarea
        id="oferta-mensagem"
        rows={3}
        maxLength={MAX_MENSAGEM}
        placeholder="Forma de pagamento, prazo para mudança..."
        value={mensagem}
        onChange={(e) => setMensagem(e.target.value)}
      />
      {erros.mensagem && <p className="campo-erro">{erros.mensagem}</p>}
      {erroApi && <p className="form-error" role="alert">{erroApi}</p>}
      <button className="primary-button" type="submit" disabled={enviando}>
        {enviando ? "Enviando..." : "Enviar oferta"}
      </button>
    </form>
  );
}
