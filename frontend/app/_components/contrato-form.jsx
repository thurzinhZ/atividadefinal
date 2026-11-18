"use client";

import { useState } from "react";
import { useAuth } from "../auth-provider";
import { MIN_CONDICOES, lerValor, validarContrato } from "../../lib/regras";

export const FORMAS_PAGAMENTO = ["À vista", "Financiamento bancário", "Parcelado direto com o proprietário", "Mensal (aluguel)"];

// Corretor prepara (oferta) ou revisa (contrato reprovado) e envia para aprovação
export default function ContratoForm({ oferta, contrato, onSalvo, onCancelar }) {
  const { apiJson } = useAuth();
  const revisao = Boolean(contrato);
  const aluguel = String((contrato?.imovelFinalidade || oferta?.imovelFinalidade) || "").toUpperCase() === "ALUGUEL";
  const [dados, setDados] = useState({
    valor: String(contrato?.valor ?? oferta?.valor ?? ""),
    formaPagamento: contrato?.formaPagamento || (aluguel ? "Mensal (aluguel)" : "À vista"),
    condicoes: contrato?.condicoes || "",
  });
  const [erros, setErros] = useState({});
  const [erroApi, setErroApi] = useState("");
  const [enviando, setEnviando] = useState(false);
  const prefixo = `contrato-${contrato?.id ?? `oferta-${oferta?.id}`}`;

  function alterar(campo) {
    return (event) => setDados((atual) => ({ ...atual, [campo]: event.target.value }));
  }

  async function enviar(event) {
    event.preventDefault();
    const encontrados = validarContrato(dados);
    setErros(encontrados);
    setErroApi("");
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      const corpo = {
        ofertaId: oferta?.id ?? contrato?.ofertaId,
        valor: lerValor(dados.valor),
        formaPagamento: dados.formaPagamento,
        condicoes: dados.condicoes.trim(),
      };
      const salvo = revisao
        ? await apiJson(`/contratos/${contrato.id}`, { method: "PUT", body: corpo })
        : await apiJson("/contratos", { body: corpo });
      onSalvo(salvo);
    } catch (e) {
      setErroApi(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="form-inline-card" onSubmit={enviar} noValidate>
      <h4>{revisao ? "Revisar e reenviar contrato" : "Preparar contrato"}</h4>
      <div className="form-grid">
        <div>
          <label htmlFor={`${prefixo}-valor`}>Valor do contrato (R$)</label>
          <input id={`${prefixo}-valor`} inputMode="decimal" value={dados.valor} onChange={alterar("valor")} aria-invalid={Boolean(erros.valor)} />
          {erros.valor && <p className="campo-erro">{erros.valor}</p>}
        </div>
        <div>
          <label htmlFor={`${prefixo}-pagamento`}>Forma de pagamento</label>
          <select id={`${prefixo}-pagamento`} value={dados.formaPagamento} onChange={alterar("formaPagamento")}>
            {FORMAS_PAGAMENTO.map((forma) => <option key={forma}>{forma}</option>)}
          </select>
          {erros.formaPagamento && <p className="campo-erro">{erros.formaPagamento}</p>}
        </div>
      </div>
      <label htmlFor={`${prefixo}-condicoes`}>Condições e cláusulas</label>
      <textarea
        id={`${prefixo}-condicoes`}
        rows={4}
        placeholder="Prazo de entrega das chaves, multa, reajuste, responsabilidades..."
        value={dados.condicoes}
        onChange={alterar("condicoes")}
        aria-invalid={Boolean(erros.condicoes)}
      />
      <p className="campo-ajuda">{dados.condicoes.trim().length}/{MIN_CONDICOES} caracteres mínimos</p>
      {erros.condicoes && <p className="campo-erro">{erros.condicoes}</p>}
      {erroApi && <p className="form-error" role="alert">{erroApi}</p>}
      <div className="form-acoes">
        <button className="primary-button" type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar para aprovação"}
        </button>
        {onCancelar && <button className="secondary-button" type="button" onClick={onCancelar}>Cancelar</button>}
      </div>
    </form>
  );
}
