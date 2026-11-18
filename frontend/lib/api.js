// Utilitários de chamada à API. As rotas passam pelo rewrite /backend-api do Next.

// Lê a mensagem de erro no formato do backend: { status, erro, mensagem }
export async function lerErro(response, padrao = "Não foi possível concluir a operação.") {
  try {
    const corpo = await response.json();
    if (corpo && typeof corpo.mensagem === "string" && corpo.mensagem) return corpo.mensagem;
  } catch {
    // corpo vazio ou não-JSON
  }
  if (response.status === 404) return "Recurso não encontrado.";
  if (response.status >= 500) return "O servidor encontrou um erro. Tente novamente em instantes.";
  return padrao;
}

// GET público (sem token)
export async function buscarPublico(path, { signal } = {}) {
  let response;
  try {
    response = await fetch(`/backend-api${path}`, { signal, cache: "no-store" });
  } catch (erro) {
    if (erro?.name === "AbortError") throw erro;
    throw new Error("Não foi possível conectar ao servidor. Verifique se o backend está rodando.");
  }
  if (!response.ok) throw new Error(await lerErro(response, `A API respondeu com o erro ${response.status}.`));
  return response.json();
}
