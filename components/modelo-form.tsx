"use client";

import { useActionState } from "react";
import Link from "next/link";
import { salvarModelo } from "@/lib/actions/modelos";

export interface ModeloFormDados {
  id: number;
  nome: string;
  fatorFranzimento: number;
  margemBarras: number;
  usaEntretela: boolean;
  usaIlhos: boolean;
  espacamentoIlhos: number;
  descricao: string;
  ativo: boolean;
}

export function ModeloForm({ modelo }: { modelo: ModeloFormDados }) {
  const [erros, acaoSalvar, pendente] = useActionState(salvarModelo, null);

  return (
    <form action={acaoSalvar} className="cartao">
      <input type="hidden" name="id" value={modelo.id} />

      {erros && erros.length > 0 && (
        <div className="aviso aviso--erro">
          {erros.map((erro) => (
            <div key={erro}>{erro}</div>
          ))}
        </div>
      )}

      <div className="bloco">
        <div className="grade">
          <div className="campo" style={{ gridColumn: "span 2" }}>
            <label className="campo__rotulo" htmlFor="nome">Nome *</label>
            <input type="text" id="nome" name="nome" defaultValue={modelo.nome} required
                   placeholder="ex.: Prega americana" />
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="fator_franzimento">Fator de franzimento *</label>
            <input type="number" id="fator_franzimento" name="fator_franzimento" step="0.05" min="0.5" max="5"
                   defaultValue={modelo.fatorFranzimento || ""} required />
            <span className="campo__dica">2,6 significa 2,6 m de tecido para cada metro de varão.</span>
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="margem_barras">Margem de barras (m) *</label>
            <input type="number" id="margem_barras" name="margem_barras" step="0.01" min="0" max="1"
                   defaultValue={modelo.margemBarras} required />
            <span className="campo__dica">Somada à altura. Costuma ser 0,27 com entretela e 0,20 sem.</span>
          </div>
        </div>
      </div>

      <div className="bloco">
        <div className="bloco__titulo">Acabamento</div>
        <div className="grade">
          <div className="campo">
            <label className="campo__linha">
              <input type="checkbox" name="usa_entretela" value="1" defaultChecked={modelo.usaEntretela} />
              Leva entretela no cabeçalho
            </label>
            <label className="campo__linha" style={{ marginTop: ".5rem" }}>
              <input type="checkbox" name="usa_ilhos" value="1" defaultChecked={modelo.usaIlhos} />
              Leva ilhoses
            </label>
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="espacamento_ilhos">Espaçamento dos ilhoses (m)</label>
            <input type="number" id="espacamento_ilhos" name="espacamento_ilhos" step="0.01" min="0"
                   defaultValue={modelo.espacamentoIlhos} />
            <span className="campo__dica">A quantidade sai sempre par, para as pontas virarem para o mesmo lado.</span>
          </div>
        </div>
      </div>

      <div className="bloco">
        <div className="campo">
          <label className="campo__rotulo" htmlFor="descricao">Descrição</label>
          <textarea id="descricao" name="descricao" defaultValue={modelo.descricao} />
        </div>
        <label className="campo__linha">
          <input type="checkbox" name="ativo" value="1" defaultChecked={modelo.ativo} />
          Ativo (aparece na calculadora)
        </label>
      </div>

      <div className="form-pe">
        <Link className="btn" href="/modelos">Cancelar</Link>
        <button className="btn btn--primario" type="submit" disabled={pendente}>
          {pendente ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
