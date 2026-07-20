"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { salvarOrcamento } from "@/lib/actions/orcamentos";
import {
  executarCalculo,
  type AcessorioLite,
  type ApoioCalculo,
  type ModeloLite,
  type TecidoLite,
  type ValoresFormulario,
} from "@/lib/calculo-executar";
import type { PadroesCalculo } from "@/lib/config-campos";
import { formatarMetros, formatarNumero, formatarReais, valorInput } from "@/lib/formatar";
import { ResultadoCalculo } from "@/components/resultado-calculo";

interface Props {
  /** Pré-preenchimento vindo da URL — o "Refazer com preços de hoje". */
  inicial?: Partial<Estado>;
  tecidos: TecidoLite[];
  modelos: ModeloLite[];
  ilhoses: AcessorioLite[];
  entretelas: AcessorioLite[];
  forros: AcessorioLite[];
  varoes: AcessorioLite[];
  padroes: PadroesCalculo;
  empresa: { fantasia: string; telefones: string };
}

interface Estado extends ValoresFormulario {
  tecido_id: string;
  modelo_id: string;
  cliente_nome: string;
  ambiente: string;
  validade_dias: string;
  condicoes_pagamento: string;
  ilhos_id: string;
  entretela_id: string;
  forro_id: string;
  varao_id: string;
}

const INICIAL: Estado = {
  largura_varao: "",
  altura: "",
  tecido_id: "",
  modelo_id: "",
  cliente_nome: "",
  ambiente: "",
  validade_dias: "",
  condicoes_pagamento: "",
  fator_franzimento: "",
  margem_barras: "",
  largura_tecido: "",
  preco_metro: "",
  encolhimento_percent: "",
  rapport: "",
  seguranca_percent: "",
  mao_obra_metro: "",
  margem_percent: "",
  forcar_metodo: "auto",
  usa_ilhos: false,
  usa_entretela: false,
  ilhos_id: "",
  entretela_id: "",
  forro_id: "",
  varao_id: "",
};

