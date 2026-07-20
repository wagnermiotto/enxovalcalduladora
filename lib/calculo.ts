import type {
  EntradaCalculo,
  EntradaPrecificacao,
  ForcarMetodo,
  ItemAcessorio,
  MetodoCorte,
  PassoCalculo,
  Precificacao,
  ResultadoCalculo,
} from "@/types/calculo";
import { formatarMetros, formatarNumero, formatarPercent, formatarReais } from "@/lib/formatar";

/**
 * =====================================================================
 *  Cálculo de tecido para cortinas — porte fiel de includes/calculo.php.
 * =====================================================================
 *
 * Funções PURAS: recebem objeto, devolvem objeto. Nenhuma toca banco nem
 * navegador — por isso este módulo roda igual no servidor (Server Action
 * que salva) e no cliente (preview ao vivo), uma verdade só.
 *
 * OS DOIS MÉTODOS DE CORTE
 *
 * TRAVESSADO — quando a largura do rolo alcança a altura da cortina
 *   (largura_tecido >= altura_corte). A largura do rolo VIRA a altura e o
 *   corte acompanha o comprimento do rolo. Sem emendas horizontais:
 *       metragem = CTL + folga lateral
 *
 * TRADICIONAL (panos) — quando o rolo NÃO alcança a altura. Cada pano tem
 *   a largura do rolo, cortado no comprimento da altura; panos costurados
 *   lado a lado com emendas verticais:
 *       panos    = teto(CTL / largura_útil)
 *       metragem = panos × altura_corte
 *
 * A "análise técnica" que originou o projeto invertia essas condições e
 * dava a mesma fórmula aos dois métodos — o PHP corrigiu, e este porte
 * é provado pelas mesmas verificações (lib/calculo.test.ts).
 */

/** Largura de rolo além da qual não existe no mercado (~3,20 m máx). */
export const CALC_LARGURA_MAXIMA_TECIDO = 4.0;

