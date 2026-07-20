import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { atualizarOrcamento } from "@/lib/actions/orcamentos";
import { reconstruirOrcamento, validoAte } from "@/lib/orcamento-salvo";
import { ResultadoCalculo } from "@/components/resultado-calculo";
import { BotaoImprimir } from "@/components/botao-imprimir";
import { dataBr, dataHoraBr } from "@/lib/formatar";
import { STATUS_ORCAMENTO, statusEtiquetaClasse } from "@/lib/constantes";

export const metadata = { title: "Orçamento" };

export default async function OrcamentoVerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  await exigirLogin();
  const { id } = await params;
  const { msg = "" } = await searchParams;

  const numero = parseInt(id, 10);
  if (!Number.isFinite(numero) || numero <= 0) {
    redirect("/orcamentos");
  }
  const calculo = await prisma.calculo.findUnique({ where: { id: numero } });
  if (!calculo) {
    notFound();
  }

  const r = reconstruirOrcamento(calculo);
  const entrada = (calculo.dados ?? {}) as Record<string, unknown>;

  // Link "refazer": leva as medidas deste orçamento para a calculadora,
  // que vai usar os PREÇOS DE HOJE dos cadastros.
  const refazer = new URLSearchParams();
  if (entrada.largura_varao) refazer.set("largura_varao", String(entrada.largura_varao));
  if (entrada.altura) refazer.set("altura", String(entrada.altura));
  if (calculo.tecidoId) refazer.set("tecido_id", String(calculo.tecidoId));
  if (calculo.modeloId) refazer.set("modelo_id", String(calculo.modeloId));
  if (calculo.clienteNome) refazer.set("cliente_nome", calculo.clienteNome);
  if (calculo.ambiente) refazer.set("ambiente", calculo.ambiente);

  return (
    <>
      <div className="cabecalho nao-imprimir">
        <div>
          <h1>
            Orçamento Nº {calculo.id}{" "}
            <span className={`etiqueta ${statusEtiquetaClasse(calculo.status)}`}>
              {STATUS_ORCAMENTO[calculo.status] ?? calculo.status}
            </span>
          </h1>
          <p className="cabecalho__sub">
            {calculo.clienteNome !== "" && `${calculo.clienteNome} · `}
            {calculo.ambiente !== "" && `${calculo.ambiente} · `}
            Salvo em {dataHoraBr(calculo.criadoEm)} · válido até {dataBr(validoAte(calculo))}
            {" · "}{calculo.tecidoNome} · {calculo.modeloNome}
          </p>
        </div>
        <div className="cabecalho__acoes">
          <Link className="btn" href="/orcamentos">Voltar</Link>
          <BotaoImprimir rotulo="Imprimir memória de cálculo" />
          <Link className="btn" href={`/orcamentos/${calculo.id}/imprimir`}>
            Orçamento para o cliente
          </Link>
          <Link className="btn btn--primario" href={`/calculadora?${refazer.toString()}`}>
            Refazer com preços de hoje
          </Link>
        </div>
      </div>

      {msg === "atualizado" && <div className="aviso nao-imprimir">Orçamento atualizado.</div>}

      <div className="cartao nao-imprimir" style={{ marginBottom: "1rem" }}>
        <div className="cartao__titulo">Status e condições</div>
        <form action={atualizarOrcamento.bind(null, calculo.id)}>
          <div className="grade">
            <div className="campo">
              <label className="campo__rotulo" htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={calculo.status}>
                {Object.entries(STATUS_ORCAMENTO).map(([chave, rotulo]) => (
                  <option key={chave} value={chave}>{rotulo}</option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label className="campo__rotulo" htmlFor="validade_dias">Validade (dias)</label>
              <input type="number" id="validade_dias" name="validade_dias" step={1} min={1} max={120}
                     defaultValue={calculo.validadeDias} />
            </div>
            <div className="campo" style={{ gridColumn: "span 2" }}>
              <label className="campo__rotulo" htmlFor="condicoes_pagamento">Condições de pagamento</label>
              <input type="text" id="condicoes_pagamento" name="condicoes_pagamento"
                     defaultValue={calculo.condicoesPagamento}
                     placeholder="ex.: 50% entrada + 50% na entrega" />
            </div>
          </div>
          <div className="acoes-linha" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn--primario" type="submit">Atualizar</button>
          </div>
        </form>
      </div>

      <div className="folha-cabecalho somente-imprimir">
        <strong>Orçamento Nº {calculo.id}</strong>
        <span>
          {[calculo.clienteNome, calculo.ambiente].filter(Boolean).join(" · ")}
        </span>
        <span>Salvo em {dataHoraBr(calculo.criadoEm)} · {calculo.tecidoNome} · {calculo.modeloNome}</span>
      </div>

      <div className="calc__saida">
        {r === null ? (
          <div className="aviso aviso--erro">Este orçamento foi salvo sem os dados detalhados.</div>
        ) : (
          <ResultadoCalculo r={r} />
        )}

        {calculo.observacoes && (
          <div className="cartao" style={{ marginTop: "1rem" }}>
            <div className="cartao__titulo">Observações</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{calculo.observacoes}</div>
          </div>
        )}
      </div>
    </>
  );
}
