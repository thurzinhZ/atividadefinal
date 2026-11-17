import PropertyGrid from "./property-grid";
import SiteHeader from "./site-header";

async function getProperties() {
  const apiBaseUrl = (process.env.API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

  try {
    const response = await fetch(`${apiBaseUrl}/imoveis`, { cache: "no-store" });
    if (!response.ok) {
      return { properties: [], error: `A API respondeu com o erro ${response.status}.` };
    }

    const properties = await response.json();
    return Array.isArray(properties)
      ? { properties, error: null }
      : { properties: [], error: "A resposta da API não contém uma lista de imóveis." };
  } catch {
    return {
      properties: [],
      error: "Não foi possível conectar à API. Verifique se o backend está rodando em http://localhost:8080.",
    };
  }
}

export default async function Home() {
  const { properties, error } = await getProperties();

  return (
    <main>
      <SiteHeader />

      <section className="intro" id="inicio">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" /> UM BOM LUGAR COMEÇA AQUI</p>
          <h1>Seu próximo capítulo<br />tem um endereço.</h1>
        </div>
        <p className="intro-note">Espaços escolhidos para combinar com a vida que você quer levar.</p>
      </section>

      <section className="catalog" id="imoveis" aria-labelledby="catalog-title">
        <div className="catalog-heading">
          <div>
            <p className="eyebrow">SELEÇÃO CASA CLARA</p>
            <h2 id="catalog-title">Imóveis disponíveis</h2>
          </div>
          <span className="catalog-count" aria-live="polite">
            {properties.length.toString().padStart(2, "0")} anúncios
          </span>
        </div>
        <PropertyGrid properties={properties} error={error} />
      </section>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#inicio"><span className="brand-symbol" aria-hidden="true">c</span><span>casa clara</span></a>
        <span>Um lugar para chamar de seu.</span>
      </footer>
    </main>
  );
}