import PropertyGrid from "./property-grid";
import SiteHeader from "./site-header";

export default function Home() {
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
        <PropertyGrid />
      </section>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#inicio"><span className="brand-symbol" aria-hidden="true">c</span><span>casa clara</span></a>
        <span>Um lugar para chamar de seu.</span>
      </footer>
    </main>
  );
}