"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const photos = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1100&q=85",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=85",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1100&q=85",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1100&q=85",
];

function formatPrice(value) {
  if (value == null) return "Consulte o valor";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
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

function PropertyCard({ property, index }) {
  const purpose = property.finalidade?.toUpperCase();
  const price = purpose === "ALUGUEL" ? property.precoAluguel : property.precoVenda;
  const details = [
    property.dormitorios != null && `${property.dormitorios} quartos`,
    property.banheiros != null && `${property.banheiros} banheiros`,
    property.areaTotal != null && `${Number(property.areaTotal).toLocaleString("pt-BR")} m²`,
  ].filter(Boolean);

  return (
    <article className="property-card">
      <Link className="property-card-link" href={`/imoveis/${property.id}`}>
        <div className="property-photo">
          <img src={photos[index % photos.length]} alt={property.titulo || "Imóvel anunciado"} loading="lazy" />
          <span className="property-purpose">{purpose === "ALUGUEL" ? "Para alugar" : "À venda"}</span>
          {property.destaque && <span className="property-featured">Destaque</span>}
        </div>
        <div className="property-content">
          <p className="property-location">{getLocation(property)}</p>
          <h3>{property.titulo || property.tipoImovel?.nome || "Imóvel"}</h3>
          <div className="property-details">
            {details.length > 0 ? details.map((detail) => <span key={detail}>{detail}</span>) : <span>Detalhes sob consulta</span>}
          </div>
          <div className="property-price-row">
            <strong>{formatPrice(price)}</strong>
            <span className="price-period">{purpose === "ALUGUEL" ? "/ mês" : ""}</span>
          </div>
          <span className="property-more">Ver detalhes <span aria-hidden="true">↗</span></span>
        </div>
      </Link>
    </article>
  );
}

export default function PropertyGrid({ properties, error }) {
  const [query, setQuery] = useState("");
  const [purpose, setPurpose] = useState("TODOS");
  const [sort, setSort] = useState("destaque");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filteredProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");

    const filtered = properties.filter((property) => {
      const matchesPurpose = purpose === "TODOS" || property.finalidade?.toUpperCase() === purpose;
      const searchableText = [property.titulo, property.descricao, property.endereco, property.bairro?.nome, property.bairro?.cidade, property.tipoImovel?.nome]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return matchesPurpose && searchableText.includes(normalizedQuery);
    });
    const priceOf = (property) => Number(
      property.finalidade?.toUpperCase() === "ALUGUEL" ? property.precoAluguel : property.precoVenda,
    ) || 0;

    return filtered.sort((first, second) => {
      if (sort === "menor-preco") return priceOf(first) - priceOf(second);
      if (sort === "maior-preco") return priceOf(second) - priceOf(first);
      if (sort === "recentes") return Number(second.id || 0) - Number(first.id || 0);
      return Number(Boolean(second.destaque)) - Number(Boolean(first.destaque));
    });
  }, [properties, purpose, query, sort]);
  const pageCount = Math.max(1, Math.ceil(filteredProperties.length / pageSize));
  const visibleProperties = filteredProperties.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="listing-controls">
        <label className="search-box">
          <span className="search-icon" aria-hidden="true" />
          <span className="visually-hidden">Buscar por cidade, bairro ou imóvel</span>
          <input
            type="search"
            placeholder="Cidade, bairro ou imóvel"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <div className="purpose-filter" role="group" aria-label="Filtrar por finalidade">
          {[["TODOS", "Todos"], ["VENDA", "Comprar"], ["ALUGUEL", "Alugar"]].map(([value, label]) => (
            <button
              className={purpose === value ? "filter-button active" : "filter-button"}
              key={value}
              type="button"
              aria-pressed={purpose === value}
              onClick={() => {
                setPurpose(value);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="sort-control">
          <span>Ordenar</span>
          <select value={sort} onChange={(event) => {
            setSort(event.target.value);
            setPage(1);
          }}>
            <option value="destaque">Em destaque</option>
            <option value="menor-preco">Menor preço</option>
            <option value="maior-preco">Maior preço</option>
            <option value="recentes">Mais recentes</option>
          </select>
        </label>
      </div>

      {error ? (
        <div className="notice" role="status">
          <span className="notice-mark" aria-hidden="true">!</span>
          <div><strong>Não foi possível carregar os imóveis</strong><p>{error}</p></div>
        </div>
      ) : filteredProperties.length > 0 ? (
        <>
          <p className="results-label" aria-live="polite">
            {filteredProperties.length} {filteredProperties.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}
          </p>
          <div className="property-grid">
            {visibleProperties.map((property, index) => (
              <PropertyCard key={property.id ?? `${property.titulo}-${index}`} property={property} index={index} />
            ))}
          </div>
          {pageCount > 1 && (
            <nav className="pagination" aria-label="Paginação dos imóveis">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
                Anterior
              </button>
              <span aria-live="polite">Página {page} de {pageCount}</span>
              <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount}>
                Próxima
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="empty-state">
          <span className="empty-mark" aria-hidden="true">⌂</span>
          <h3>{properties.length ? "Nenhum imóvel encontrado" : "Novos espaços estão a caminho"}</h3>
          <p>{properties.length ? "Tente outro termo ou altere o filtro selecionado." : "Ainda não há imóveis cadastrados para exibir."}</p>
        </div>
      )}
    </>
  );
}