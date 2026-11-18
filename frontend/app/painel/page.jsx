"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedArea from "../protected-area";
import { useAuth } from "../auth-provider";
import { useRecurso } from "../../lib/use-api";
import { PERFIS, ROTULO_PERFIL } from "../../lib/regras";
import Abas from "../_components/abas";
import { Carregando, Mensagem, Recurso, Vazio } from "../_components/estados";
import { ListaOfertas } from "../_components/ofertas";
import { ListaContratos } from "../_components/contratos";
import { PainelAdmin } from "../_components/paineis";

const ABAS = ["painel", "aprovacoes", "ofertas", "usuarios"];
const NOVO_USUARIO = { nome: "", email: "", senha: "", tipo: "CORRETOR" };

function NovoUsuarioForm({ onCriado }) {
  const { apiFetch } = useAuth();
  const [dados, setDados] = useState(NOVO_USUARIO);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const alterar = (campo) => (e) => setDados((atual) => ({ ...atual, [campo]: e.target.value }));

  async function enviar(event) {
    event.preventDefault();
    setErro("");
    if (!dados.nome.trim() || !dados.email.includes("@") || !dados.senha) {
      setErro("Preencha nome, um e-mail válido e a senha.");
      return;
    }
    setEnviando(true);
    try {
      const response = await apiFetch("/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dados, nome: dados.nome.trim(), email: dados.email.trim() }),
      });
      if (!response.ok) {
        const corpo = await response.json().catch(() => null);
        throw new Error(corpo?.mensagem || `A API respondeu com o erro ${response.status}.`);
      }
      onCriado(dados);
      setDados(NOVO_USUARIO);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="form-inline-card" onSubmit={enviar} noValidate>
      <h4>Cadastrar usuário</h4>
      <div className="form-grid">
        <div><label htmlFor="novo-nome">Nome</label><input id="novo-nome" value={dados.nome} onChange={alterar("nome")} /></div>
        <div><label htmlFor="novo-email">E-mail</label><input id="novo-email" type="email" value={dados.email} onChange={alterar("email")} /></div>
        <div><label htmlFor="novo-senha">Senha inicial</label><input id="novo-senha" type="password" value={dados.senha} onChange={alterar("senha")} /></div>
        <div>
          <label htmlFor="novo-tipo">Perfil</label>
          <select id="novo-tipo" value={dados.tipo} onChange={alterar("tipo")}>
            {PERFIS.map((p) => <option key={p} value={p}>{ROTULO_PERFIL[p]}</option>)}
          </select>
        </div>
      </div>
      {erro && <p className="form-error" role="alert">{erro}</p>}
      <div className="form-acoes">
        <button className="primary-button" type="submit" disabled={enviando}>{enviando ? "Salvando..." : "Cadastrar"}</button>
      </div>
    </form>
  );
}

function PainelAdministrativo() {
  const { apiJson } = useAuth();
  const params = useSearchParams();
  const [aba, setAba] = useState(ABAS.includes(params.get("aba")) ? params.get("aba") : "painel");
  const [todos, setTodos] = useState(false);
  const [aviso, setAviso] = useState("");
  const painel = useRecurso((signal) => apiJson("/dashboard/admin", { signal }), `painel-${aba}`);
  const contratos = useRecurso((signal) => apiJson("/contratos", { signal }), aba === "aprovacoes" ? "contratos" : null);
  const ofertas = useRecurso((signal) => apiJson("/ofertas", { signal }), aba === "ofertas" ? "ofertas" : null);
  const usuarios = useRecurso((signal) => apiJson("/users", { signal }), aba === "usuarios" ? "usuarios" : null);

  const i = painel.data?.indicadores;
  const visiveis = (lista) => (todos ? lista : lista.filter((c) => c.status === "AGUARDANDO_APROVACAO"));

  return (
    <section className="dashboard">
      <p className="eyebrow">PAINEL ADMINISTRATIVO</p>
      <h1>Olá, administrador</h1>
      <p className="dashboard-copy">Acompanhe os indicadores, aprove os contratos enviados pelos corretores e gerencie os usuários.</p>

      <Abas rotulo="Seções do painel" ativa={aba} onChange={(id) => { setAviso(""); setAba(id); }} abas={[
        { id: "painel", rotulo: "Indicadores" },
        { id: "aprovacoes", rotulo: "Aprovação de contratos", contador: i?.contratosAguardandoAprovacao },
        { id: "ofertas", rotulo: "Ofertas", contador: i?.ofertasPendentes },
        { id: "usuarios", rotulo: "Usuários" },
      ]} />

      <Mensagem onFechar={() => setAviso("")}>{aviso}</Mensagem>

      <div className="aba-conteudo" role="tabpanel" aria-labelledby={`aba-${aba}`}>
        {aba === "painel" && (
          <Recurso recurso={painel} textoCarregando="Carregando indicadores...">
            {(dados) => <PainelAdmin dados={dados} />}
          </Recurso>
        )}

        {aba === "aprovacoes" && (
          <>
            <label className="checkbox filtro-lista">
              <input type="checkbox" checked={todos} onChange={(e) => setTodos(e.target.checked)} />
              <span>Mostrar também contratos já avaliados</span>
            </label>
            <Recurso recurso={contratos} textoCarregando="Carregando contratos...">
              {(lista) => visiveis(lista).length === 0 ? (
                <Vazio titulo="Nenhum contrato aguardando aprovação" texto="Os contratos preparados pelos corretores aparecem aqui." />
              ) : (
                <ListaContratos contratos={visiveis(lista)} perfil="ADMIN" onAtualizado={(novo) => {
                  contratos.atualizar((atual) => atual.map((c) => (c.id === novo.id ? novo : c)));
                  setAviso(novo.status === "APROVADO"
                    ? `Contrato #${novo.id} aprovado. O cliente já pode assinar.`
                    : `Contrato #${novo.id} reprovado e devolvido ao corretor.`);
                  painel.recarregar();
                }} />
              )}
            </Recurso>
          </>
        )}

        {aba === "ofertas" && (
          <Recurso recurso={ofertas} textoCarregando="Carregando ofertas..." vazio={<Vazio titulo="Nenhuma oferta registrada" />}>
            {(lista) => <ListaOfertas ofertas={lista} perfil="ADMIN" onAtualizada={() => ofertas.recarregar()} />}
          </Recurso>
        )}

        {aba === "usuarios" && (
          <>
            <NovoUsuarioForm onCriado={(u) => { setAviso(`Usuário ${u.email} cadastrado como ${ROTULO_PERFIL[u.tipo]}.`); usuarios.recarregar(); }} />
            <Recurso recurso={usuarios} textoCarregando="Carregando usuários...">
              {(lista) => (
                <table className="tabela">
                  <caption className="visually-hidden">Usuários cadastrados</caption>
                  <thead><tr><th scope="col">Nome</th><th scope="col">E-mail</th><th scope="col">Perfil</th></tr></thead>
                  <tbody>
                    {lista.map((u) => (
                      <tr key={u.id}><td>{u.nome}</td><td>{u.email}</td><td>{ROTULO_PERFIL[String(u.tipo || "").replace(/^ROLE_/, "")] || u.tipo}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Recurso>
          </>
        )}
      </div>
    </section>
  );
}

export default function AdminPanelPage() {
  return (
    <ProtectedArea requiredRole="ADMIN">
      <Suspense fallback={<Carregando />}>
        <PainelAdministrativo />
      </Suspense>
    </ProtectedArea>
  );
}
