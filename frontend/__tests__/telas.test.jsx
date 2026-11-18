import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// sessão simulada: cada teste define o perfil e o que a API devolve
const auth = { session: null, ready: true, apiJson: vi.fn(), apiFetch: vi.fn() };
vi.mock("../app/auth-provider", () => ({ useAuth: () => auth }));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a> }));

const { ContratoCard } = await import("../app/_components/contratos");
const { default: OfertaForm } = await import("../app/_components/oferta-form");
const { OfertaCard } = await import("../app/_components/ofertas");
const { default: PropertyGrid } = await import("../app/property-grid");

const contratoBase = {
  id: 7, ofertaId: 3, imovelId: 1, imovelTitulo: "Casa com pátio", status: "APROVADO", valor: 480000,
  formaPagamento: "À vista", condicoes: "Pagamento à vista na escritura.", clienteNome: "Maria da Silva", corretorNome: "Carla",
};

beforeEach(() => {
  auth.session = null;
  auth.apiJson = vi.fn();
  auth.apiFetch = vi.fn();
});

describe("assinatura do contrato (cliente)", () => {
  it("só mostra o botão de assinar quando o contrato está aprovado", () => {
    const { rerender } = render(<ContratoCard contrato={{ ...contratoBase, status: "AGUARDANDO_APROVACAO" }} perfil="USER" onAtualizado={() => {}} />);
    expect(screen.queryByRole("button", { name: "Assinar contrato" })).toBeNull();
    rerender(<ContratoCard contrato={contratoBase} perfil="USER" onAtualizado={() => {}} />);
    expect(screen.getByRole("button", { name: "Assinar contrato" })).toBeTruthy();
  });

  it("não chama a API se o nome não confere", async () => {
    render(<ContratoCard contrato={contratoBase} perfil="USER" nomeUsuario="Maria da Silva" onAtualizado={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Assinar contrato" }));
    await userEvent.type(screen.getByLabelText(/nome completo/i), "Outra Pessoa");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Assinar contrato" }));
    expect(screen.getByText("O nome digitado não confere com o nome cadastrado.")).toBeTruthy();
    expect(auth.apiJson).not.toHaveBeenCalled();
  });

  it("assina, mostra o estado de envio e devolve o contrato atualizado", async () => {
    let concluir;
    auth.apiJson.mockReturnValue(new Promise((res) => { concluir = res; }));
    const onAtualizado = vi.fn();
    render(<ContratoCard contrato={contratoBase} perfil="USER" nomeUsuario="Maria da Silva" onAtualizado={onAtualizado} />);

    await userEvent.click(screen.getByRole("button", { name: "Assinar contrato" }));
    await userEvent.type(screen.getByLabelText(/nome completo/i), "maria da silva");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Assinar contrato" }));

    expect(screen.getByRole("button", { name: "Assinando..." }).disabled).toBe(true);
    expect(auth.apiJson).toHaveBeenCalledWith("/contratos/7/assinar", { method: "PATCH", body: { nomeAssinatura: "maria da silva", aceite: true } });
    concluir({ ...contratoBase, status: "ASSINADO" });
    await waitFor(() => expect(onAtualizado).toHaveBeenCalledWith(expect.objectContaining({ status: "ASSINADO" })));
  });
});

describe("aprovação do contrato (administrador)", () => {
  it("exige motivo para reprovar e mostra o erro da API", async () => {
    auth.apiJson.mockRejectedValue(new Error("Este contrato não está aguardando aprovação (status APROVADO)."));
    render(<ContratoCard contrato={{ ...contratoBase, status: "AGUARDANDO_APROVACAO" }} perfil="ADMIN" onAtualizado={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: "Reprovar" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirmar reprovação" }));
    expect(screen.getByText(/Informe o motivo/)).toBeTruthy();
    expect(auth.apiJson).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText("Motivo da reprovação"), "Faltam cláusulas");
    await userEvent.click(screen.getByRole("button", { name: "Confirmar reprovação" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("não está aguardando aprovação");
  });
});

describe("ofertas", () => {
  it("corretor aceita a oferta", async () => {
    auth.apiJson.mockResolvedValue({ id: 3, status: "ACEITA" });
    const onAtualizada = vi.fn();
    render(<OfertaCard oferta={{ id: 3, imovelId: 1, valor: 400000, status: "PENDENTE", clienteNome: "Maria", clienteEmail: "m@e.com" }}
      perfil="CORRETOR" onAtualizada={onAtualizada} />);
    await userEvent.click(screen.getByRole("button", { name: "Aceitar oferta" }));
    expect(auth.apiJson).toHaveBeenCalledWith("/ofertas/3/aceitar", { method: "PATCH", body: undefined });
    await waitFor(() => expect(onAtualizada).toHaveBeenCalledWith({ id: 3, status: "ACEITA" }));
  });

  it("formulário valida o valor antes de enviar e mostra o erro do backend", async () => {
    auth.session = { tipo: "USER", email: "user@email.com" };
    auth.apiJson.mockRejectedValue(new Error("Você já tem uma oferta pendente para este imóvel."));
    render(<OfertaForm imovel={{ id: 1, status: "DISPONIVEL" }} precoAnunciado={350000} />);

    await userEvent.type(screen.getByLabelText(/Sua proposta/), "0");
    await userEvent.click(screen.getByRole("button", { name: "Enviar oferta" }));
    expect(screen.getByText("O valor da oferta deve ser maior que zero.")).toBeTruthy();
    expect(auth.apiJson).not.toHaveBeenCalled();

    await userEvent.clear(screen.getByLabelText(/Sua proposta/));
    await userEvent.type(screen.getByLabelText(/Sua proposta/), "340.000");
    await userEvent.click(screen.getByRole("button", { name: "Enviar oferta" }));
    expect(auth.apiJson).toHaveBeenCalledWith("/ofertas", { body: { imovelId: 1, valor: 340000, mensagem: null } });
    expect(await screen.findByRole("alert")).toHaveTextContent("Você já tem uma oferta pendente");
  });

  it("não mostra o formulário para imóvel em negociação nem para outros perfis", () => {
    auth.session = { tipo: "USER" };
    const { rerender } = render(<OfertaForm imovel={{ id: 1, status: "EM_NEGOCIACAO" }} />);
    expect(screen.getByText(/não está recebendo ofertas/)).toBeTruthy();
    auth.session = { tipo: "CORRETOR" };
    rerender(<OfertaForm imovel={{ id: 1, status: "DISPONIVEL" }} />);
    expect(screen.queryByRole("button", { name: "Enviar oferta" })).toBeNull();
  });
});

describe("vitrine com filtros e paginação", () => {
  const pagina = (page, total = 8) => ({
    content: [{ id: page * 10 + 1, titulo: `Imóvel da página ${page + 1}`, finalidade: "VENDA", precoVenda: 300000, status: "DISPONIVEL" }],
    page, size: 6, totalElements: total, totalPages: Math.ceil(total / 6),
  });

  function mockFetch(responder) {
    return vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const texto = String(url);
      if (texto.includes("/tipos-imoveis") || texto.includes("/bairros")) return new Response("[]", { status: 200 });
      return responder(texto);
    });
  }

  it("mostra o carregamento, os resultados e pagina no servidor", async () => {
    const fetchMock = mockFetch((url) => {
      const page = Number(new URL(url, "http://x").searchParams.get("page"));
      return new Response(JSON.stringify(pagina(page)), { status: 200 });
    });
    render(<PropertyGrid />);
    expect(screen.getByText("Carregando imóveis...")).toBeTruthy();
    expect(await screen.findByText("Imóvel da página 1")).toBeTruthy();
    expect(screen.getByText("Página 1 de 2")).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));
    expect(await screen.findByText("Imóvel da página 2")).toBeTruthy();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("page=1"))).toBe(true);
  });

  it("envia o filtro de finalidade para a API", async () => {
    const fetchMock = mockFetch(() => new Response(JSON.stringify(pagina(0, 1)), { status: 200 }));
    render(<PropertyGrid />);
    await screen.findByText("Imóvel da página 1");
    await userEvent.click(within(screen.getByRole("group", { name: "Filtrar por finalidade" })).getByRole("button", { name: "Alugar" }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes("finalidade=ALUGUEL"))).toBe(true));
  });

  it("mostra o erro da API e recupera ao tentar novamente", async () => {
    let falhar = true;
    mockFetch(() => (falhar
      ? new Response(JSON.stringify({ mensagem: "O preço mínimo não pode ser maior que o preço máximo." }), { status: 400 })
      : new Response(JSON.stringify(pagina(0, 1)), { status: 200 })));
    render(<PropertyGrid />);
    expect(await screen.findByRole("alert")).toHaveTextContent("O preço mínimo não pode ser maior");
    falhar = false;
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Imóvel da página 1")).toBeTruthy();
  });

  it("mostra erro de conexão quando o backend está fora do ar", async () => {
    mockFetch(() => { throw new TypeError("Failed to fetch"); });
    render(<PropertyGrid />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar ao servidor");
  });
});
