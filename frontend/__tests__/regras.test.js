import { describe, expect, it } from "vitest";
import {
  acoesContrato,
  acoesOferta,
  etapaContrato,
  imovelDisponivel,
  lerValor,
  montarBusca,
  normalizarNome,
  rotaInicial,
  validarAssinatura,
  validarContrato,
  validarFaixaPreco,
  validarOferta,
} from "../lib/regras";

describe("perfis", () => {
  it("leva cada perfil para a sua área", () => {
    expect(rotaInicial("ADMIN")).toBe("/painel");
    expect(rotaInicial("CORRETOR")).toBe("/corretor");
    expect(rotaInicial("USER")).toBe("/area-cliente");
  });
});

describe("valores", () => {
  it("entende valores no formato brasileiro e numérico", () => {
    expect(lerValor("350.000,50")).toBe(350000.5);
    expect(lerValor("R$ 1.200")).toBe(1200);
    expect(lerValor("340000")).toBe(340000);
    expect(lerValor(12)).toBe(12);
    expect(lerValor("abc")).toBeNaN();
    expect(lerValor("")).toBeNaN();
  });
});

describe("ofertas", () => {
  it("exige valor maior que zero", () => {
    expect(validarOferta({ valor: "" }).valor).toBeTruthy();
    expect(validarOferta({ valor: "0" }).valor).toMatch(/maior que zero/);
    expect(validarOferta({ valor: "-5" }).valor).toMatch(/maior que zero/);
    expect(validarOferta({ valor: "dez mil" }).valor).toMatch(/numérico/);
    expect(validarOferta({ valor: "300.000" })).toEqual({});
  });

  it("limita o tamanho da mensagem", () => {
    expect(validarOferta({ valor: "1", mensagem: "a".repeat(1001) }).mensagem).toBeTruthy();
  });

  it("mostra cada ação só para o perfil e status certos", () => {
    const pendente = { status: "PENDENTE" };
    expect(acoesOferta("USER", pendente)).toMatchObject({ cancelar: true, aceitar: false });
    expect(acoesOferta("CORRETOR", pendente)).toMatchObject({ aceitar: true, recusar: true, cancelar: false });
    expect(acoesOferta("ADMIN", pendente)).toEqual({ cancelar: false, aceitar: false, recusar: false, prepararContrato: false });
    expect(acoesOferta("USER", { status: "ACEITA" }).cancelar).toBe(false);
    expect(acoesOferta("CORRETOR", { status: "ACEITA" }).prepararContrato).toBe(true);
    expect(acoesOferta("CORRETOR", { status: "ACEITA", contratoId: 3 }).prepararContrato).toBe(false);
  });
});

describe("contratos", () => {
  it("valida valor, forma de pagamento e condições", () => {
    const erros = validarContrato({ valor: "0", formaPagamento: " ", condicoes: "curto" });
    expect(Object.keys(erros).sort()).toEqual(["condicoes", "formaPagamento", "valor"]);
    expect(validarContrato({ valor: "480000", formaPagamento: "À vista", condicoes: "Entrega das chaves em 30 dias após a escritura." })).toEqual({});
  });

  it("segue o fluxo aprovar (admin) → assinar (cliente) → revisar (corretor)", () => {
    expect(acoesContrato("ADMIN", { status: "AGUARDANDO_APROVACAO" })).toMatchObject({ aprovar: true, reprovar: true, assinar: false });
    expect(acoesContrato("USER", { status: "AGUARDANDO_APROVACAO" }).assinar).toBe(false);
    expect(acoesContrato("USER", { status: "APROVADO" }).assinar).toBe(true);
    expect(acoesContrato("ADMIN", { status: "APROVADO" }).aprovar).toBe(false);
    expect(acoesContrato("CORRETOR", { status: "REPROVADO" }).revisar).toBe(true);
    expect(acoesContrato("CORRETOR", { status: "ASSINADO" }).revisar).toBe(false);
  });

  it("calcula a etapa da linha do tempo", () => {
    expect(etapaContrato("AGUARDANDO_APROVACAO")).toBe(2);
    expect(etapaContrato("REPROVADO")).toBe(2);
    expect(etapaContrato("APROVADO")).toBe(3);
    expect(etapaContrato("ASSINADO")).toBe(5);
  });

  it("compara o nome da assinatura sem acentos, maiúsculas ou espaços extras", () => {
    expect(normalizarNome("  JOSÉ   da  Silva ")).toBe("jose da silva");
    expect(validarAssinatura({ nomeAssinatura: "jose da silva", aceite: true }, "José da Silva")).toEqual({});
    expect(validarAssinatura({ nomeAssinatura: "Outra Pessoa", aceite: true }, "José da Silva").nomeAssinatura).toMatch(/não confere/);
    expect(validarAssinatura({ nomeAssinatura: "José da Silva", aceite: false }, "José da Silva").aceite).toBeTruthy();
  });
});

describe("busca de imóveis", () => {
  it("monta a query só com os filtros preenchidos", () => {
    const query = new URLSearchParams(montarBusca({ q: " centro ", finalidade: "VENDA", precoMax: "500.000", dormitoriosMin: "2" }, 1, 6));
    expect(Object.fromEntries(query)).toEqual({
      q: "centro", finalidade: "VENDA", precoMax: "500000", dormitoriosMin: "2", ordem: "destaque", page: "1", size: "6",
    });
  });

  it("ignora finalidade TODOS e página negativa", () => {
    const query = new URLSearchParams(montarBusca({ finalidade: "TODOS" }, -3));
    expect(query.has("finalidade")).toBe(false);
    expect(query.get("page")).toBe("0");
  });

  it("valida a faixa de preço", () => {
    expect(validarFaixaPreco({ precoMin: "500000", precoMax: "100000" })).toMatch(/não pode ser maior/);
    expect(validarFaixaPreco({ precoMin: "abc", precoMax: "" })).toMatch(/inválido/);
    expect(validarFaixaPreco({ precoMin: "", precoMax: "" })).toBe("");
  });

  it("trata status nulo como disponível", () => {
    expect(imovelDisponivel(null)).toBe(true);
    expect(imovelDisponivel("DISPONIVEL")).toBe(true);
    expect(imovelDisponivel("em_negociacao")).toBe(false);
    expect(imovelDisponivel("VENDIDO")).toBe(false);
  });
});
