import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRecurso } from "../lib/use-api";
import { Recurso, Vazio } from "../app/_components/estados";
import { GraficoBarras } from "../app/_components/graficos";

function Lista({ carregar }) {
  const recurso = useRecurso(carregar, "lista");
  return (
    <Recurso recurso={recurso} textoCarregando="Carregando ofertas..." vazio={<Vazio titulo="Nenhuma oferta" />}>
      {(itens) => <ul>{itens.map((i) => <li key={i}>{i}</li>)}</ul>}
    </Recurso>
  );
}

function adiado() {
  let resolver;
  let rejeitar;
  const promise = new Promise((res, rej) => { resolver = res; rejeitar = rej; });
  return { promise, resolver, rejeitar };
}

describe("estados de carregamento e erro", () => {
  it("mostra carregando e depois os dados", async () => {
    const pedido = adiado();
    render(<Lista carregar={() => pedido.promise} />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando ofertas...");

    pedido.resolver(["Oferta A", "Oferta B"]);
    expect(await screen.findByText("Oferta A")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("mostra o estado vazio quando a lista vem vazia", async () => {
    render(<Lista carregar={async () => []} />);
    expect(await screen.findByText("Nenhuma oferta")).toBeTruthy();
  });

  it("mostra o erro e permite tentar novamente", async () => {
    const carregar = vi.fn()
      .mockRejectedValueOnce(new Error("Não foi possível conectar ao servidor."))
      .mockResolvedValueOnce(["Oferta recuperada"]);
    render(<Lista carregar={carregar} />);

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("Não foi possível conectar ao servidor.");

    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Oferta recuperada")).toBeTruthy();
    expect(carregar).toHaveBeenCalledTimes(2);
  });

  it("ignora respostas de requisições canceladas", async () => {
    const primeira = adiado();
    const carregar = vi.fn().mockReturnValueOnce(primeira.promise);
    const { unmount } = render(<Lista carregar={carregar} />);
    const signal = carregar.mock.calls[0]?.[0];
    await waitFor(() => expect(carregar).toHaveBeenCalled());
    unmount();
    expect(carregar.mock.calls[0][0].aborted).toBe(true);
    primeira.resolver(["tarde demais"]); // não deve gerar erro de setState em componente desmontado
    expect(signal === undefined || signal.aborted).toBe(true);
  });
});

describe("gráficos", () => {
  it("tem uma tabela acessível com os mesmos dados", () => {
    render(<GraficoBarras titulo="Contratos" rotulos={{ APROVADO: { rotulo: "Aguardando assinatura" } }}
      dados={[{ rotulo: "APROVADO", quantidade: 2, valor: 900000 }]} mostrarValor />);
    expect(screen.getByText("Ver dados em tabela")).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Aguardando assinatura" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "2" })).toBeTruthy();
  });

  it("avisa quando ainda não há dados", () => {
    render(<GraficoBarras titulo="Ofertas" dados={[{ rotulo: "PENDENTE", quantidade: 0 }]} />);
    expect(screen.getByText("Ainda não há dados para este gráfico.")).toBeTruthy();
  });
});
