import { ETAPAS_FLUXO } from "../../lib/regras";

// Mostra em que ponto do fluxo oferta -> contrato a negociação está
export default function LinhaDoTempo({ etapa, reprovado = false }) {
  return (
    <ol className="linha-tempo" aria-label="Andamento da negociação">
      {ETAPAS_FLUXO.map((nome, indice) => {
        const estado = indice < etapa ? "feita" : indice === etapa ? (reprovado ? "reprovada" : "atual") : "futura";
        return (
          <li key={nome} className={`etapa etapa-${estado}`} aria-current={indice === etapa ? "step" : undefined}>
            <span className="etapa-ponto" aria-hidden="true" />
            <span className="etapa-nome">{indice === etapa && reprovado ? "Reprovado — em revisão" : nome}</span>
          </li>
        );
      })}
    </ol>
  );
}