export function calcCortina(entrada: EntradaCalculo): ResultadoCalculo {
  // ---------- entrada ----------
  const lv = Math.max(0, num(entrada.largura_varao));
  const altura = Math.max(0, num(entrada.altura));
  const ff = num(entrada.fator_franzimento);
  const lt = Math.max(0, num(entrada.largura_tecido));
  const margem = Math.max(0, num(entrada.margem_barras));
  const rapport = Math.max(0, num(entrada.rapport));
  const estampado = !!entrada.estampado;
  const encPercent = Math.max(0, num(entrada.encolhimento_percent));
  const rapPercent = Math.max(0, num(entrada.rapport_percent));
  const segPercent = Math.max(0, num(entrada.seguranca_percent));
  const ourela = Math.max(0, num(entrada.perda_ourela));
  const folga = Math.max(0, num(entrada.folga_lateral));
  let incremento = num(entrada.incremento, 0.1);
  const preco = Math.max(0, num(entrada.preco_metro));
  const forcar: ForcarMetodo = entrada.forcar_metodo ?? "auto";

  if (incremento <= 0) {
    incremento = 0.1;
  }

  const erros: string[] = [];
  const avisos: string[] = [];
  const passos: PassoCalculo[] = [];

  // ---------- validação ----------
  if (lv <= 0) {
    erros.push("Informe a largura do varão.");
  }
  if (altura <= 0) {
    erros.push("Informe a altura da cortina.");
  }
  if (lt <= 0) {
    erros.push("Informe a largura do tecido (vem do cadastro do tecido).");
  }
  if (ff <= 0) {
    erros.push("Informe o fator de franzimento (vem do modelo da cortina).");
  }
  if (lt > 0 && ourela >= lt) {
    erros.push(
      `A perda de ourela (${formatarMetros(ourela)}) é maior que a largura do tecido. Corrija em Configurações.`
    );
  }

  if (erros.length > 0) {
    return resultadoVazio(erros);
  }

  if (ff < 1) {
    avisos.push(
      "Fator de franzimento menor que 1,0: a cortina ficaria mais estreita que o varão, esticada. Confira o modelo."
    );
  }
  if (lt > CALC_LARGURA_MAXIMA_TECIDO) {
    avisos.push(
      `Largura de tecido de ${formatarMetros(lt)} é fora do comum (rolos vão até cerca de 3,20 m). Confira o cadastro.`
    );
  }

  // ---------- 1. largura total de tecido franzido ----------
  const ctl = lv * ff;
  passos.push(passo(
    "Largura total franzida",
    `${formatarMetros(lv)} × ${formatarNumero(ff)} (fator de franzimento)`,
    formatarMetros(ctl)
  ));

  // ---------- 2. altura de corte ----------
  const alturaCorte = altura + margem;
  passos.push(passo(
    "Altura de corte",
    `${formatarMetros(altura)} + ${formatarMetros(margem)} (barras)`,
    formatarMetros(alturaCorte)
  ));

  // ---------- 3. escolha do método ----------
  const cabeTravessado = lt >= alturaCorte;

  let metodo: MetodoCorte;
  let motivo: string;
  if (forcar === "travessado" || forcar === "tradicional") {
    metodo = forcar;
    motivo = "Método escolhido manualmente.";
    if (forcar === "travessado" && !cabeTravessado) {
      avisos.push(
        `Travessado forçado, mas o tecido tem ${formatarMetros(lt)} e a altura de corte é ` +
          `${formatarMetros(alturaCorte)}. O tecido não alcança a altura — a cortina sairia curta.`
      );
    }
  } else if (cabeTravessado) {
    metodo = "travessado";
    motivo =
      `O tecido tem ${formatarMetros(lt)} e a altura de corte é ${formatarMetros(alturaCorte)}. ` +
      "Como o tecido alcança a altura, corta-se travessado: peça única, sem emendas.";
  } else {
    metodo = "tradicional";
    motivo =
      `O tecido tem ${formatarMetros(lt)} e a altura de corte é ${formatarMetros(alturaCorte)}. ` +
      "Como o tecido não alcança a altura, a cortina é montada com panos costurados lado a lado.";
  }
  passos.push(passo(
    "Método de corte",
    cabeTravessado
      ? `tecido ${formatarMetros(lt)} ≥ altura de corte ${formatarMetros(alturaCorte)}`
      : `tecido ${formatarMetros(lt)} < altura de corte ${formatarMetros(alturaCorte)}`,
    metodo === "travessado" ? "Travessado" : "Tradicional (panos)"
  ));

  // ---------- 4. metragem base ----------
  let larguraUtil = 0;
  let metragemPorAltura = 0;
  let panos: number;
  let metragemBase: number;

  if (metodo === "travessado") {
    panos = 1;
    metragemBase = ctl + folga;
    passos.push(passo(
      "Metragem base",
      `${formatarMetros(ctl)} + ${formatarMetros(folga)} (folga lateral)`,
      formatarMetros(metragemBase)
    ));

    if (estampado) {
      avisos.push(
        "Tecido estampado no corte travessado: a estampa gira 90°. " +
          "Confirme que ela não é direcional antes de cortar."
      );
    }
  } else {
    larguraUtil = lt - ourela;
    passos.push(passo(
      "Largura útil do pano",
      `${formatarMetros(lt)} − ${formatarMetros(ourela)} (ourela e costura)`,
      formatarMetros(larguraUtil)
    ));

    panos = Math.ceil(limpa(ctl / larguraUtil));
    passos.push(passo(
      "Panos necessários",
      `teto(${formatarMetros(ctl)} ÷ ${formatarMetros(larguraUtil)}) = teto(${formatarNumero(ctl / larguraUtil, 3)})`,
      `${panos} ${panos === 1 ? "pano" : "panos"}`
    ));

    // Rapport conhecido: conta exata — cada pano sobe para o próximo múltiplo
    // inteiro da repetição, para as estampas casarem nas emendas.
    metragemPorAltura = alturaCorte;
    if (rapport > 0) {
      const repeticoes = Math.ceil(limpa(alturaCorte / rapport));
      metragemPorAltura = repeticoes * rapport;
      passos.push(passo(
        "Altura por pano (casando a estampa)",
        `teto(${formatarMetros(alturaCorte)} ÷ ${formatarMetros(rapport)} de rapport) = ${repeticoes} × ${formatarMetros(rapport)}`,
        formatarMetros(metragemPorAltura)
      ));
      if (rapport > alturaCorte) {
        avisos.push(
          `O rapport (${formatarMetros(rapport)}) é maior que a altura de corte (${formatarMetros(alturaCorte)}): ` +
            "sobra quase uma repetição inteira por pano. Considere outro tecido para esta altura."
        );
      }
    }

    metragemBase = panos * metragemPorAltura;
    passos.push(passo(
      "Metragem base",
      `${panos} panos × ${formatarMetros(metragemPorAltura)}`,
      formatarMetros(metragemBase)
    ));
  }

  // ---------- 5. perdas e margens ----------
  // Multiplicativas e em sequência: cada percentual incide sobre a quantidade
  // que realmente será comprada até ali, não sobre a metragem crua.
  let metragem = metragemBase;

  if (encPercent > 0) {
    metragem *= 1 + encPercent / 100;
    passos.push(passo(
      "Encolhimento do tecido",
      `+ ${formatarPercent(encPercent)} sobre ${formatarMetros(metragemBase)}`,
      m3(metragem)
    ));
  }

  // O percentual de rapport é só um paliativo para quando não se sabe a
  // repetição. Se o rapport é conhecido, a conta exata acima já resolveu —
  // somar os dois cobraria a mesma perda duas vezes.
  let usouRapportPercent = false;
  if (estampado && rapport <= 0 && rapPercent > 0 && metodo === "tradicional") {
    const antes = metragem;
    metragem *= 1 + rapPercent / 100;
    usouRapportPercent = true;
    passos.push(passo(
      "Casamento de estampa (rapport estimado)",
      `+ ${formatarPercent(rapPercent)} sobre ${m3(antes)}`,
      m3(metragem)
    ));
    avisos.push(
      "O rapport deste tecido não está cadastrado, então o casamento da estampa entrou como " +
        `${formatarPercent(rapPercent)} estimado. Meça a repetição e cadastre no tecido para o cálculo virar exato.`
    );
  }

  if (segPercent > 0) {
    const antes = metragem;
    metragem *= 1 + segPercent / 100;
    passos.push(passo(
      "Margem de segurança",
      `+ ${formatarPercent(segPercent)} sobre ${m3(antes)}`,
      m3(metragem)
    ));
  }

  // ---------- 6. arredondamento comercial ----------
  const metragemFinal = calcArredondaComercial(metragem, incremento);
  if (Math.abs(metragemFinal - metragem) > 0.0001) {
    passos.push(passo(
      "Arredondamento comercial",
      `${m3(metragem)} → próximo múltiplo de ${formatarMetros(incremento)}`,
      formatarMetros(metragemFinal)
    ));
  }

  // ---------- 7. custo ----------
  const custo = metragemFinal * preco;
  if (preco > 0) {
    passos.push(passo(
      "Custo do tecido",
      `${formatarMetros(metragemFinal)} × ${formatarReais(preco)}/m`,
      formatarReais(custo)
    ));
  } else {
    avisos.push("O tecido está sem preço por metro cadastrado — o custo saiu zerado.");
  }

  const perdaPercent = metragemBase > 0 ? ((metragemFinal - metragemBase) / metragemBase) * 100 : 0;

  return {
    erros: [],
    avisos,
    metodo,
    metodo_motivo: motivo,
    cabe_travessado: cabeTravessado,
    ctl: r3(ctl),
    altura_corte: r3(alturaCorte),
    largura_util: r3(larguraUtil),
    panos,
    metragem_por_altura: r3(metragemPorAltura),
    metragem_base: r3(metragemBase),
    metragem_final: r3(metragemFinal),
    perda_percent: r3(perdaPercent),
    usou_rapport_percent: usouRapportPercent,
    preco_metro: r3(preco),
    custo_tecido: r3(custo),
    passos,
  };
}

