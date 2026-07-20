import type { EntradaCalculo, ForcarMetodo, ItemAcessorio, Precificacao, ResultadoCalculo } from "@/types/calculo";
import { calcAcessorios, calcCortina, calcPrecificacao } from "@/lib/calculo";
import { parseNumero } from "@/lib/formatar";
import type { PadroesCalculo } from "@/lib/config-campos";

/**
 * Ponte entre o formulário e o núcleo de cálculo — porte de
 * includes/calculo_form.php. PURA (sem banco): o preview no navegador e a
 * Server Action de salvar montam a entrada EXATAMENTE aqui. Se cada lado
 * montasse a sua, a tela e o papel poderiam divergir.
 */

export interface TecidoLite {
  id: number;
  nome: string;
  largura: number;
  precoMetro: number;
  encolhimentoPercent: number;
  rapport: number;
  estampado: boolean;
}

export interface ModeloLite {
  id: number;
  nome: string;
  fatorFranzimento: number;
  margemBarras: number;
  usaEntretela: boolean;
  usaIlhos: boolean;
  espacamentoIlhos: number;
}

export interface AcessorioLite {
  id: number;
  nome: string;
  tipo: string;
  unidade: string;
  preco: number;
  largura: number;
}

/** Valores crus do formulário — string vazia significa "usa o cadastro". */
export interface ValoresFormulario {
  largura_varao: string;
  altura: string;
  fator_franzimento: string;
  margem_barras: string;
  largura_tecido: string;
  preco_metro: string;
  encolhimento_percent: string;
  rapport: string;
  seguranca_percent: string;
  mao_obra_metro: string;
  margem_percent: string;
  forcar_metodo: ForcarMetodo;
  usa_ilhos: boolean;
  usa_entretela: boolean;
}

export interface ApoioCalculo {
  tecido: TecidoLite | null;
  modelo: ModeloLite | null;
  ilhos: AcessorioLite | null;
  entretela: AcessorioLite | null;
  forro: AcessorioLite | null;
  varao: AcessorioLite | null;
  padroes: PadroesCalculo;
}

export interface ResultadoExecucao {
  entrada: EntradaCalculo;
  resultado: ResultadoCalculo;
  acessorios: ItemAcessorio[];
  custo_acessorios: number;
  custo_total: number;
  precificacao: Precificacao;
}

/** Campo avançado em branco → valor do cadastro/padrão (calc_campo_ou do PHP). */
function campoOu(valor: string, padrao: number): number {
  return valor.trim() === "" ? padrao : parseNumero(valor);
}

export function montarEntrada(valores: ValoresFormulario, apoio: ApoioCalculo): EntradaCalculo {
  const { tecido, modelo, padroes } = apoio;

  const espacamentoModelo = modelo && modelo.espacamentoIlhos > 0
    ? modelo.espacamentoIlhos
    : padroes.espacamento_ilhos;

  return {
    largura_varao: parseNumero(valores.largura_varao),
    altura: parseNumero(valores.altura),
    fator_franzimento: campoOu(valores.fator_franzimento, modelo?.fatorFranzimento ?? 0),
    largura_tecido: campoOu(valores.largura_tecido, tecido?.largura ?? 0),
    margem_barras: campoOu(valores.margem_barras, modelo?.margemBarras ?? 0),
    rapport: campoOu(valores.rapport, tecido?.rapport ?? 0),
    estampado: !!tecido?.estampado,
    encolhimento_percent: campoOu(valores.encolhimento_percent, tecido?.encolhimentoPercent ?? 0),
    rapport_percent: padroes.rapport_percent,
    seguranca_percent: campoOu(valores.seguranca_percent, padroes.seguranca_percent),
    perda_ourela: padroes.perda_ourela,
    folga_lateral: padroes.folga_lateral,
    incremento: padroes.incremento,
    preco_metro: campoOu(valores.preco_metro, tecido?.precoMetro ?? 0),
    forcar_metodo: valores.forcar_metodo,

    usa_ilhos: valores.usa_ilhos,
    usa_entretela: valores.usa_entretela,
    espacamento_ilhos: espacamentoModelo,
    ilhos_preco: apoio.ilhos?.preco ?? 0,
    entretela_preco_metro: apoio.entretela?.preco ?? 0,
    forro_largura: apoio.forro?.largura ?? 0,
    forro_preco_metro: apoio.forro?.preco ?? 0,
    forro_encolhimento_percent: 0,
    varao_preco_metro: apoio.varao?.preco ?? 0,
  };
}

/** O calc_executar() do PHP: cálculo completo — tecido, acessórios e preço. */
export function executarCalculo(
  valores: ValoresFormulario,
  apoio: ApoioCalculo
): ResultadoExecucao {
  const entrada = montarEntrada(valores, apoio);
  const resultado = calcCortina(entrada);
  const acessorios = calcAcessorios(entrada, resultado);

  const custoAcessorios = Math.round(
    acessorios.reduce((soma, item) => soma + item.custo, 0) * 100
  ) / 100;
  const custoTotal = Math.round((resultado.custo_tecido + custoAcessorios) * 100) / 100;

  const precificacao = calcPrecificacao({
    custo_materiais: custoTotal,
    metragem_final: resultado.metragem_final,
    mao_obra_metro: campoOu(valores.mao_obra_metro, apoio.padroes.mao_obra_metro),
    margem_percent: campoOu(valores.margem_percent, apoio.padroes.margem_percent),
  });

  return {
    entrada,
    resultado,
    acessorios,
    custo_acessorios: custoAcessorios,
    custo_total: custoTotal,
    precificacao,
  };
}
