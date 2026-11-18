"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../auth-provider";
import { STATUS_OFERTA, acoesOferta, formatarData, formatarMoeda } from "../../lib/regras";
import ContratoForm from "./contrato-form";
import StatusBadge from "./status-badge";
import { useAcao } from "./use-acao";

// Cartão de oferta. As ações exibidas dependem do perfil (lib/regras.acoesOferta).
export function OfertaCard({ oferta, perfil, onAtualizada, onContratoCriado }) {
  const { apiJson } = useAuth();
  const { executando, erro, executar } = useAcao();
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [preparando, setPreparando] = useState(false);
  const acoes = acoesOferta(perfil, oferta);

  const patch = (acao, corpo) => apiJson(`/ofertas/${oferta.id}/${acao}`, { method: "PATCH", body: corpo });

  return (
    <article className="item-card" aria-labelledby={`oferta-${oferta.id}-titulo`}>
      <header className="item-card-topo">
        <div>
          <p className="item-card-sub">Oferta #{oferta.id} · {formatarData(oferta.criadaEm)}</p>
          <h3 id={`oferta-${oferta.id}-titulo`}>
            <Link href={`/imoveis/${oferta.imovelId}`}>{oferta.imovelTitulo || `Imóvel ${oferta.imovelId}`}</Link>
          </h3>
        </div>
        <StatusBadge mapa={STATUS_OFERTA} status={oferta.status} />
      </header>
      <dl className="item-card-dados">
        <div><dt>Valor proposto</dt><dd>{formatarMoeda(oferta.valor)}</dd></div>
        {perfil !== "USER" && <div><dt>Cliente</dt><dd>{oferta.clienteNome} <span className="muted">({oferta.clienteEmail})</span></dd></div>}
        {oferta.corretorNome && <div><dt>Corretor</dt><dd>{oferta.corretorNome}</dd></div>}
        {oferta.respondidaEm && <div><dt>Respondida em</dt><dd>{formatarData(oferta.respondidaEm)}</dd></div>}
      </dl>
      {oferta.mensagem && <p className="item-card-texto">“{oferta.mensagem}”</p>}
      {oferta.resposta && <p className="item-card-resposta"><strong>Resposta:</strong> {oferta.resposta}</p>}
      {oferta.contratoId && perfil !== "ADMIN" && (
        <p className="item-card-texto">
          Contrato #{oferta.contratoId} gerado. <Link className="text-link" href={`${perfil === "USER" ? "/area-cliente" : "/corretor"}?aba=contratos`}>Ver contrato →</Link>
        </p>
      )}

      {(acoes.aceitar || acoes.cancelar || acoes.prepararContrato) && !recusando && !preparando && (
        <div className="item-card-acoes">
          {acoes.aceitar && (
            <button className="primary-button" type="button" disabled={Boolean(executando)}
              onClick={() => executar("aceitar", async () => onAtualizada(await patch("aceitar")))}>
              {executando === "aceitar" ? "Aceitando..." : "Aceitar oferta"}
            </button>
          )}
          {acoes.recusar && (
            <button className="secondary-button" type="button" disabled={Boolean(executando)} onClick={() => setRecusando(true)}>
              Recusar
            </button>
          )}
          {acoes.cancelar && (
            <button className="secondary-button perigo" type="button" disabled={Boolean(executando)}
              onClick={() => executar("cancelar", async () => onAtualizada(await patch("cancelar")))}>
              {executando === "cancelar" ? "Cancelando..." : "Cancelar oferta"}
            </button>
          )}
          {acoes.prepararContrato && (
            <button className="primary-button" type="button" onClick={() => setPreparando(true)}>Preparar contrato</button>
          )}
        </div>
      )}

      {recusando && (
        <form className="form-inline-card" onSubmit={(event) => {
          event.preventDefault();
          executar("recusar", async () => {
            onAtualizada(await patch("recusar", { motivo: motivo.trim() || null }));
            setRecusando(false);
          });
        }}>
          <label htmlFor={`motivo-oferta-${oferta.id}`}>Motivo da recusa (opcional)</label>
          <textarea id={`motivo-oferta-${oferta.id}`} rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <div className="form-acoes">
            <button className="primary-button perigo" type="submit" disabled={Boolean(executando)}>
              {executando === "recusar" ? "Recusando..." : "Confirmar recusa"}
            </button>
            <button className="secondary-button" type="button" onClick={() => setRecusando(false)}>Voltar</button>
          </div>
        </form>
      )}

      {preparando && (
        <ContratoForm
          oferta={oferta}
          onCancelar={() => setPreparando(false)}
          onSalvo={(contrato) => {
            setPreparando(false);
            onAtualizada({ ...oferta, contratoId: contrato.id });
            onContratoCriado?.(contrato);
          }}
        />
      )}
      {erro && <p className="form-error" role="alert">{erro}</p>}
    </article>
  );
}

export function ListaOfertas({ ofertas, perfil, onAtualizada, onContratoCriado }) {
  return (
    <div className="item-lista">
      {ofertas.map((oferta) => (
        <OfertaCard key={oferta.id} oferta={oferta} perfil={perfil} onAtualizada={onAtualizada} onContratoCriado={onContratoCriado} />
      ))}
    </div>
  );
}