/**
 * Acessórios derivados do cálculo do tecido — porte de calc_acessorios().
 */
export function calcAcessorios(entrada: EntradaCalculo, res: ResultadoCalculo): ItemAcessorio[] {
  if (res.erros.length > 0) {
    return [];
  }

  const itens: ItemAcessorio[] = [];
  const ctl = res.ctl;
  const lv = num(entrada.largura_varao);

  if (entrada.usa_ilhos) {
    const esp = num(entrada.espacamento_ilhos, 0.16);
    const qtd = calcIlhoses(ctl, esp);
    const preco = num(entrada.ilhos_preco);
    itens.push({
      item: "Ilhoses",
      quantidade: qtd,
      unidade: "un",
      detalhe: `espaçamento de ${formatarMetros(esp)} — quantidade sempre par`,
      custo: r3(qtd * preco),
    });
  }

  if (entrada.usa_entretela) {
    const preco = num(entrada.entretela_preco_metro);
    itens.push({
      item: "Entretela",
      quantidade: r3(ctl),
      unidade: "m",
      detalhe: "faixa no cabeçalho, acompanha a largura franzida",
      custo: r3(ctl * preco),
    });
  }

  const forroLargura = num(entrada.forro_largura);
  if (forroLargura > 0) {
    // O forro é uma cortina dentro da cortina: mesma conta, com a largura do
    // forro e sem estampa para casar.
    const resForro = calcCortina({
      ...entrada,
      largura_tecido: forroLargura,
      preco_metro: num(entrada.forro_preco_metro),
      rapport: 0,
      estampado: false,
      encolhimento_percent: num(entrada.forro_encolhimento_percent),
      forcar_metodo: "auto",
    });
    if (resForro.erros.length === 0) {
      itens.push({
        item: "Forro",
        quantidade: resForro.metragem_final,
        unidade: "m",
        detalhe: `corte ${resForro.metodo}, tecido de ${formatarMetros(forroLargura)}`,
        custo: resForro.custo_tecido,
      });
    }
  }

  if (lv > 0) {
    itens.push({
      item: "Varão / trilho",
      quantidade: r3(lv),
      unidade: "m",
      detalhe: "largura do vão",
      custo: r3(lv * num(entrada.varao_preco_metro)),
    });
  }

  return itens;
}

