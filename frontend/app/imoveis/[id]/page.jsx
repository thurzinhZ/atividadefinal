import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "../../site-header";

const photos = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=85",
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
  return [neighborhood, [city, state].filter(Boolean).join(" / ")]
    .filter(Boolean)
    .join(" · ") || [property.endereco, property.numero].filter(Boolean).join(", ");
}

async function getProperty(id) {
  const apiBaseUrl = (process.env.API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
  const response = await fetch(`${apiBaseUrl}/imoveis/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`A API respondeu com o erro ${response.status}.`);
  return response.json();
}

export default async function PropertyDetailsPage({ params }) {
  const { id } = await params;
  let property;
  try {
    property = await getProperty(id);
  } catch (error) {
    return (
      <main>
        <SiteHeader />
        <section className="detail-state" role="alert">
          <p className="eyebrow">DETALHES DO IMÓVEL</p>
          <h1>Não foi possível carregar este imóvel</h1>
          <p>{error.message}</p>
          <Link className="text-link" href="/">Voltar à vitrine</Link>
        </section>
      </main>
    );
  }
  if (!property) notFound();

  const purpose = property.finalidade?.toUpperCase();
  const price = purpose === "ALUGUEL" ? property.precoAluguel : property.precoVenda;
  const contactEmail = process.env.CONTACT_EMAIL || "contato@casaclara.com.br";
  const subject = encodeURIComponent(`Tenho interesse: ${property.titulo || `imóvel ${property.id}`}`);
  const body = encodeURIComponent(`Olá! Tenho interesse no imóvel ${property.titulo || property.id}.`);
  const features = [
    property.dormitorios != null && `${property.dormitorios} quartos`,
    property.banheiros != null && `${property.banheiros} banheiros`,
    property.garagem != null && `${property.garagem} vagas`,
    property.areaTotal != null && `${Number(property.areaTotal).toLocaleString("pt-BR")} m² de área`,
  ].filter(Boolean);

  return (
    <main>
      <SiteHeader />
      <article className="property-detail">
        <Link className="text-link back-link" href="/#imoveis">← Voltar aos imóveis</Link>
        <div className="detail-layout">
          <div className="detail-photo">
            <img src={photos[Math.abs(Number(property.id) || 0) % photos.length]} alt={property.titulo || "Imóvel anunciado"} />
            <span className="property-purpose">{purpose === "ALUGUEL" ? "Para alugar" : "À venda"}</span>
          </div>
          <div className="detail-content">
            <p className="eyebrow">{getLocation(property) || "LOCALIZAÇÃO NÃO INFORMADA"}</p>
            <h1>{property.titulo || property.tipoImovel?.nome || "Imóvel"}</h1>
            <p className="detail-price">{formatPrice(price)}{purpose === "ALUGUEL" && <span> / mês</span>}</p>
            {features.length > 0 && (
              <ul className="detail-features">
                {features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
            )}
            {property.descricao && <p className="detail-description">{property.descricao}</p>}
            {property.endereco && (
              <p className="detail-address">
                {[property.endereco, property.numero, property.complemento, property.cep].filter(Boolean).join(", ")}
              </p>
            )}
            <a className="primary-button dashboard-link" href={`mailto:${contactEmail}?subject=${subject}&body=${body}`}>
              Tenho interesse neste imóvel
            </a>
          </div>
        </div>
      </article>
    </main>
  );
}
