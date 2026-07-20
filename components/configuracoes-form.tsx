"use client";

import { useActionState } from "react";
import Link from "next/link";
import { salvarConfiguracoes } from "@/lib/actions/configuracoes";
import { CAMPOS_CALCULO, CAMPOS_EMPRESA } from "@/lib/config-campos";

export function ConfiguracoesForm({ valores }: { valores: Record<string, string> }) {
  const [erros, acaoSalvar, pendente] = useActionState(salvarConfiguracoes, null);

  return (
    <form action={acaoSalvar}>
      {erros && erros.length > 0 && (
        <div className="aviso aviso--erro">
          {erros.map((erro) => (
            <div key={erro}>{erro}</div>
          ))}
        </div>
      )}

      <div className="cartao" style={{ marginBottom: "1rem" }}>
        <div className="bloco__titulo">Padrões de cálculo</div>
        <div className="grade">
          {Object.entries(CAMPOS_CALCULO).map(([chave, spec]) => (
            <div className="campo" key={chave}>
              <label className="campo__rotulo" htmlFor={chave}>{spec.rotulo}</label>
              <input
                type="number"
                id={chave}
                name={chave}
                step={spec.passo}
                min={spec.min}
                max={spec.max}
                defaultValue={valores[chave] ?? ""}
              />
              <span className="campo__dica">{spec.dica}</span>
            </div>
          ))}
        </div>
        <p className="campo__dica" style={{ marginTop: ".6rem" }}>
          O encolhimento não fica aqui: ele é próprio de cada tecido e se cadastra em{" "}
          <Link href="/tecidos">Tecidos</Link>. O fator de franzimento e a margem de barras ficam em{" "}
          <Link href="/modelos">Modelos</Link>.
        </p>
      </div>

      <div className="cartao">
        <div className="bloco__titulo">Dados da empresa</div>
        <div className="grade">
          {Object.entries(CAMPOS_EMPRESA).map(([chave, rotulo]) => (
            <div className="campo" key={chave}>
              <label className="campo__rotulo" htmlFor={chave}>{rotulo}</label>
              <input type="text" id={chave} name={chave} defaultValue={valores[chave] ?? ""} />
            </div>
          ))}
        </div>
        <p className="campo__dica">Aparecem no cabeçalho dos orçamentos impressos.</p>
      </div>

      <div className="form-pe">
        <button className="btn btn--primario" type="submit" disabled={pendente}>
          {pendente ? "Salvando…" : "Salvar configurações"}
        </button>
      </div>
    </form>
  );
}
