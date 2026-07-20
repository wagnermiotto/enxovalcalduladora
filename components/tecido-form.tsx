"use client";

import { useRef, useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { salvarTecido } from "@/lib/actions/tecidos";
import { ENCOLHIMENTO_SUGERIDO, TIPOS_TECIDO } from "@/lib/constantes";

export interface TecidoFormDados {
  id: number;
  nome: string;
  codigo: string;
  tipo: string;
  composicao: string;
  cor: string;
  largura: number;
  precoMetro: number;
  encolhimentoPercent: number;
  rapport: number;
  estampado: boolean;
  fornecedor: string;
  estoqueMetros: number;
  estoqueMinimo: number;
  observacoes: string;
  ativo: boolean;
}

export function TecidoForm({ tecido }: { tecido: TecidoFormDados }) {
  const [erros, acaoSalvar, pendente] = useActionState(salvarTecido, null);
  // Sugere o encolhimento típico ao trocar o tipo — só enquanto o usuário
  // não mexeu no campo, para nunca sobrescrever um valor medido.
  const tocado = useRef(false);
  const [encolhimento, setEncolhimento] = useState(String(tecido.encolhimentoPercent));

  return (
    <form action={acaoSalvar} className="cartao">
      <input type="hidden" name="id" value={tecido.id} />

      {erros && erros.length > 0 && (
        <div className="aviso aviso--erro">
          {erros.map((erro) => (
            <div key={erro}>{erro}</div>
          ))}
        </div>
      )}

      <div className="bloco">
        <div className="bloco__titulo">Identificação</div>
        <div className="grade">
          <div className="campo" style={{ gridColumn: "span 2" }}>
            <label className="campo__rotulo" htmlFor="nome">Nome *</label>
            <input type="text" id="nome" name="nome" defaultValue={tecido.nome} required />
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="codigo">Código</label>
            <input type="text" id="codigo" name="codigo" defaultValue={tecido.codigo} />
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="cor">Cor</label>
            <input type="text" id="cor" name="cor" defaultValue={tecido.cor} />
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="tipo">Tipo *</label>
            <select
              id="tipo"
              name="tipo"
              defaultValue={tecido.tipo}
              required
              onChange={(e) => {
                if (!tocado.current) {
                  setEncolhimento(String(ENCOLHIMENTO_SUGERIDO[e.target.value] ?? 3));
                }
              }}
            >
              {Object.entries(TIPOS_TECIDO).map(([chave, rotulo]) => (
                <option key={chave} value={chave}>{rotulo}</option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="composicao">Composição</label>
            <input type="text" id="composicao" name="composicao" defaultValue={tecido.composicao}
                   placeholder="ex.: 100% poliéster" />
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="fornecedor">Fornecedor</label>
            <input type="text" id="fornecedor" name="fornecedor" defaultValue={tecido.fornecedor} />
          </div>
        </div>
      </div>

      <div className="bloco">
        <div className="bloco__titulo">Dados que entram no cálculo</div>
        <div className="grade">
          <div className="campo">
            <label className="campo__rotulo" htmlFor="largura">Largura do rolo (m) *</label>
            <input type="number" id="largura" name="largura" step="0.01" min="0.1" max="4"
                   defaultValue={tecido.largura || ""} required />
            <span className="campo__dica">
              É ela que decide o corte: rolo alto o bastante corta travessado, sem emendas.
            </span>
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="preco_metro">Preço por metro (R$)</label>
            <input type="number" id="preco_metro" name="preco_metro" step="0.01" min="0"
                   defaultValue={tecido.precoMetro || ""} />
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="encolhimento_percent">Encolhimento (%)</label>
            <input type="number" id="encolhimento_percent" name="encolhimento_percent" step="0.5" min="0" max="50"
                   value={encolhimento}
                   onChange={(e) => {
                     tocado.current = true;
                     setEncolhimento(e.target.value);
                   }} />
            <span className="campo__dica">Fibras naturais encolhem na primeira lavagem; sintéticas quase não.</span>
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="rapport">Rapport (m)</label>
            <input type="number" id="rapport" name="rapport" step="0.01" min="0"
                   defaultValue={tecido.rapport || ""} />
            <span className="campo__dica">
              Distância em que a estampa se repete. Medida, o cálculo vira exato; em branco, entra por estimativa.
            </span>
          </div>
          <div className="campo">
            <label className="campo__rotulo">&nbsp;</label>
            <label className="campo__linha">
              <input type="checkbox" name="estampado" value="1" defaultChecked={tecido.estampado} />
              Tecido estampado
            </label>
          </div>
        </div>
      </div>

      <div className="bloco">
        <div className="bloco__titulo">Estoque</div>
        <div className="grade">
          <div className="campo">
            <label className="campo__rotulo" htmlFor="estoque_metros">Em estoque (m)</label>
            <input type="number" id="estoque_metros" name="estoque_metros" step="0.01" min="0"
                   defaultValue={tecido.estoqueMetros || ""} />
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="estoque_minimo">Estoque mínimo (m)</label>
            <input type="number" id="estoque_minimo" name="estoque_minimo" step="0.01" min="0"
                   defaultValue={tecido.estoqueMinimo || ""} />
          </div>
        </div>
      </div>

      <div className="bloco">
        <div className="campo">
          <label className="campo__rotulo" htmlFor="observacoes">Observações</label>
          <textarea id="observacoes" name="observacoes" defaultValue={tecido.observacoes} />
        </div>
        <label className="campo__linha">
          <input type="checkbox" name="ativo" value="1" defaultChecked={tecido.ativo} />
          Ativo (aparece na calculadora)
        </label>
      </div>

      <div className="form-pe">
        <Link className="btn" href="/tecidos">Cancelar</Link>
        <button className="btn btn--primario" type="submit" disabled={pendente}>
          {pendente ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
