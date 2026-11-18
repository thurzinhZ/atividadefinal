"use client";

// Estados padrão de carregamento, erro e lista vazia usados em todas as telas

export function Carregando({ texto = "Carregando...", linhas = 3 }) {
  return (
    <div className="estado-carregando" role="status" aria-live="polite">
      <span className="visually-hidden">{texto}</span>
      <div aria-hidden="true">
        {Array.from({ length: linhas }, (_, i) => <span className="skeleton-linha" key={i} />)}
      </div>
      <p className="estado-texto" aria-hidden="true">{texto}</p>
    </div>
  );
}

export function ErroCarregamento({ mensagem, onTentarNovamente, titulo = "Não foi possível carregar" }) {
  return (
    <div className="notice estado-erro" role="alert">
      <span className="notice-mark" aria-hidden="true">!</span>
      <div>
        <strong>{titulo}</strong>
        <p>{mensagem}</p>
        {onTentarNovamente && (
          <button className="secondary-button" type="button" onClick={onTentarNovamente}>Tentar novamente</button>
        )}
      </div>
    </div>
  );
}

export function Vazio({ titulo, texto, children }) {
  return (
    <div className="empty-state">
      <span className="empty-mark" aria-hidden="true">⌂</span>
      <h3>{titulo}</h3>
      {texto && <p>{texto}</p>}
      {children}
    </div>
  );
}

// Envolve uma área que depende de um recurso carregado com useRecurso
export function Recurso({ recurso, vazio, textoCarregando, children }) {
  if (recurso.loading && recurso.data == null) return <Carregando texto={textoCarregando} />;
  if (recurso.error) return <ErroCarregamento mensagem={recurso.error} onTentarNovamente={recurso.recarregar} />;
  if (recurso.data == null) return null;
  const estaVazio = Array.isArray(recurso.data) && recurso.data.length === 0;
  if (estaVazio && vazio) return vazio;
  return children(recurso.data);
}

export function Mensagem({ tipo = "sucesso", children, onFechar }) {
  if (!children) return null;
  return (
    <div className={`mensagem mensagem-${tipo}`} role={tipo === "erro" ? "alert" : "status"}>
      <span>{children}</span>
      {onFechar && <button type="button" aria-label="Fechar mensagem" onClick={onFechar}>×</button>}
    </div>
  );
}
