"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buscarPublico } from "../lib/api";
import { useRecurso } from "../lib/use-api";
import {
  FILTROS_PADRAO,
  STATUS_IMOVEL,
  formatarMoeda,
  imovelDisponivel,
  montarBusca,
  precoDoImovel,
  statusImovel,
  validarFaixaPreco,
} from "../lib/regras";
import { BotaoFavorito, useFavoritos } from "./_components/favoritos";
import StatusBadge from "./_components/status-badge";

const TAMANHO_PAGINA = 6;

const photos = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1100&q=85",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=85",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1100&q=85",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1100&q=85",
];

export function fotoDoImovel(property) {
  return photos[Math.abs(Number(property.id) || 0) % photos.length];
}

function getLocation(property) {
  const neighborhood = property.bairro?.nome;
  const city = property.bairro?.cidade;
  const state = property.bairro?.estado;
  const address = [neighborhood, [city, state].filter(Boolean).join(" / ")]
    .filter(Boolean)
    .join(" · ");

  return address || [property.endereco, property.numero].filter(Boolean).join(", ") || "Localização não informada";
}

export function PropertyCard({ property, favorito, onFavoritar }) {
  const purpose = property.finalidade?.toUpperCase();
  const price = precoDoImovel(property);
  const details = [
    property.dormitorios != null && `${property.dormitorios} quartos`,
    property.banheiros != null && `${property.banheiros} banheiros`,
    property.areaTotal != null && `${Number(property.areaTotal).toLocaleString("pt-BR")} m²`,
  ].filter(Boolean);
  const titulo = property.titulo || property.tipoImovel?.nome || "Imóvel";

  return (
    <article className="property-card">
      <Link className="property-card-link" href={`/imoveis/${property.id}`}>
        <div className="property-photo">
          <img src={fotoDoImovel(property)} alt={titulo} loading="lazy" />
          <span className="property-purpose">{purpose === "ALUGUEL" ? "Para alugar" : "À venda"}</span>
          {!imovelDisponivel(property.status) ? (
            <span className="property-status"><StatusBadge mapa={STATUS_IMOVEL} status={statusImovel(property.status)} /></span>
          ) : property.destaque && <span className="property-featured">Destaque</span>}
        </div>
        <div className="property-content">
          <p className="property-location">{getLocation(property)}</p>
          <h3>{titulo}</h3>
          <div className="property-details">
            {details.length > 0 ? details.map((detail) => <span key={detail}>{detail}</span>) : <span>Detalhes sob consulta</span>}
          </div>
          <div className="property-price-row">
            <strong>{formatarMoeda(price)}</strong>
            <span className="price-period">{purpose === "ALUGUEL" ? "/ mês" : ""}</span>
          </div>
          <span className="property-more">Ver detalhes <span aria-hidden="true">↗</span></span>
        </div>
      </Link>
      {onFavoritar && <BotaoFavorito favorito={favorito} titulo={titulo} onClick={onFavoritar} />}
    </article>
  );
}

function SkeletonCards() {
  return (
    <div className="property-grid" aria-hidden="true">
      {Array.from({ length: TAMANHO_PAGINA }, (_, i) => (
        <div className="property-card skeleton-card" key={i}>
          <div className="property-photo" />
          <div className="property-content"><span className="skeleton-linha" /><span className="skeleton-linha curta" /></div>
        </div>
      ))}
    </div>
  );
}

function useOpcoes(path) {
  const [opcoes, setOpcoes] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    buscarPublico(path, { signal: controller.signal })
      .then((lista) => setOpcoes(Array.isArray(lista) ? lista : []))
      .catch(() => setOpcoes([])); // sem as opções o filtro apenas fica oculto
    return () => controller.abort();
  }, [path]);
  return opcoes;
}

