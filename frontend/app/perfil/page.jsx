"use client";

import { useState } from "react";
import ProtectedArea from "../protected-area";
import { useAuth } from "../auth-provider";
import { useRecurso } from "../../lib/use-api";
import { PERFIS, ROTULO_PERFIL } from "../../lib/regras";
import { Mensagem, Recurso } from "../_components/estados";

function FormPerfil({ usuario, onSalvo }) {
  const { apiJson } = useAuth();
  const [nome, setNome] = useState(usuario.nome || "");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar(event) {
    event.preventDefault();
    setErro("");
    setOk("");
    if (!nome.trim()) {
      setErro("O nome não pode ficar em branco.");
      return;
    }
    if (novaSenha && !senhaAtual) {
      setErro("Informe a senha atual para definir uma nova senha.");
      return;
    }
    setSalvando(true);
    try {
      const atualizado = await apiJson("/perfil", { method: "PUT", body: { nome: nome.trim(), senhaAtual: senhaAtual || null, novaSenha: novaSenha || null } });
      setSenhaAtual("");
      setNovaSenha("");
      setOk("Perfil atualizado.");
      onSalvo(atualizado);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className="auth-form perfil-form" onSubmit={salvar} noValidate>
      <label htmlFor="perfil-nome">Nome completo</label>
      <input id="perfil-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
      <p className="campo-ajuda">É este nome que você digita para assinar contratos.</p>
      <label htmlFor="perfil-senha-atual">Senha atual</label>
      <input id="perfil-senha-atual" type="password" autoComplete="current-password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
      <label htmlFor="perfil-nova-senha">Nova senha (opcional)</label>
      <input id="perfil-nova-senha" type="password" autoComplete="new-password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
      {erro && <p className="form-error" role="alert">{erro}</p>}
      <Mensagem>{ok}</Mensagem>
      <button className="primary-button" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar alterações"}</button>
    </form>
  );
}

function MeuPerfil() {
  const { apiJson } = useAuth();
  const perfil = useRecurso((signal) => apiJson("/perfil", { signal }), "perfil");
  return (
    <section className="dashboard">
      <p className="eyebrow">MEU PERFIL</p>
      <Recurso recurso={perfil} textoCarregando="Carregando seu perfil...">
        {(usuario) => (
          <>
            <h1>{usuario.nome}</h1>
            <p className="dashboard-copy">{usuario.email} · {ROTULO_PERFIL[usuario.tipo] || usuario.tipo}</p>
            <FormPerfil usuario={usuario} onSalvo={(novo) => perfil.atualizar(() => novo)} />
          </>
        )}
      </Recurso>
    </section>
  );
}

export default function PerfilPage() {
  return (
    <ProtectedArea requiredRole={PERFIS}>
      <MeuPerfil />
    </ProtectedArea>
  );
}
