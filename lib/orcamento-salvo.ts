import "server-only";
import type { Calculo } from "@prisma/client";
import type { EntradaCalculo, ResultadoCalculo } from "@/types/calculo";
import { calcAcessorios, calcPrecificacaoSalva } from "@/lib/calculo";
import type { ResultadoExecucao } from "@/lib/calculo-executar";

/**
 * Reconstrói um orçamento salvo A PARTIR DO SNAPSHOT, não do cadastro atual —
 * o cliente recebe o orçamento como ele foi fechado, mesmo que o tecido tenha
 * mudado de preço desde então. Porte do topo de admin/calculo-ver.php.
 */
export function reconstruirOrcamento(calculo: Calculo): ResultadoExecucao | null {
  const entrada = (calculo.dados ?? null) as EntradaCalculo | null;
  const resultado = (calculo.resultado ?? null) as ResultadoCalculo | null;
  if (!entrada || !resultado) {
    return null;
  }

  const acessorios = calcAcessorios(entrada, resultado);
  const custoAcessorios =
    Math.round(acessorios.reduce((soma, item) => soma + item.custo, 0) * 100) / 100;

  return {
    entrada,
    resultado,
    acessorios,
    custo_acessorios: custoAcessorios,
    custo_total: calculo.custoTotal,
    // margem por diferença — nada é re-arredondado em relação ao que foi salvo
    precificacao: calcPrecificacaoSalva(
      calculo.custoTotal,
      calculo.maoObra,
      calculo.margemPercent,
      calculo.precoVenda
    ),
  };
}

/** Data-limite do orçamento: criado_em + validade_dias. */
export function validoAte(calculo: Calculo): Date {
  const limite = new Date(calculo.criadoEm);
  limite.setDate(limite.getDate() + calculo.validadeDias);
  return limite;
}
