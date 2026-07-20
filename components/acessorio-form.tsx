"use client";

import { useActionState } from "react";
import Link from "next/link";
import { salvarAcessorio } from "@/lib/actions/acessorios";
import { TIPOS_ACESSORIO, UNIDADES } from "@/lib/constantes";

export interface AcessorioFormDados {
  id: number;
  nome: string;
  tipo: string;
  unidade: string;
  preco: number;
  largura: number;
  fornecedor: string;
  estoque: number;
  estoqueMinimo: number;
  ativo: boolean;
}

export function AcessorioForm({ acessorio }: { acessorio: AcessorioFormDados }) {
  const [erros, acaoSalvar, pendente] = useActionState(salvarAcessorio, null);

  return (
    <form action={acaoSalvar} className="cartao">
      <input type="hidden" name="id" value={acessorio.id} />

      {erros && erros.length > 0 && (
        <div className="aviso aviso--erro">
          {erros.map((erro) => (
            <div key={erro}>{erro}</div>
          ))}
        </div>
      )}

      <div className="grade">
        <div className="campo" style={{ gridColumn: "span 2" }}>
          <label className="campo__rotulo" htmlFor="nome">Nome *</label>
          <input type="text" id="nome" name="nome" defaultValue={acessorio.nome} required />
        </div>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="tipo">Tipo *</label>
          <select id="tipo" name="tipo" defaultValue={acessorio.tipo} required>
            {Object.entries(TIPOS_ACESSORIO).map(([chave, rotulo]) => (
              <option key={chave} value={chave}>{rotulo}</option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="unidade">Unidade *</label>
          <select id="unidade" name="unidade" defaultValue={acessorio.unidade} required>
            {Object.entries(UNIDADES).map(([chave, rotulo]) => (
              <option key={chave} value={chave}>{rotulo}</option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="preco">Preço (R$)</label>
          <input type="number" id="preco" name="preco" step="0.01" min="0"
                 defaultValue={acessorio.preco || ""} />
        </div>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="largura">Largura (m)</label>
          <input type="number" id="largura" name="largura" step="0.01" min="0"
                 defaultValue={acessorio.largura || ""} />
          <span className="campo__dica">Só para forro e entretela — usada no cálculo.</span>
        </div>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="fornecedor">Fornecedor</label>
          <input type="text" id="fornecedor" name="fornecedor" defaultValue={acessorio.fornecedor} />
        </div>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="estoque">Em estoque</label>
          <input type="number" id="estoque" name="estoque" step="0.01" min="0"
                 defaultValue={acessorio.estoque || ""} />
        </div>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="estoque_minimo">Estoque mínimo</label>
          <input type="number" id="estoque_minimo" name="estoque_minimo" step="0.01" min="0"
                 defaultValue={acessorio.estoqueMinimo || ""} />
        </div>
      </div>

      <label className="campo__linha">
        <input type="checkbox" name="ativo" value="1" defaultChecked={acessorio.ativo} />
        Ativo
      </label>

      <div className="form-pe">
        <Link className="btn" href="/acessorios">Cancelar</Link>
        <button className="btn btn--primario" type="submit" disabled={pendente}>
          {pendente ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
