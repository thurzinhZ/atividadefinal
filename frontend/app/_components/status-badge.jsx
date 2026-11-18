import { rotuloStatus } from "../../lib/regras";

export default function StatusBadge({ mapa, status }) {
  const tom = mapa[status]?.tom || "neutro";
  return <span className={`status-badge status-${tom}`}>{rotuloStatus(mapa, status)}</span>;
}
