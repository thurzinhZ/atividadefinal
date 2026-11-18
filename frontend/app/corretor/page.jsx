"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedArea from "../protected-area";
import { useAuth } from "../auth-provider";
import { useRecurso } from "../../lib/use-api";
import Abas from "../_components/abas";
import { Carregando, Mensagem, Recurso, Vazio } from "../_components/estados";
import { ListaOfertas } from "../_components/ofertas";
import { ListaContratos } from "../_components/contratos";
import { PainelCorretor } from "../_components/paineis";

const ABAS = ["painel", "ofertas", "negociacoes", "contratos"];

function AreaCorretor() {
  const { session, apiJson } = useAuth();
  const params = useSearchParams();
  const [aba, setAba] = useState(ABAS.includes(params.get("aba")) ? params.get("aba") : "painel");
  const [aviso, setAviso] = useState("");
  const painel = useRecurso((signal) => apiJson("/dashboard/corretor", { signal }), `painel-${aba}`);
  const pendentes = useRecurso((signal) => apiJson("/ofertas?status=PENDENTE", { signal }), aba === "ofertas" ? "pendentes" : null);
  const aceitas = useRecurso(
    async (signal) => (await apiJson("/ofertas?status=ACEITA", { signal })).filter((o) => o.corretorEmail === session.email),
    aba === "negociacoes" ? "aceitas" : null,
  );
  const contratos = useRecurso((signal) => apiJson("/contratos", { signal }), aba === "contratos" ? "contratos" : null);

  const i = painel.data?.indicadores;
  const semContrato = aceitas.data?.filter((o) => !o.contratoId).length;

  function trocarAba(id) {
    setAviso("");
    setAba(id);
  }

  return (
    <section className="dashboard">
      <p className="eyebrow">ÁREA DO CORRETOR</p>
      <h1>Negociações</h1>
      <p className="dashboard-copy">Responda às ofertas dos clientes, prepare os contratos e acompanhe a aprovação.</p>

      <Abas rotulo="Seções da área do corretor" ativa={aba} onChange={trocarAba} abas={[
        { id: "painel", rotulo: "Painel" },
        { id: "ofertas", rotulo: "Ofertas pendentes", contador: i?.ofertasPendentes },
        { id: "negociacoes", rotulo: "Minhas negociações", contador: semContrato },
        { id: "contratos", rotulo: "Contratos", contador: i?.contratosReprovados },
      ]} />

      <Mensagem onFechar={() => setAviso("")}>{aviso}</Mensagem>

      <div className="aba-conteudo" role="tabpanel" aria-labelledby={`aba-${aba}`}>
        {aba === "painel" && (
          <Recurso recurso={painel} textoCarregando="Carregando painel...">
            {(dados) => <PainelCorretor dados={dados} />}
          </Recurso>
        )}

        {aba === "ofertas" && (
          <Recurso recurso={pendentes} textoCarregando="Carregando ofertas..." vazio={
            <Vazio titulo="Nenhuma oferta aguardando" texto="Quando um cliente enviar uma proposta, ela aparece aqui." />
          }>
            {(lista) => (
              <ListaOfertas ofertas={lista} perfil="CORRETOR" onAtualizada={(oferta) => {
                // aceitar recusa as outras pendentes do imóvel: recarrega a fila inteira
                setAviso(oferta.status === "ACEITA"
                  ? `Oferta #${oferta.id} aceita. Prepare o contrato em "Minhas negociações".`
                  : `Oferta #${oferta.id} recusada.`);
                pendentes.recarregar();
                painel.recarregar();
              }} />
            )}
          </Recurso>
        )}

        {aba === "negociacoes" && (
          <Recurso recurso={aceitas} textoCarregando="Carregando negociações..." vazio={
            <Vazio titulo="Nenhuma oferta aceita" texto="As ofertas que você aceitar aparecem aqui para você preparar o contrato." />
          }>
            {(lista) => (
              <ListaOfertas ofertas={lista} perfil="CORRETOR"
                onAtualizada={(nova) => aceitas.atualizar((atual) => atual.map((o) => (o.id === nova.id ? nova : o)))}
                onContratoCriado={(contrato) => setAviso(`Contrato #${contrato.id} enviado para aprovação do administrador.`)} />
            )}
          </Recurso>
        )}

        {aba === "contratos" && (
          <Recurso recurso={contratos} textoCarregando="Carregando contratos..." vazio={
            <Vazio titulo="Nenhum contrato preparado" texto="Aceite uma oferta e prepare o contrato em “Minhas negociações”." />
          }>
            {(lista) => (
              <ListaContratos contratos={lista} perfil="CORRETOR" onAtualizado={(novo) => {
                contratos.atualizar((atual) => atual.map((c) => (c.id === novo.id ? novo : c)));
                setAviso(`Contrato #${novo.id} reenviado para aprovação.`);
                painel.recarregar();
              }} />
            )}
          </Recurso>
        )}
      </div>
    </section>
  );
}

export default function CorretorPage() {
  return (
    <ProtectedArea requiredRole="CORRETOR">
      <Suspense fallback={<Carregando />}>
        <AreaCorretor />
      </Suspense>
    </ProtectedArea>
  );
}
