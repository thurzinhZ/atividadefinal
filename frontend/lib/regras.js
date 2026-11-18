// Regras de negócio e formatação usadas pelo frontend.
// Funções puras (sem React) para poderem ser testadas isoladamente.
// As mesmas regras são validadas de novo no backend: aqui servem para
// mostrar só as ações possíveis e dar retorno rápido no formulário.

export const PERFIS = ["USER", "CORRETOR", "ADMIN"];

export const ROTULO_PERFIL = {
  USER: "Cliente",
  CORRETOR: "Corretor",
  ADMIN: "Administrador",
};

export const STATUS_OFERTA = {
  PENDENTE: { rotulo: "Pendente", tom: "aviso" },
  ACEITA: { rotulo: "Aceita", tom: "sucesso" },
  RECUSADA: { rotulo: "Recusada", tom: "erro" },
  CANCELADA: { rotulo: "Cancelada", tom: "neutro" },
};

export const STATUS_CONTRATO = {
  AGUARDANDO_APROVACAO: { rotulo: "Aguardando aprovação", tom: "aviso" },
  APROVADO: { rotulo: "Aguardando assinatura", tom: "info" },
  REPROVADO: { rotulo: "Reprovado", tom: "erro" },
  ASSINADO: { rotulo: "Assinado", tom: "sucesso" },
};

export const STATUS_IMOVEL = {
  DISPONIVEL: { rotulo: "Disponível", tom: "sucesso" },
  EM_NEGOCIACAO: { rotulo: "Em negociação", tom: "aviso" },
  VENDIDO: { rotulo: "Vendido", tom: "neutro" },
  ALUGADO: { rotulo: "Alugado", tom: "neutro" },
  INATIVO: { rotulo: "Inativo", tom: "neutro" },
};

export const ETAPAS_FUNIL = {
  OFERTAS_ENVIADAS: "Ofertas enviadas",
  OFERTAS_ACEITAS: "Ofertas aceitas",
  CONTRATOS_APROVADOS: "Contratos aprovados",
  CONTRATOS_ASSINADOS: "Contratos assinados",
};

export const MIN_CONDICOES = 20;
export const MAX_MENSAGEM = 1000;

const INDISPONIVEIS = ["EM_NEGOCIACAO", "VENDIDO", "ALUGADO", "INATIVO"];

export function normalizarPerfil(tipo) {
  return String(tipo || "").trim().toUpperCase().replace(/^ROLE_/, "");
}

export function rotaInicial(perfil) {
  if (perfil === "ADMIN") return "/painel";
  if (perfil === "CORRETOR") return "/corretor";
  return "/area-cliente";
}

export function imovelDisponivel(status) {
  return !status || !INDISPONIVEIS.includes(String(status).trim().toUpperCase());
}

export function statusImovel(status) {
  return imovelDisponivel(status) ? "DISPONIVEL" : String(status).trim().toUpperCase();
}

export function rotuloStatus(mapa, status) {
  return mapa[status]?.rotulo || status || "—";
}

// Converte "350.000,50", "350000.5" ou número em Number; NaN se inválido
export function lerValor(valor) {
  if (typeof valor === "number") return valor;
  const texto = String(valor ?? "").trim().replace(/[R$\s]/g, "");
  if (!texto) return NaN;
  let normalizado = texto;
  if (texto.includes(",")) normalizado = texto.replace(/\./g, "").replace(",", "."); // 350.000,50
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(texto)) normalizado = texto.replace(/\./g, ""); // 350.000
  // demais casos ("350000" ou "350000.5") já estão no formato numérico
  return /^-?\d+(\.\d+)?$/.test(normalizado) ? Number(normalizado) : NaN;
}

export function validarOferta({ valor, mensagem }) {
  const erros = {};
  const numero = lerValor(valor);
  if (Number.isNaN(numero)) erros.valor = "Informe um valor numérico.";
  else if (numero <= 0) erros.valor = "O valor da oferta deve ser maior que zero.";
  if (mensagem && mensagem.trim().length > MAX_MENSAGEM) {
    erros.mensagem = `A mensagem pode ter no máximo ${MAX_MENSAGEM} caracteres.`;
  }
  return erros;
}

export function validarContrato({ valor, formaPagamento, condicoes }) {
  const erros = {};
  const numero = lerValor(valor);
  if (Number.isNaN(numero) || numero <= 0) erros.valor = "O valor do contrato deve ser maior que zero.";
  if (!formaPagamento || !formaPagamento.trim()) erros.formaPagamento = "Informe a forma de pagamento.";
  if (!condicoes || condicoes.trim().length < MIN_CONDICOES) {
    erros.condicoes = `Descreva as condições (mínimo de ${MIN_CONDICOES} caracteres).`;
  }
  return erros;
}

