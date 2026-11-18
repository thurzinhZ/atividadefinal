"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatarMoeda } from "../../lib/regras";

// Uma única série por gráfico (cor da marca). A identidade de cada barra vem do
// rótulo no eixo, não da cor; por isso não há legenda. Cada gráfico tem uma
// tabela com os mesmos dados para leitores de tela e para impressão.

const COR = "#245c4b"; // --green do globals.css
const TINTA_SECUNDARIA = "#64716b";
const GRADE = "#e5e9e5";

function DicaPersonalizada({ active, payload, label, formatoValor }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="grafico-dica">
      <strong>{label}</strong>
      <span>{item.quantidade} {item.quantidade === 1 ? "registro" : "registros"}</span>
      {formatoValor && item.valor != null && Number(item.valor) > 0 && <span>{formatarMoeda(item.valor)}</span>}
    </div>
  );
}

function TabelaDados({ dados, mostrarValor }) {
  return (
    <details className="grafico-tabela">
      <summary>Ver dados em tabela</summary>
      <table>
        <thead>
          <tr><th scope="col">Item</th><th scope="col">Quantidade</th>{mostrarValor && <th scope="col">Valor</th>}</tr>
        </thead>
        <tbody>
          {dados.map((d) => (
            <tr key={d.nome}><td>{d.nome}</td><td>{d.quantidade}</td>{mostrarValor && <td>{formatarMoeda(d.valor)}</td>}</tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

function prepararDados(dados, rotulos) {
  return (dados || []).map((item) => ({
    ...item,
    nome: typeof rotulos === "function" ? rotulos(item.rotulo) : rotulos?.[item.rotulo]?.rotulo || rotulos?.[item.rotulo] || item.rotulo,
    quantidade: Number(item.quantidade) || 0,
  }));
}

function CartaoGrafico({ titulo, descricao, total, children, dados, mostrarValor }) {
  const semDados = dados.every((d) => d.quantidade === 0);
  return (
    <figure className="grafico-cartao">
      <figcaption>
        <strong>{titulo}</strong>
        {descricao && <span>{descricao}</span>}
      </figcaption>
      {semDados ? (
        <p className="grafico-vazio">Ainda não há dados para este gráfico.</p>
      ) : (
        <div className="grafico-area" role="img" aria-label={`${titulo}. ${dados.map((d) => `${d.nome}: ${d.quantidade}`).join(", ")}${total ? `. Total: ${total}` : ""}`}>
          {children}
        </div>
      )}
      <TabelaDados dados={dados} mostrarValor={mostrarValor} />
    </figure>
  );
}

export function GraficoBarras({ titulo, descricao, dados, rotulos, horizontal = false, mostrarValor = false }) {
  const itens = prepararDados(dados, rotulos);
  const eixo = { stroke: TINTA_SECUNDARIA, fontSize: 11, tickLine: false, axisLine: { stroke: GRADE } };
  return (
    <CartaoGrafico titulo={titulo} descricao={descricao} dados={itens} mostrarValor={mostrarValor}>
      <ResponsiveContainer width="100%" height={horizontal ? Math.max(170, itens.length * 44) : 220}>
        {horizontal ? (
          <BarChart data={itens} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
            <CartesianGrid horizontal={false} stroke={GRADE} />
            <XAxis type="number" allowDecimals={false} {...eixo} />
            <YAxis type="category" dataKey="nome" width={140} {...eixo} />
            <Tooltip cursor={{ fill: "rgb(36 92 75 / 6%)" }} content={<DicaPersonalizada formatoValor={mostrarValor} />} />
            <Bar dataKey="quantidade" fill={COR} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false} />
          </BarChart>
        ) : (
          <BarChart data={itens} margin={{ top: 8, right: 8, bottom: 4, left: -18 }}>
            <CartesianGrid vertical={false} stroke={GRADE} />
            <XAxis dataKey="nome" interval={0} {...eixo} />
            <YAxis allowDecimals={false} {...eixo} />
            <Tooltip cursor={{ fill: "rgb(36 92 75 / 6%)" }} content={<DicaPersonalizada formatoValor={mostrarValor} />} />
            <Bar dataKey="quantidade" fill={COR} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </CartaoGrafico>
  );
}

export function GraficoLinha({ titulo, descricao, dados, rotulos, mostrarValor = false }) {
  const itens = prepararDados(dados, rotulos);
  const eixo = { stroke: TINTA_SECUNDARIA, fontSize: 11, tickLine: false, axisLine: { stroke: GRADE } };
  return (
    <CartaoGrafico titulo={titulo} descricao={descricao} dados={itens} mostrarValor={mostrarValor}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={itens} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
          <CartesianGrid vertical={false} stroke={GRADE} />
          <XAxis dataKey="nome" {...eixo} />
          <YAxis allowDecimals={false} {...eixo} />
          <Tooltip cursor={{ stroke: TINTA_SECUNDARIA, strokeDasharray: "3 3" }} content={<DicaPersonalizada formatoValor={mostrarValor} />} />
          <Line type="linear" dataKey="quantidade" stroke={COR} strokeWidth={2} dot={{ r: 4, fill: COR, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </CartaoGrafico>
  );
}

export function Indicadores({ itens }) {
  return (
    <dl className="indicadores">
      {itens.map((item) => (
        <div className={item.destaque ? "indicador destaque" : "indicador"} key={item.rotulo}>
          <dt>{item.rotulo}</dt>
          <dd>{item.valor}</dd>
          {item.dica && <span className="indicador-dica">{item.dica}</span>}
        </div>
      ))}
    </dl>
  );
}
