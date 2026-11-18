"use client";

export default function Abas({ abas, ativa, onChange, rotulo }) {
  return (
    <div className="abas" role="tablist" aria-label={rotulo}>
      {abas.map((aba) => (
        <button
          key={aba.id}
          type="button"
          role="tab"
          id={`aba-${aba.id}`}
          aria-selected={ativa === aba.id}
          className={ativa === aba.id ? "aba ativa" : "aba"}
          onClick={() => onChange(aba.id)}
        >
          {aba.rotulo}
          {aba.contador > 0 && <span className="aba-contador">{aba.contador}</span>}
        </button>
      ))}
    </div>
  );
}
