import { describe, expect, it } from "vitest";
import type { EntradaCalculo } from "@/types/calculo";
import {
  calcAcessorios,
  calcArredondaComercial,
  calcCortina,
  calcIlhoses,
  calcPrecificacao,
  calcPrecificacaoSalva,
} from "@/lib/calculo";

/**
 * Porte das 72 verificações de scripts/teste-calculo.php (sistema PHP).
 * Os números esperados são OS MESMOS — se um teste passa lá e falha aqui,
 * o porte traiu a fórmula. toBeCloseTo(x, 3) reproduz a tolerância de
 * 0,0005 do script original.
 */

/** Entrada padrão dos exemplos: varão 3,00 m, altura 2,50 m, prega americana. */
function base(sobrescreve: Partial<EntradaCalculo> = {}): EntradaCalculo {
  return {
    largura_varao: 3.0,
    altura: 2.5,
    fator_franzimento: 2.6,
    largura_tecido: 1.4,
    margem_barras: 0.27,
    rapport: 0,
    estampado: false,
    encolhimento_percent: 5,
    rapport_percent: 20,
    seguranca_percent: 10,
    perda_ourela: 0.04,
    folga_lateral: 0.1,
    incremento: 0.1,
    preco_metro: 32.9,
    forcar_metodo: "auto",
    ...sobrescreve,
  };
}

describe("Exemplo A — tradicional (tecido 1,40 m não alcança a altura)", () => {
  const a = calcCortina(base());
  it("sem erros", () => expect(a.erros).toEqual([]));
  it("método é tradicional", () => expect(a.metodo).toBe("tradicional"));
  it("largura franzida (CTL)", () => expect(a.ctl).toBeCloseTo(7.8, 3));
  it("altura de corte", () => expect(a.altura_corte).toBeCloseTo(2.77, 3));
  it("largura útil do pano", () => expect(a.largura_util).toBeCloseTo(1.36, 3));
  it("6 panos", () => expect(a.panos).toBe(6));
  it("metragem base", () => expect(a.metragem_base).toBeCloseTo(16.62, 3));
  it("metragem final 19,20 m", () => expect(a.metragem_final).toBeCloseTo(19.2, 3));
  it("custo 19,20 × 32,90", () => expect(a.custo_tecido).toBeCloseTo(631.68, 3));
});

describe("Exemplo B — travessado (tecido 2,80 m alcança a altura)", () => {
  const a = calcCortina(base());
  const b = calcCortina(base({ largura_tecido: 2.8, preco_metro: 45.0 }));
  it("método é travessado", () => expect(b.metodo).toBe("travessado"));
  it("corte único (1 pano)", () => expect(b.panos).toBe(1));
  it("metragem base = CTL + folga", () => expect(b.metragem_base).toBeCloseTo(7.9, 3));
  it("metragem final 9,20 m", () => expect(b.metragem_final).toBeCloseTo(9.2, 3));
  it("custo 9,20 × 45,00", () => expect(b.custo_tecido).toBeCloseTo(414.0, 3));
  it("travessado gasta menos que tradicional", () =>
    expect(b.metragem_final).toBeLessThan(a.metragem_final));
});

describe("Fronteira exata: tecido igual à altura de corte", () => {
  it("LT == altura de corte vira travessado", () =>
    expect(calcCortina(base({ largura_tecido: 2.77 })).metodo).toBe("travessado"));
  it("LT um milímetro menor vira tradicional", () =>
    expect(calcCortina(base({ largura_tecido: 2.769 })).metodo).toBe("tradicional"));
});

describe("Rapport conhecido — conta exata, por pano", () => {
  const e = calcCortina(base({ rapport: 0.64, estampado: true }));
  const f = calcCortina(base({ rapport: 0, estampado: true }));
  it("altura por pano sobe para 3,20 m", () => expect(e.metragem_por_altura).toBeCloseTo(3.2, 3));
  it("base = 6 panos × 3,20", () => expect(e.metragem_base).toBeCloseTo(19.2, 3));
  it("não aplica o percentual de rapport por cima", () =>
    expect(e.usou_rapport_percent).toBe(false));
  it("sem rapport cadastrado, aplica o percentual", () =>
    expect(f.usou_rapport_percent).toBe(true));
  it("estimativa por percentual gasta mais que a conta exata", () =>
    expect(f.metragem_final).toBeGreaterThan(e.metragem_final));
});

