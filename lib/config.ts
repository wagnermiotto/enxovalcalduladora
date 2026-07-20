import "server-only";
import { prisma } from "@/lib/db";

/**
 * Configurações chave/valor — porte de config_get()/calc_padroes() do PHP
 * (includes/loja.php). Somente servidor: o cliente recebe os valores já
 * resolvidos como props.
 */

export async function configTodas(): Promise<Record<string, string>> {
  const linhas = await prisma.configuracao.findMany();
  const mapa: Record<string, string> = {};
  for (const { chave, valor } of linhas) {
    mapa[chave] = valor ?? "";
  }
  return mapa;
}

export function configNum(
  mapa: Record<string, string>,
  chave: string,
  padrao: number
): number {
  const valor = mapa[chave];
  if (valor === undefined || valor === "") {
    return padrao;
  }
  const n = parseFloat(valor);
  return Number.isFinite(n) ? n : padrao;
}

export type { PadroesCalculo } from "@/lib/config-campos";
import type { PadroesCalculo } from "@/lib/config-campos";

/** Os padrões de cálculo já resolvidos, prontos para entrar em calcCortina(). */
export async function calcPadroes(): Promise<PadroesCalculo> {
  const cfg = await configTodas();
  return {
    seguranca_percent: configNum(cfg, "calc_seguranca_percent", 10),
    rapport_percent: configNum(cfg, "calc_rapport_percent", 20),
    perda_ourela: configNum(cfg, "calc_perda_ourela", 0.04),
    folga_lateral: configNum(cfg, "calc_folga_lateral", 0.1),
    incremento: configNum(cfg, "calc_incremento", 0.1),
    espacamento_ilhos: configNum(cfg, "calc_espacamento_ilhos", 0.16),
    mao_obra_metro: configNum(cfg, "calc_mao_obra_metro", 0),
    margem_percent: configNum(cfg, "calc_margem_percent", 0),
    validade_dias: Math.trunc(configNum(cfg, "calc_validade_dias", 15)),
  };
}