/**
 * Preço de venda a partir do custo de materiais: rateia a mão de obra pela
 * metragem final e aplica a margem de lucro sobre materiais + mão de obra.
 * Porte de calc_precificacao().
 */
export function calcPrecificacao(entrada: EntradaPrecificacao): Precificacao {
  const custoMateriais = Math.max(0, num(entrada.custo_materiais));
  const metragem = Math.max(0, num(entrada.metragem_final));
  const maoObraMetro = Math.max(0, num(entrada.mao_obra_metro));
  const margemPercent = Math.max(0, num(entrada.margem_percent));

  const maoObra = r2(metragem * maoObraMetro);
  const subtotal = r2(custoMateriais + maoObra);

  return calcPrecificacaoSalva(
    custoMateriais,
    maoObra,
    margemPercent,
    subtotal + r2((subtotal * margemPercent) / 100)
  );
}

/**
 * Reconstrói o resumo de precificação a partir de valores já gravados num
 * orçamento salvo — a margem_valor sai por diferença, então não há
 * arredondamento divergente entre o que foi salvo e o que é mostrado.
 * Porte de calc_precificacao_salva().
 */
export function calcPrecificacaoSalva(
  custoMateriais: number,
  maoObra: number,
  margemPercent: number,
  precoVenda: number
): Precificacao {
  const subtotal = r2(custoMateriais + maoObra);
  return {
    custo_materiais: r2(custoMateriais),
    mao_obra: r2(maoObra),
    margem_percent: r2(margemPercent),
    subtotal,
    margem_valor: r2(precoVenda - subtotal),
    preco_venda: r2(precoVenda),
  };
}

/**
 * Sobe a metragem para o próximo múltiplo do incremento de venda.
 * Tecido não se vende em 19,1961 m.
 */
export function calcArredondaComercial(metros: number, incremento: number): number {
  if (incremento <= 0) {
    return r3(metros);
  }
  // O arredondamento a 6 casas antes do teto mata o ruído de ponto flutuante:
  // sem ele, 5,00 ÷ 0,10 dá 50,000000000000007 e o teto empurraria para 5,10.
  const passos = Math.ceil(limpa(metros / incremento));
  return r3(passos * incremento);
}

/**
 * Quantidade de ilhoses para uma largura franzida — sempre par: com número
 * ímpar, as pontas da cortina viram para lados opostos e a peça não fecha
 * direito no varão.
 */
export function calcIlhoses(larguraFranzida: number, espacamento: number): number {
  if (larguraFranzida <= 0 || espacamento <= 0) {
    return 0;
  }
  let qtd = Math.ceil(limpa(larguraFranzida / espacamento)) + 1;
  if (qtd % 2 !== 0) {
    qtd++;
  }
  return Math.max(2, qtd);
}

// ---------------------------------------------------------------------
// apoio interno
// ---------------------------------------------------------------------

function num(v: number | undefined, padrao = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : padrao;
}

function passo(rotulo: string, formula: string, valor: string): PassoCalculo {
  return { rotulo, formula, valor };
}

/** round($v, 3) do PHP — medidas em metro não precisam de mais que milímetro. */
function r3(v: number): number {
  return Math.round(v * 1000 * (1 + Number.EPSILON)) / 1000;
}

/** round($v, 2) do PHP — para valores em reais. */
function r2(v: number): number {
  return Math.round(v * 100 * (1 + Number.EPSILON)) / 100;
}

/**
 * Metros com 3 casas para os passos intermediários. Com 2 casas, 19,1961
 * apareceria como "19,20" e o passo do arredondamento pareceria não fazer nada.
 */
function m3(v: number): string {
  return `${formatarNumero(v, 3)} m`;
}

/** Remove ruído de ponto flutuante antes de um teto. */
function limpa(v: number): number {
  return Math.round(v * 1e6 * (1 + Number.EPSILON)) / 1e6;
}

function resultadoVazio(erros: string[]): ResultadoCalculo {
  return {
    erros,
    avisos: [],
    metodo: "",
    metodo_motivo: "",
    cabe_travessado: false,
    ctl: 0,
    altura_corte: 0,
    largura_util: 0,
    panos: 0,
    metragem_por_altura: 0,
    metragem_base: 0,
    metragem_final: 0,
    perda_percent: 0,
    usou_rapport_percent: false,
    preco_metro: 0,
    custo_tecido: 0,
    passos: [],
  };
}