describe("Rapport maior que a altura de corte", () => {
  const g = calcCortina(base({ rapport: 3.5, estampado: true }));
  it("sobe uma repetição inteira por pano", () => expect(g.metragem_por_altura).toBeCloseTo(3.5, 3));
  it("avisa que o rapport é grande demais", () => expect(g.avisos.length).toBeGreaterThan(0));
});

describe("Travessado não casa estampa — deve avisar", () => {
  it("avisa que a estampa gira 90° no travessado", () => {
    const h = calcCortina(base({ largura_tecido: 2.8, estampado: true, rapport: 0.64 }));
    expect(h.avisos.some((aviso) => aviso.includes("90°"))).toBe(true);
  });
});

describe("Percentuais: aplicação multiplicativa e em sequência", () => {
  it("sem percentuais, final = base", () => {
    const i = calcCortina(base({ encolhimento_percent: 0, seguranca_percent: 0, incremento: 0.01 }));
    expect(i.metragem_final).toBeCloseTo(16.62, 3);
  });
  const j = calcCortina(
    base({ encolhimento_percent: 10, seguranca_percent: 10, incremento: 0.001 })
  );
  // 16,62 × 1,10 × 1,10 = 20,1102 -> arredonda para 20,111
  it("10% + 10% compõem (×1,10 ×1,10)", () => expect(j.metragem_final).toBeCloseTo(20.111, 3));
  // se fossem somados daria 16,62 × 1,20 = 19,944: quase 17 cm a menos de tecido
  it("e não somam (×1,20 daria 19,944)", () => expect(j.metragem_final).toBeGreaterThan(20.0));
});

describe("Arredondamento comercial", () => {
  it("19,1961 sobe para 19,20", () => expect(calcArredondaComercial(19.1961, 0.1)).toBeCloseTo(19.2, 3));
  it("valor exato no incremento não sobe", () => expect(calcArredondaComercial(5.0, 0.1)).toBeCloseTo(5.0, 3));
  it("9,1245 sobe para 9,20", () => expect(calcArredondaComercial(9.1245, 0.1)).toBeCloseTo(9.2, 3));
  it("incremento de 0,50: 7,90 -> 8,00", () => expect(calcArredondaComercial(7.9, 0.5)).toBeCloseTo(8.0, 3));
  it("incremento de 1,00: 7,10 -> 8,00", () => expect(calcArredondaComercial(7.1, 1.0)).toBeCloseTo(8.0, 3));
  it("zero continua zero", () => expect(calcArredondaComercial(0.0, 0.1)).toBeCloseTo(0.0, 3));
});

describe("Ilhoses — sempre par", () => {
  it("7,80 m a cada 0,16 m", () => expect(calcIlhoses(7.8, 0.16)).toBe(50));
  it("resultado ímpar sobe para o par seguinte", () => expect(calcIlhoses(1.6, 0.16)).toBe(12)); // teto(10)+1 = 11 -> 12
  it("largura mínima ainda dá 2", () => expect(calcIlhoses(0.05, 0.16)).toBe(2));
  it("largura zero dá 0", () => expect(calcIlhoses(0, 0.16)).toBe(0));
  for (const larg of [1.5, 3.0, 4.44, 7.8, 9.13]) {
    it(`par para largura ${larg}`, () => expect(calcIlhoses(larg, 0.16) % 2).toBe(0));
  }
});

describe("Entradas inválidas — erro claro, sem número inventado", () => {
  const k = calcCortina(base({ largura_varao: 0 }));
  it("largura zero gera erro", () => expect(k.erros.length).toBeGreaterThan(0));
  it("e metragem fica zerada", () => expect(k.metragem_final).toBe(0));
  it("altura zero gera erro", () =>
    expect(calcCortina(base({ altura: 0 })).erros.length).toBeGreaterThan(0));
  it("tecido sem largura gera erro", () =>
    expect(calcCortina(base({ largura_tecido: 0 })).erros.length).toBeGreaterThan(0));
  it("ourela maior que o tecido gera erro", () =>
    expect(calcCortina(base({ perda_ourela: 2.0 })).erros.length).toBeGreaterThan(0));
});