export function normalizarNome(nome) {
  return String(nome || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function validarAssinatura({ nomeAssinatura, aceite }, nomeCadastrado) {
  const erros = {};
  if (!aceite) erros.aceite = "É preciso aceitar os termos para assinar.";
  if (!nomeAssinatura || !nomeAssinatura.trim()) erros.nomeAssinatura = "Digite seu nome completo.";
  else if (nomeCadastrado && normalizarNome(nomeAssinatura) !== normalizarNome(nomeCadastrado)) {
    erros.nomeAssinatura = "O nome digitado não confere com o nome cadastrado.";
  }
  return erros;
}

// Quais ações cada perfil pode executar sobre uma oferta
export function acoesOferta(perfil, oferta) {
  const pendente = oferta?.status === "PENDENTE";
  return {
    cancelar: perfil === "USER" && pendente,
    aceitar: perfil === "CORRETOR" && pendente,
    recusar: perfil === "CORRETOR" && pendente,
    prepararContrato: perfil === "CORRETOR" && oferta?.status === "ACEITA" && !oferta?.contratoId,
  };
}

// Quais ações cada perfil pode executar sobre um contrato
export function acoesContrato(perfil, contrato) {
  const status = contrato?.status;
  return {
    aprovar: perfil === "ADMIN" && status === "AGUARDANDO_APROVACAO",
    reprovar: perfil === "ADMIN" && status === "AGUARDANDO_APROVACAO",
    revisar: perfil === "CORRETOR" && status === "REPROVADO",
    assinar: perfil === "USER" && status === "APROVADO",
  };
}

// Etapa atual no fluxo oferta -> contrato (para a linha do tempo)
export const ETAPAS_FLUXO = ["Oferta enviada", "Oferta aceita", "Contrato enviado", "Aprovado", "Assinado"];

export function etapaContrato(status) {
  switch (status) {
    case "AGUARDANDO_APROVACAO":
    case "REPROVADO":
      return 2;
    case "APROVADO":
      return 3;
    case "ASSINADO":
      return ETAPAS_FLUXO.length; // todas as etapas concluídas
    default:
      return 1;
  }
}

export function precoDoImovel(imovel) {
  if (!imovel) return null;
  return String(imovel.finalidade || "").toUpperCase() === "ALUGUEL" ? imovel.precoAluguel : imovel.precoVenda;
}

export function formatarMoeda(valor) {
  if (valor == null || valor === "" || Number.isNaN(Number(valor))) return "Consulte o valor";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(valor));
}

export function formatarMoedaCurta(valor) {
  const numero = Number(valor) || 0;
  if (Math.abs(numero) >= 1_000_000) return `R$ ${(numero / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (Math.abs(numero) >= 1_000) return `R$ ${(numero / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`;
  return formatarMoeda(numero);
}

export function formatarData(iso) {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// "2026-11" -> "nov/26"
export function rotuloMes(anoMes) {
  const [ano, mes] = String(anoMes || "").split("-");
  const indice = Number(mes) - 1;
  if (!ano || indice < 0 || indice > 11) return anoMes;
  return `${MESES[indice]}/${ano.slice(2)}`;
}

export const FILTROS_PADRAO = {
  q: "",
  finalidade: "TODOS",
  tipoId: "",
  bairroId: "",
  precoMin: "",
  precoMax: "",
  dormitoriosMin: "",
  status: "",
  ordem: "destaque",
};

// Monta a query string de /imoveis/busca ignorando filtros vazios
export function montarBusca(filtros, page = 0, size = 6) {
  const params = new URLSearchParams();
  const f = { ...FILTROS_PADRAO, ...filtros };
  if (f.q.trim()) params.set("q", f.q.trim());
  if (f.finalidade && f.finalidade !== "TODOS") params.set("finalidade", f.finalidade);
  for (const campo of ["tipoId", "bairroId", "dormitoriosMin", "status"]) {
    if (f[campo] !== "" && f[campo] != null) params.set(campo, String(f[campo]));
  }
  for (const campo of ["precoMin", "precoMax"]) {
    const numero = lerValor(f[campo]);
    if (f[campo] !== "" && !Number.isNaN(numero)) params.set(campo, String(numero));
  }
  params.set("ordem", f.ordem || "destaque");
  params.set("page", String(Math.max(0, page)));
  params.set("size", String(size));
  return params.toString();
}

export function validarFaixaPreco({ precoMin, precoMax }) {
  const min = lerValor(precoMin);
  const max = lerValor(precoMax);
  if (precoMin !== "" && Number.isNaN(min)) return "Preço mínimo inválido.";
  if (precoMax !== "" && Number.isNaN(max)) return "Preço máximo inválido.";
  if (!Number.isNaN(min) && !Number.isNaN(max) && min > max) return "O preço mínimo não pode ser maior que o máximo.";
  return "";
}