export function Calculadora({
  inicial,
  tecidos,
  modelos,
  ilhoses,
  entretelas,
  forros,
  varoes,
  padroes,
  empresa,
}: Props) {
  const [v, setV] = useState<Estado>(() => {
    const estado = { ...INICIAL, ...inicial };
    // Modelo vindo da URL também liga os acessórios de cabeçalho dele.
    const modeloInicial = modelos.find((m) => m.id === parseInt(estado.modelo_id, 10));
    if (modeloInicial) {
      estado.usa_ilhos = modeloInicial.usaIlhos;
      estado.usa_entretela = modeloInicial.usaEntretela;
    }
    return estado;
  });
  const [errosSalvar, acaoSalvar, salvando] = useActionState(salvarOrcamento, null);

  const por = <T extends { id: number }>(lista: T[], id: string): T | null =>
    lista.find((item) => item.id === parseInt(id, 10)) ?? null;

  const tecido = por(tecidos, v.tecido_id);
  const modelo = por(modelos, v.modelo_id);

  const apoio: ApoioCalculo = useMemo(
    () => ({
      tecido,
      modelo,
      ilhos: por(ilhoses, v.ilhos_id),
      entretela: por(entretelas, v.entretela_id),
      forro: por(forros, v.forro_id),
      varao: por(varoes, v.varao_id),
      padroes,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tecido, modelo, v.ilhos_id, v.entretela_id, v.forro_id, v.varao_id, padroes]
  );

  // O preview É a fórmula: o mesmo módulo lib/calculo.ts que a Server Action
  // usa para salvar roda aqui no navegador. Sem fetch, sem segunda verdade.
  const temMedidas =
    parseFloat(v.largura_varao) > 0 && parseFloat(v.altura) > 0 && tecido !== null && modelo !== null;
  const r = useMemo(
    () => (temMedidas ? executarCalculo(v, apoio) : null),
    [temMedidas, v, apoio]
  );

  const campo = (nome: keyof Estado) => ({
    id: nome,
    name: nome,
    value: String(v[nome]),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setV((atual) => ({ ...atual, [nome]: e.target.value })),
  });

  return (
    <div className="calc">
      {/* ---------------- formulário ---------------- */}
      <div className="calc__form cartao nao-imprimir">
        <div className="bloco">
          <div className="bloco__titulo">Medidas do vão</div>
          <div className="grade">
            <div className="campo">
              <label className="campo__rotulo" htmlFor="largura_varao">Largura do varão (m) *</label>
              <input type="number" step="0.01" min="0.1" required autoFocus {...campo("largura_varao")} />
            </div>
            <div className="campo">
              <label className="campo__rotulo" htmlFor="altura">Altura da cortina (m) *</label>
              <input type="number" step="0.01" min="0.1" required {...campo("altura")} />
            </div>
          </div>
        </div>

        <div className="bloco">
          <div className="bloco__titulo">Tecido e modelo</div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="tecido_id">Tecido *</label>
            <select {...campo("tecido_id")} required>
              <option value="">Escolha o tecido…</option>
              {tecidos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} — {formatarMetros(t.largura)} · {formatarReais(t.precoMetro)}/m
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="modelo_id">Modelo *</label>
            <select
              id="modelo_id"
              name="modelo_id"
              value={v.modelo_id}
              required
              onChange={(e) => {
                const novo = por(modelos, e.target.value);
                // O modelo escolhido liga/desliga os acessórios do cabeçalho —
                // como o data-ilhos/data-entretela do JS do PHP.
                setV((atual) => ({
                  ...atual,
                  modelo_id: e.target.value,
                  usa_ilhos: novo?.usaIlhos ?? false,
                  usa_entretela: novo?.usaEntretela ?? false,
                }));
              }}
            >
              <option value="">Escolha o modelo…</option>
              {modelos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} — fator {formatarNumero(m.fatorFranzimento)}×
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bloco">
          <div className="bloco__titulo">Identificação (opcional)</div>
          <div className="grade">
            <div className="campo">
              <label className="campo__rotulo" htmlFor="cliente_nome">Cliente</label>
              <input type="text" {...campo("cliente_nome")} />
            </div>
            <div className="campo">
              <label className="campo__rotulo" htmlFor="ambiente">Ambiente</label>
              <input type="text" placeholder="ex.: sala, quarto 1" {...campo("ambiente")} />
            </div>
            <div className="campo">
              <label className="campo__rotulo" htmlFor="validade_dias">Validade do orçamento (dias)</label>
              <input type="number" step="1" min="1" max="90"
                     placeholder={formatarNumero(padroes.validade_dias, 0)}
                     {...campo("validade_dias")} />
            </div>
            <div className="campo">
              <label className="campo__rotulo" htmlFor="condicoes_pagamento">Condições de pagamento</label>
              <input type="text" placeholder="ex.: 50% entrada + 50% na entrega"
                     {...campo("condicoes_pagamento")} />
            </div>
          </div>
        </div>

        <details className="avancado">
          <summary>Ajustes avançados</summary>
          <p className="campo__dica">
            Em branco, cada campo usa o valor do cadastro. Preencha só para sobrepor neste cálculo.
          </p>

          <div className="grade">
            <div className="campo">
              <label className="campo__rotulo" htmlFor="fator_franzimento">Fator de franzimento</label>
              <input type="number" step="0.05" min="0.5" max="5"
                     placeholder={modelo ? valorInput(modelo.fatorFranzimento) : "do modelo"}
                     {...campo("fator_franzimento")} />
            </div>
            <div className="campo">
              <label className="campo__rotulo" htmlFor="margem_barras">Margem de barras (m)</label>
              <input type="number" step="0.01" min="0" max="1"
                     placeholder={modelo ? valorInput(modelo.margemBarras) : "do modelo"}
                     {...campo("margem_barras")} />
            </div>
            <div className="campo">
              <label className="campo__rotulo" htmlFor="largura_tecido">Largura do tecido (m)</label>
              <input type="number" step="0.01" min="0.1" max="4"
                     placeholder={tecido ? valorInput(tecido.largura) : "do tecido"}
                     {...campo("largura_tecido")} />
            </div>
            <div className="campo">
              <label className="campo__rotulo" htmlFor="preco_metro">Preço por metro (R$)</label>
              <input type="number" step="0.01" min="0"
                     placeholder={tecido ? valorInput(tecido.precoMetro) : "do tecido"}
                     {...campo("preco_metro")} />
            </div>
            <div className="campo">
              <label className="campo__rotulo" htmlFor="encolhimento_percent">Encolhimento (%)</label>
              <input type="number" step="0.5" min="0" max="50"
                     placeholder={tecido ? valorInput(tecido.encolhimentoPercent, 1) : "do tecido"}
                     {...campo("encolhimento_percent")} />
            </div>
            <div className="campo">
              <label className="campo__rotulo" htmlFor="rapport">Rapport (m)</label>
              <input type="number" step="0.01" min="0"
                     placeholder={tecido ? valorInput(tecido.rapport) : "do tecido"}
                     {...campo("rapport")} />
            </div>
            <div className="campo">
              <label className="campo__rotulo" htmlFor="seguranca_percent">Margem de segurança (%)</label>
              <input type="number" step="0.5" min="0" max="50"
                     placeholder={`padrão: ${formatarNumero(padroes.seguranca_percent, 0)}%`}
                     {...campo("seguranca_percent")} />
            </div>
            <div className="campo">
              <label className="campo__rotulo" htmlFor="mao_obra_metro">Mão de obra (R$/metro)</label>
              <input type="number" step="0.5" min="0" max="500"
                     placeholder={`padrão: ${formatarReais(padroes.mao_obra_metro)}`}
                     {...campo("mao_obra_metro")} />
            </div>
            <div className="campo">
              <label className="campo__rotulo" htmlFor="margem_percent">Margem de lucro (%)</label>
              <input type="number" step="1" min="0" max="300"
                     placeholder={`padrão: ${formatarNumero(padroes.margem_percent, 0)}%`}
                     {...campo("margem_percent")} />
            </div>
            <div className="campo">
              <label className="campo__rotulo" htmlFor="forcar_metodo">Método de corte</label>
              <select {...campo("forcar_metodo")}>
                <option value="auto">Automático (recomendado)</option>
                <option value="travessado">Forçar travessado</option>
                <option value="tradicional">Forçar tradicional (panos)</option>
              </select>
            </div>
          </div>

          <div className="bloco__titulo" style={{ marginTop: ".8rem" }}>Acessórios</div>
          <div className="grade">
            <div className="campo">
              <label className="campo__rotulo" htmlFor="ilhos_id">Ilhós</label>
              <select {...campo("ilhos_id")}>
                <option value="">Não usar</option>
                {ilhoses.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome} — {formatarReais(a.preco)}</option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label className="campo__rotulo" htmlFor="entretela_id">Entretela</label>
              <select {...campo("entretela_id")}>
                <option value="">Não usar</option>
                {entretelas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome} — {formatarReais(a.preco)}/{a.unidade}</option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label className="campo__rotulo" htmlFor="forro_id">Forro</label>
              <select {...campo("forro_id")}>
                <option value="">Sem forro</option>
                {forros.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome} — {formatarMetros(a.largura)} · {formatarReais(a.preco)}/m
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label className="campo__rotulo" htmlFor="varao_id">Varão / trilho</label>
              <select {...campo("varao_id")}>
                <option value="">Não incluir</option>
                {varoes.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome} — {formatarReais(a.preco)}/{a.unidade}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="campo">
            <label className="campo__linha">
              <input
                type="checkbox"
                checked={v.usa_ilhos}
                onChange={(e) => setV((atual) => ({ ...atual, usa_ilhos: e.target.checked }))}
              />
              Calcular quantidade de ilhoses
            </label>
            <label className="campo__linha">
              <input
                type="checkbox"
                checked={v.usa_entretela}
                onChange={(e) => setV((atual) => ({ ...atual, usa_entretela: e.target.checked }))}
              />
              Calcular metragem de entretela
            </label>
          </div>
        </details>

        <div className="form-pe">
          <button className="btn" type="button" onClick={() => setV(INICIAL)}>Limpar</button>
        </div>
      </div>

      {/* ---------------- resultado ---------------- */}
      <div className="calc__saida">
        <div className="folha-cabecalho somente-imprimir">
          <strong>{empresa.fantasia}</strong>
          {empresa.telefones && <span>{empresa.telefones}</span>}
          <span>Cálculo de cortina — {new Date().toLocaleDateString("pt-BR")}</span>
          {(v.cliente_nome || v.ambiente) && (
            <span>{[v.cliente_nome, v.ambiente].filter(Boolean).join(" · ")}</span>
          )}
        </div>

        {r === null ? (
          <div className="vazio nao-imprimir">
            <p>Informe a largura do varão, a altura, o tecido e o modelo para ver o cálculo.</p>
          </div>
        ) : (
          <ResultadoCalculo r={r} />
        )}

        {r !== null && r.resultado.erros.length === 0 && (
          <form action={acaoSalvar} className="calc__salvar nao-imprimir">
            {errosSalvar && errosSalvar.length > 0 && (
              <div className="aviso aviso--erro">
                {errosSalvar.map((erro) => (
                  <div key={erro}>{erro}</div>
                ))}
              </div>
            )}
            {/* Repassa a entrada crua — o salvar recalcula no servidor antes de
                gravar, então o que se salva é o que a fórmula produz. */}
            {Object.entries(v).map(([nome, valor]) =>
              typeof valor === "boolean" ? (
                <input key={nome} type="hidden" name={nome} value={valor ? "1" : "0"} />
              ) : (
                <input key={nome} type="hidden" name={nome} value={valor} />
              )
            )}
            <div className="campo">
              <label className="campo__rotulo" htmlFor="observacoes">Observações</label>
              <textarea id="observacoes" name="observacoes" rows={2} />
            </div>
            <div className="acoes-linha" style={{ justifyContent: "flex-end" }}>
              <button className="btn" type="button" onClick={() => window.print()}>Imprimir</button>
              <button className="btn btn--primario" type="submit" disabled={salvando}>
                {salvando ? "Salvando…" : "Salvar orçamento"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
