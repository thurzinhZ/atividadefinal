"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../auth-provider";
import { STATUS_CONTRATO, acoesContrato, etapaContrato, formatarData, formatarMoeda, validarAssinatura } from "../../lib/regras";
import ContratoForm from "./contrato-form";
import LinhaDoTempo from "./linha-do-tempo";
import StatusBadge from "./status-badge";
import { useAcao } from "./use-acao";

function AssinaturaForm({ contrato, nomeCadastrado, onAssinado, onCancelar }) {
  const { apiJson } = useAuth();
  const [nomeAssinatura, setNome] = useState("");
  const [aceite, setAceite] = useState(false);
  const [erros, setErros] = useState({});
  const { executando, erro, executar } = useAcao();

  return (
    <form className="form-inline-card" noValidate onSubmit={(event) => {
      event.preventDefault();
      const encontrados = validarAssinatura({ nomeAssinatura, aceite }, nomeCadastrado);
      setErros(encontrados);
      if (Object.keys(encontrados).length) return;
      executar("assinar", async () => onAssinado(await apiJson(`/contratos/${contrato.id}/assinar`, {
        method: "PATCH",
        body: { nomeAssinatura: nomeAssinatura.trim(), aceite },
      })));
    }}>
      <h4>Assinatura eletrônica</h4>
      <label htmlFor={`assinatura-${contrato.id}`}>Digite seu nome completo, como cadastrado</label>
      <input
        id={`assinatura-${contrato.id}`}
        autoComplete="name"
        placeholder={nomeCadastrado || "Seu nome completo"}
        value={nomeAssinatura}
        onChange={(e) => setNome(e.target.value)}
        aria-invalid={Boolean(erros.nomeAssinatura)}
      />
      {erros.nomeAssinatura && <p className="campo-erro">{erros.nomeAssinatura}</p>}
      <label className="checkbox">
        <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
        <span>Li e concordo com as condições do contrato no valor de {formatarMoeda(contrato.valor)}.</span>
      </label>
      {erros.aceite && <p className="campo-erro">{erros.aceite}</p>}
      {erro && <p className="form-error" role="alert">{erro}</p>}
      <div className="form-acoes">
        <button className="primary-button" type="submit" disabled={Boolean(executando)}>
          {executando ? "Assinando..." : "Assinar contrato"}
        </button>
        <button className="secondary-button" type="button" onClick={onCancelar}>Voltar</button>
      </div>
    </form>
  );
}

