"use client";

import { useMemo, useState } from "react";

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
      </div>
    </article>
  );
}

export default function PropertyGrid({ properties, error }) {
  const [query, setQuery] = useState("");
  const [purpose, setPurpose] = useState("TODOS");

  const filteredProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");

    return properties.filter((property) => {
      const matchesPurpose = purpose === "TODOS" || property.finalidade?.toUpperCase() === purpose;
      const searchableText = [property.titulo, property.descricao, property.endereco, property.bairro?.nome, property.bairro?.cidade, property.tipoImovel?.nome]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return matchesPurpose && searchableText.includes(normalizedQuery);
    });
  }, [properties, purpose, query]);

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
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="purpose-filter" role="group" aria-label="Filtrar por finalidade">
          {[["TODOS", "Todos"], ["VENDA", "Comprar"], ["ALUGUEL", "Alugar"]].map(([value, label]) => (
            <button
              className={purpose === value ? "filter-button active" : "filter-button"}
              key={value}
              type="button"
              aria-pressed={purpose === value}
              onClick={() => setPurpose(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="notice" role="status">
          <span className="notice-mark" aria-hidden="true">!</span>
          <div><strong>Não foi possível carregar os imóveis</strong><p>{error}</p></div>
        </div>
      ) : filteredProperties.length > 0 ? (
        <>
          <p className="results-label">{filteredProperties.length} {filteredProperties.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}</p>
          <div className="property-grid">
            {filteredProperties.map((property, index) => (
              <PropertyCard key={property.id ?? `${property.titulo}-${index}`} property={property} index={index} />
            ))}
          </div>
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