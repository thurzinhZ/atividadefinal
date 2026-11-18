"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedArea from "../protected-area";
import { useAuth } from "../auth-provider";
import { useRecurso } from "../../lib/use-api";
import Abas from "../_components/abas";
import { Carregando, Recurso, Vazio } from "../_components/estados";
import { ListaOfertas } from "../_components/ofertas";
import { ListaContratos } from "../_components/contratos";
import { PainelCliente } from "../_components/paineis";
import { useFavoritos } from "../_components/favoritos";
import { PropertyCard } from "../property-grid";

const ABAS = ["resumo", "favoritos", "ofertas", "contratos"];

function AreaCliente() {
  const { session, apiJson } = useAuth();
  const params = useSearchParams();
  const [aba, setAba] = useState(ABAS.includes(params.get("aba")) ? params.get("aba") : "resumo");
  const perfil = useRecurso((signal) => apiJson("/perfil", { signal }), "perfil");
  const painel = useRecurso((signal) => apiJson("/dashboard/cliente", { signal }), `painel-${aba}`);
  const favoritosLista = useRecurso((signal) => apiJson("/favoritos", { signal }), aba === "favoritos" ? "favoritos" : null);
  const ofertas = useRecurso((signal) => apiJson("/ofertas/minhas", { signal }), aba === "ofertas" ? "ofertas" : null);
  const contratos = useRecurso((signal) => apiJson("/contratos", { signal }), aba === "contratos" ? "contratos" : null);
  const favoritos = useFavoritos();

  const i = painel.data?.indicadores;
  const nome = perfil.data?.nome;

  return (
    <section className="dashboard">
      <p className="eyebrow">ÁREA DO CLIENTE</p>
      <h1>Olá, {nome || session?.email}</h1>
      <p className="dashboard-copy">Acompanhe seus imóveis favoritos, suas ofertas e assine seus contratos.</p>

      <Abas rotulo="Seções da área do cliente" ativa={aba} onChange={setAba} abas={[
        { id: "resumo", rotulo: "Resumo" },
        { id: "favoritos", rotulo: "Favoritos", contador: i?.favoritos },
        { id: "ofertas", rotulo: "Minhas ofertas", contador: i?.ofertasPendentes },
        { id: "contratos", rotulo: "Contratos", contador: i?.contratosParaAssinar },
      ]} />

      <div className="aba-conteudo" role="tabpanel" aria-labelledby={`aba-${aba}`}>
        {aba === "resumo" && (
          <Recurso recurso={painel} textoCarregando="Carregando seu painel...">
            {(dados) => <PainelCliente dados={dados} />}
          </Recurso>
        )}

        {aba === "favoritos" && (
          <Recurso recurso={favoritosLista} textoCarregando="Carregando favoritos..." vazio={
            <Vazio titulo="Nenhum favorito ainda" texto="Toque no coração de um imóvel para guardá-lo aqui.">
              <Link className="primary-button dashboard-link" href="/#imoveis">Explorar imóveis</Link>
            </Vazio>
          }>
            {(lista) => (
              <div className="property-grid">
                {lista.map((imovel) => (
                  <PropertyCard
                    key={imovel.id}
                    property={imovel}
                    favorito={favoritos.ids.has(imovel.id)}
                    onFavoritar={async () => {
                      await favoritos.alternar(imovel.id);
                      favoritosLista.atualizar((atual) => atual.filter((item) => item.id !== imovel.id));
                    }}
                  />
                ))}
              </div>
            )}
          </Recurso>
        )}

        {aba === "ofertas" && (
          <Recurso recurso={ofertas} textoCarregando="Carregando suas ofertas..." vazio={
            <Vazio titulo="Você ainda não fez ofertas" texto="Abra um imóvel disponível e envie sua proposta.">
              <Link className="primary-button dashboard-link" href="/#imoveis">Ver imóveis</Link>
            </Vazio>
          }>
            {(lista) => (
              <ListaOfertas ofertas={lista} perfil="USER"
                onAtualizada={(nova) => ofertas.atualizar((atual) => atual.map((o) => (o.id === nova.id ? nova : o)))} />
            )}
          </Recurso>
        )}

        {aba === "contratos" && (
          perfil.loading && !perfil.data ? <Carregando /> : (
            <Recurso recurso={contratos} textoCarregando="Carregando contratos..." vazio={
              <Vazio titulo="Nenhum contrato por enquanto" texto="Quando um corretor aceitar sua oferta e o contrato for aprovado, ele aparece aqui para assinatura." />
            }>
              {(lista) => (
                <ListaContratos contratos={lista} perfil="USER" nomeUsuario={nome}
                  onAtualizado={(novo) => {
                    contratos.atualizar((atual) => atual.map((c) => (c.id === novo.id ? novo : c)));
                    painel.recarregar();
                  }} />
              )}
            </Recurso>
          )
        )}
      </div>
    </section>
  );
}

export default function ClientAreaPage() {
  return (
    <ProtectedArea requiredRole="USER">
      <Suspense fallback={<Carregando />}>
        <AreaCliente />
      </Suspense>
    </ProtectedArea>
  );
}
