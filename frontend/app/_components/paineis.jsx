"use client";

import { ETAPAS_FUNIL, STATUS_CONTRATO, STATUS_IMOVEL, STATUS_OFERTA, ROTULO_PERFIL, formatarMoedaCurta, rotuloMes } from "../../lib/regras";
import { GraficoBarras, GraficoLinha, Indicadores } from "./graficos";

// Painéis com gráficos de cada perfil, a partir do GET /dashboard/{perfil}

export function PainelCliente({ dados }) {
  const { indicadores: i, graficos: g } = dados;
  return (
    <>
      <Indicadores itens={[
        { rotulo: "Favoritos", valor: i.favoritos },
        { rotulo: "Ofertas pendentes", valor: i.ofertasPendentes },
        { rotulo: "Contratos para assinar", valor: i.contratosParaAssinar, destaque: i.contratosParaAssinar > 0 },
        { rotulo: "Contratos assinados", valor: i.contratosAssinados },
      ]} />
      <div className="graficos-grade">
        <GraficoBarras titulo="Minhas ofertas por situação" dados={g.ofertasPorStatus} rotulos={STATUS_OFERTA} mostrarValor />
        <GraficoBarras titulo="Meus contratos por situação" dados={g.contratosPorStatus} rotulos={STATUS_CONTRATO} mostrarValor />
      </div>
    </>
  );
}

export function PainelCorretor({ dados }) {
  const { indicadores: i, graficos: g } = dados;
  return (
    <>
      <Indicadores itens={[
        { rotulo: "Ofertas aguardando resposta", valor: i.ofertasPendentes, destaque: i.ofertasPendentes > 0 },
        { rotulo: "Ofertas que aceitei", valor: i.ofertasAceitas },
        { rotulo: "Contratos em andamento", valor: i.contratosEmAndamento },
        { rotulo: "Contratos reprovados", valor: i.contratosReprovados, destaque: i.contratosReprovados > 0 },
        { rotulo: "Valor assinado", valor: formatarMoedaCurta(i.valorAssinado) },
      ]} />
      <div className="graficos-grade">
        <GraficoBarras titulo="Ofertas por situação" descricao="Fila pendente + ofertas que você respondeu" dados={g.ofertasPorStatus} rotulos={STATUS_OFERTA} mostrarValor />
        <GraficoBarras titulo="Meus contratos por situação" dados={g.contratosPorStatus} rotulos={STATUS_CONTRATO} mostrarValor />
        <GraficoLinha titulo="Ofertas respondidas por mês" descricao="Últimos 6 meses" dados={g.ofertasRespondidasPorMes} rotulos={rotuloMes} />
      </div>
    </>
  );
}

export function PainelAdmin({ dados }) {
  const { indicadores: i, graficos: g } = dados;
  return (
    <>
      <Indicadores itens={[
        { rotulo: "Imóveis cadastrados", valor: i.imoveis, dica: `${i.imoveisDisponiveis} disponíveis` },
        { rotulo: "Usuários", valor: i.usuarios },
        { rotulo: "Ofertas pendentes", valor: i.ofertasPendentes },
        { rotulo: "Contratos para aprovar", valor: i.contratosAguardandoAprovacao, destaque: i.contratosAguardandoAprovacao > 0 },
        { rotulo: "Valor assinado", valor: formatarMoedaCurta(i.valorAssinado) },
      ]} />
      <div className="graficos-grade">
        <GraficoBarras titulo="Funil de negociação" descricao="Oferta enviada → aceita → contrato aprovado → assinado" dados={g.funil} rotulos={ETAPAS_FUNIL} horizontal />
        <GraficoLinha titulo="Ofertas recebidas por mês" descricao="Últimos 6 meses" dados={g.ofertasPorMes} rotulos={rotuloMes} mostrarValor />
        <GraficoBarras titulo="Contratos por situação" dados={g.contratosPorStatus} rotulos={STATUS_CONTRATO} mostrarValor />
        <GraficoBarras titulo="Imóveis por situação" dados={g.imoveisPorStatus} rotulos={STATUS_IMOVEL} />
        <GraficoBarras titulo="Ofertas por situação" dados={g.ofertasPorStatus} rotulos={STATUS_OFERTA} mostrarValor />
        <GraficoBarras titulo="Usuários por perfil" dados={g.usuariosPorPerfil} rotulos={ROTULO_PERFIL} />
      </div>
    </>
  );
}