export default function PropertyGrid() {
  const [filtros, setFiltros] = useState(FILTROS_PADRAO);
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(0);
  const [maisFiltros, setMaisFiltros] = useState(false);
  const tipos = useOpcoes("/tipos-imoveis");
  const bairros = useOpcoes("/bairros");
  const favoritos = useFavoritos();

  // espera o usuário parar de digitar antes de buscar
  useEffect(() => {
    const timer = setTimeout(() => {
      setFiltros((atual) => (atual.q === busca ? atual : { ...atual, q: busca }));
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [busca]);

  const erroFaixa = validarFaixaPreco(filtros);
  const query = erroFaixa ? null : montarBusca(filtros, page, TAMANHO_PAGINA);
  const resultado = useRecurso((signal) => buscarPublico(`/imoveis/busca?${query}`, { signal }), query);

  function alterar(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
    setPage(0);
  }

  function limpar() {
    setBusca("");
    setFiltros(FILTROS_PADRAO);
    setPage(0);
  }

  const pagina = resultado.data;
  const imoveis = pagina?.content || [];
  const totalPaginas = Math.max(1, pagina?.totalPages || 1);
  const filtrosAtivos = JSON.stringify({ ...filtros, q: busca }) !== JSON.stringify(FILTROS_PADRAO);

  return (
    <>
      <div className="catalog-heading">
        <div>
          <p className="eyebrow">SELEÇÃO CASA CLARA</p>
          <h2 id="catalog-title">Imóveis disponíveis</h2>
        </div>
        <span className="catalog-count" aria-live="polite">
          {pagina ? `${String(pagina.totalElements).padStart(2, "0")} anúncios` : ""}
        </span>
      </div>

      <div className="listing-controls">
        <label className="search-box">
          <span className="search-icon" aria-hidden="true" />
          <span className="visually-hidden">Buscar por cidade, bairro ou imóvel</span>
          <input type="search" placeholder="Cidade, bairro ou imóvel" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
        <div className="purpose-filter" role="group" aria-label="Filtrar por finalidade">
          {[["TODOS", "Todos"], ["VENDA", "Comprar"], ["ALUGUEL", "Alugar"]].map(([value, label]) => (
            <button
              className={filtros.finalidade === value ? "filter-button active" : "filter-button"}
              key={value}
              type="button"
              aria-pressed={filtros.finalidade === value}
              onClick={() => alterar("finalidade", value)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="sort-control">
          <span>Ordenar</span>
          <select value={filtros.ordem} onChange={(e) => alterar("ordem", e.target.value)}>
            <option value="destaque">Em destaque</option>
            <option value="menor-preco">Menor preço</option>
            <option value="maior-preco">Maior preço</option>
            <option value="recentes">Mais recentes</option>
          </select>
        </label>
        <button className="filter-toggle" type="button" aria-expanded={maisFiltros} aria-controls="mais-filtros" onClick={() => setMaisFiltros((v) => !v)}>
          {maisFiltros ? "Menos filtros" : "Mais filtros"}
        </button>
      </div>

      {maisFiltros && (
        <div className="filtros-avancados" id="mais-filtros">
          {tipos.length > 0 && (
            <label>
              <span>Tipo</span>
              <select value={filtros.tipoId} onChange={(e) => alterar("tipoId", e.target.value)}>
                <option value="">Todos</option>
                {tipos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </label>
          )}
          {bairros.length > 0 && (
            <label>
              <span>Bairro</span>
              <select value={filtros.bairroId} onChange={(e) => alterar("bairroId", e.target.value)}>
                <option value="">Todos</option>
                {bairros.map((b) => <option key={b.id} value={b.id}>{b.nome}{b.cidade ? ` · ${b.cidade}` : ""}</option>)}
              </select>
            </label>
          )}
          <label>
            <span>Preço mínimo (R$)</span>
            <input inputMode="decimal" placeholder="0" value={filtros.precoMin} onChange={(e) => alterar("precoMin", e.target.value)} />
          </label>
          <label>
            <span>Preço máximo (R$)</span>
            <input inputMode="decimal" placeholder="Sem limite" value={filtros.precoMax} onChange={(e) => alterar("precoMax", e.target.value)} />
          </label>
          <label>
            <span>Quartos</span>
            <select value={filtros.dormitoriosMin} onChange={(e) => alterar("dormitoriosMin", e.target.value)}>
              <option value="">Qualquer</option>
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+</option>)}
            </select>
          </label>
          <label>
            <span>Situação</span>
            <select value={filtros.status} onChange={(e) => alterar("status", e.target.value)}>
              <option value="">Todas</option>
              <option value="DISPONIVEL">Somente disponíveis</option>
              <option value="EM_NEGOCIACAO">Em negociação</option>
            </select>
          </label>
          {erroFaixa && <p className="campo-erro filtros-erro" role="alert">{erroFaixa}</p>}
        </div>
      )}

      {favoritos.erro && <p className="form-error" role="alert">{favoritos.erro}</p>}

      {resultado.error ? (
        <div className="notice" role="alert">
          <span className="notice-mark" aria-hidden="true">!</span>
          <div>
            <strong>Não foi possível carregar os imóveis</strong>
            <p>{resultado.error}</p>
            <button className="secondary-button" type="button" onClick={resultado.recarregar}>Tentar novamente</button>
          </div>
        </div>
      ) : !pagina ? (
        erroFaixa ? null : <><p className="results-label" role="status">Carregando imóveis...</p><SkeletonCards /></>
      ) : imoveis.length > 0 ? (
        <div aria-busy={resultado.loading} className={resultado.loading ? "recarregando" : undefined}>
          <p className="results-label" aria-live="polite">
            {pagina.totalElements} {pagina.totalElements === 1 ? "imóvel encontrado" : "imóveis encontrados"}
            {resultado.loading && " · atualizando..."}
          </p>
          <div className="property-grid">
            {imoveis.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                favorito={favoritos.ids.has(property.id)}
                onFavoritar={favoritos.ativo ? () => favoritos.alternar(property.id) : undefined}
              />
            ))}
          </div>
          {totalPaginas > 1 && (
            <nav className="pagination" aria-label="Paginação dos imóveis">
              <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || resultado.loading}>
                Anterior
              </button>
              <span aria-live="polite">Página {page + 1} de {totalPaginas}</span>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPaginas - 1, p + 1))} disabled={page >= totalPaginas - 1 || resultado.loading}>
                Próxima
              </button>
            </nav>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-mark" aria-hidden="true">⌂</span>
          <h3>{filtrosAtivos ? "Nenhum imóvel encontrado" : "Novos espaços estão a caminho"}</h3>
          <p>{filtrosAtivos ? "Tente outro termo ou altere os filtros selecionados." : "Ainda não há imóveis cadastrados para exibir."}</p>
          {filtrosAtivos && <button className="secondary-button" type="button" onClick={limpar}>Limpar filtros</button>}
        </div>
      )}
    </>
  );
}