describe("Casos de borda que não podem explodir", () => {
  const o = calcCortina(base({ fator_franzimento: 1.0 }));
  it("FF 1,0 calcula", () => expect(o.erros).toEqual([]));
  it("FF 1,0: CTL = largura do varão", () => expect(o.ctl).toBeCloseTo(3.0, 3));
  it("FF menor que 1 avisa", () =>
    expect(calcCortina(base({ fator_franzimento: 0.5 })).avisos.length).toBeGreaterThan(0));
  it("tecido estreito calcula muitos panos", () =>
    expect(calcCortina(base({ largura_tecido: 0.3 })).panos).toBeGreaterThan(20));
  const r = calcCortina(base({ preco_metro: 0 }));
  it("tecido sem preço avisa", () => expect(r.avisos.length).toBeGreaterThan(0));
  it("e custo fica zerado", () => expect(r.custo_tecido).toBe(0));
  it("largura de tecido absurda avisa", () =>
    expect(calcCortina(base({ largura_tecido: 5.0 })).avisos.length).toBeGreaterThan(0));
});

describe("Memória de cálculo", () => {
  const a = calcCortina(base());
  it("o exemplo A registra os passos", () => expect(a.passos.length).toBeGreaterThanOrEqual(6));
  it("e mostra de onde saíram os 6 panos", () =>
    expect(
      a.passos.some((p) => p.rotulo === "Panos necessários" && p.valor === "6 panos")
    ).toBe(true));
});

describe("Acessórios", () => {
  const a = calcCortina(base());
  const acc = calcAcessorios(
    base({
      usa_ilhos: true,
      usa_entretela: true,
      espacamento_ilhos: 0.16,
      ilhos_preco: 1.2,
      entretela_preco_metro: 4.5,
    }),
    a
  );
  const porItem = Object.fromEntries(acc.map((item) => [item.item, item]));

  it("lista ilhoses", () => expect(porItem["Ilhoses"]).toBeDefined());
  it("50 ilhoses para 7,80 m", () => expect(porItem["Ilhoses"]?.quantidade).toBe(50));
  it("entretela acompanha o CTL", () => expect(porItem["Entretela"]?.quantidade).toBeCloseTo(7.8, 3));
  it("varão = largura do vão", () => expect(porItem["Varão / trilho"]?.quantidade).toBeCloseTo(3.0, 3));

  const accForro = calcAcessorios(base({ forro_largura: 2.8, forro_preco_metro: 18.0 }), a);
  const forro = accForro.find((item) => item.item === "Forro");
  it("forro de 2,80 m sai travessado", () =>
    expect(forro?.detalhe.includes("travessado")).toBe(true));
  it("forro entra na lista quando tem largura", () => expect(forro).toBeDefined());
});

describe("Precificação — mão de obra e margem", () => {
  const prec1 = calcPrecificacao({
    custo_materiais: 631.68,
    metragem_final: 19.2,
    mao_obra_metro: 10.0,
    margem_percent: 30,
  });
  it("mão de obra = metragem × R$/metro", () => expect(prec1.mao_obra).toBeCloseTo(192.0, 3));
  it("subtotal = materiais + mão de obra", () => expect(prec1.subtotal).toBeCloseTo(823.68, 3));
  it("margem 30% sobre o subtotal", () => expect(prec1.margem_valor).toBeCloseTo(247.1, 3));
  it("preço de venda = subtotal + margem", () => expect(prec1.preco_venda).toBeCloseTo(1070.78, 3));

  const prec2 = calcPrecificacao({
    custo_materiais: 500.0,
    metragem_final: 10.0,
    mao_obra_metro: 0,
    margem_percent: 0,
  });
  it("sem mão de obra nem margem: preço de venda = custo", () =>
    expect(prec2.preco_venda).toBeCloseTo(500.0, 3));
  it("e margem_valor fica zerada", () => expect(prec2.margem_valor).toBeCloseTo(0.0, 3));

  const precSalva = calcPrecificacaoSalva(300.0, 50.0, 20, 420.0);
  it("reconstrução a partir de valores salvos: subtotal", () =>
    expect(precSalva.subtotal).toBeCloseTo(350.0, 3));
  it("margem sai por diferença (preço - subtotal)", () =>
    expect(precSalva.margem_valor).toBeCloseTo(70.0, 3));

  // Orçamentos salvos antes desta função existir têm mao_obra=0, margem=0 e
  // preco_venda=0 — a tela checa mao_obra>0 OU margem_valor>0 antes de exibir.
  const precLegado = calcPrecificacaoSalva(300.0, 0, 0, 0);
  it("orçamento salvo antes da precificação: margem_valor não fica positiva", () =>
    expect(precLegado.margem_valor).toBeLessThanOrEqual(0));
});