// Cartão de contrato. Ações por perfil: ADMIN aprova/reprova, CORRETOR revisa, USER assina.
export function ContratoCard({ contrato, perfil, nomeUsuario, onAtualizado }) {
  const { apiJson } = useAuth();
  const { executando, erro, executar } = useAcao();
  const [modo, setModo] = useState(null); // "reprovar" | "revisar" | "assinar"
  const [motivo, setMotivo] = useState("");
  const [erroMotivo, setErroMotivo] = useState("");
  const acoes = acoesContrato(perfil, contrato);

  const concluir = (atualizado) => {
    setModo(null);
    onAtualizado(atualizado);
  };

  return (
    <article className="item-card" aria-labelledby={`contrato-${contrato.id}-titulo`}>
      <header className="item-card-topo">
        <div>
          <p className="item-card-sub">Contrato #{contrato.id} · oferta #{contrato.ofertaId} · enviado {formatarData(contrato.enviadoEm)}</p>
          <h3 id={`contrato-${contrato.id}-titulo`}>
            <Link href={`/imoveis/${contrato.imovelId}`}>{contrato.imovelTitulo || `Imóvel ${contrato.imovelId}`}</Link>
          </h3>
        </div>
        <StatusBadge mapa={STATUS_CONTRATO} status={contrato.status} />
      </header>

      <LinhaDoTempo etapa={etapaContrato(contrato.status)} reprovado={contrato.status === "REPROVADO"} />

      <dl className="item-card-dados">
        <div><dt>Valor</dt><dd>{formatarMoeda(contrato.valor)}</dd></div>
        <div><dt>Pagamento</dt><dd>{contrato.formaPagamento || "—"}</dd></div>
        <div><dt>Cliente</dt><dd>{contrato.clienteNome}</dd></div>
        <div><dt>Corretor</dt><dd>{contrato.corretorNome}</dd></div>
        {contrato.avaliadoPorNome && <div><dt>Avaliado por</dt><dd>{contrato.avaliadoPorNome} em {formatarData(contrato.avaliadoEm)}</dd></div>}
      </dl>
      <details className="contrato-condicoes" open={acoes.assinar || acoes.aprovar}>
        <summary>Condições do contrato</summary>
        <p>{contrato.condicoes}</p>
      </details>

      {contrato.status === "REPROVADO" && contrato.motivoReprovacao && (
        <p className="item-card-resposta erro"><strong>Motivo da reprovação:</strong> {contrato.motivoReprovacao}</p>
      )}
      {contrato.status === "ASSINADO" && (
        <p className="item-card-resposta sucesso">
          Assinado por <strong>{contrato.assinaturaNome}</strong> em {formatarData(contrato.assinadoEm)}.<br />
          <span className="codigo">Código de verificação: {contrato.assinaturaCodigo}</span>
        </p>
      )}

      {!modo && (acoes.aprovar || acoes.revisar || acoes.assinar) && (
        <div className="item-card-acoes">
          {acoes.aprovar && (
            <button className="primary-button" type="button" disabled={Boolean(executando)}
              onClick={() => executar("aprovar", async () => concluir(await apiJson(`/contratos/${contrato.id}/aprovar`, { method: "PATCH" })))}>
              {executando === "aprovar" ? "Aprovando..." : "Aprovar contrato"}
            </button>
          )}
          {acoes.reprovar && <button className="secondary-button perigo" type="button" onClick={() => setModo("reprovar")}>Reprovar</button>}
          {acoes.revisar && <button className="primary-button" type="button" onClick={() => setModo("revisar")}>Revisar e reenviar</button>}
          {acoes.assinar && <button className="primary-button" type="button" onClick={() => setModo("assinar")}>Assinar contrato</button>}
        </div>
      )}

      {modo === "reprovar" && (
        <form className="form-inline-card" noValidate onSubmit={(event) => {
          event.preventDefault();
          if (!motivo.trim()) {
            setErroMotivo("Informe o motivo para o corretor poder corrigir.");
            return;
          }
          setErroMotivo("");
          executar("reprovar", async () => concluir(await apiJson(`/contratos/${contrato.id}/reprovar`, { method: "PATCH", body: { motivo: motivo.trim() } })));
        }}>
          <label htmlFor={`motivo-contrato-${contrato.id}`}>Motivo da reprovação</label>
          <textarea id={`motivo-contrato-${contrato.id}`} rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} aria-invalid={Boolean(erroMotivo)} />
          {erroMotivo && <p className="campo-erro">{erroMotivo}</p>}
          <div className="form-acoes">
            <button className="primary-button perigo" type="submit" disabled={Boolean(executando)}>
              {executando === "reprovar" ? "Reprovando..." : "Confirmar reprovação"}
            </button>
            <button className="secondary-button" type="button" onClick={() => setModo(null)}>Voltar</button>
          </div>
        </form>
      )}
      {modo === "revisar" && <ContratoForm contrato={contrato} onSalvo={concluir} onCancelar={() => setModo(null)} />}
      {modo === "assinar" && (
        <AssinaturaForm contrato={contrato} nomeCadastrado={nomeUsuario} onAssinado={concluir} onCancelar={() => setModo(null)} />
      )}
      {erro && <p className="form-error" role="alert">{erro}</p>}
    </article>
  );
}

export function ListaContratos({ contratos, perfil, nomeUsuario, onAtualizado }) {
  return (
    <div className="item-lista">
      {contratos.map((contrato) => (
        <ContratoCard key={contrato.id} contrato={contrato} perfil={perfil} nomeUsuario={nomeUsuario} onAtualizado={onAtualizado} />
      ))}
    </div>
  );
}
