"use client";

import { useActionState } from "react";
import { entrar } from "@/lib/actions/sessao";

export default function LoginPage() {
  const [erro, acaoEntrar, pendente] = useActionState(entrar, null);

  return (
    <div className="login-tela">
      <div className="login-caixa">
        <div className="login-caixa__marca">
          <span className="topo__logo">E&amp;C</span>
          <h1>Enxovais &amp; Cortinas</h1>
        </div>

        {erro && <div className="aviso aviso--erro">{erro}</div>}

        <form action={acaoEntrar} autoComplete="on">
          <div className="campo">
            <label className="campo__rotulo" htmlFor="usuario">
              Usuário
            </label>
            <input type="text" id="usuario" name="usuario" required autoFocus />
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="senha">
              Senha
            </label>
            <input type="password" id="senha" name="senha" required />
          </div>
          <button
            className="btn btn--primario"
            type="submit"
            disabled={pendente}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {pendente ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
