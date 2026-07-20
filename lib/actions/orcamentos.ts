"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { calcPadroes } from "@/lib/config";
import { parseNumero } from "@/lib/formatar";
import { STATUS_ORCAMENTO } from "@/lib/constantes";
import {
  executarCalculo,
  type ApoioCalculo,
  type ValoresFormulario,
} from "@/lib/calculo-executar";

/** Reconstrói os valores crus do formulário a partir do FormData. */
function lerValores(formData: FormData): ValoresFormulario {
  const texto = (campo: string) => String(formData.get(campo) ?? "");
  const forcar = texto("forcar_metodo");
  return {
    largura_varao: texto("largura_varao"),
    altura: texto("altura"),
    fator_franzimento: texto("fator_franzimento"),
    margem_barras: texto("margem_barras"),
    largura_tecido: texto("largura_tecido"),
    preco_metro: texto("preco_metro"),
    encolhimento_percent: texto("encolhimento_percent"),
    rapport: texto("rapport"),
    seguranca_percent: texto("seguranca_percent"),
    mao_obra_metro: texto("mao_obra_metro"),
    margem_percent: texto("margem_percent"),
    forcar_metodo:
      forcar === "travessado" || forcar === "tradicional" ? forcar : "auto",
    usa_ilhos: texto("usa_ilhos") === "1",
    usa_entretela: texto("usa_entretela") === "1",
  };
}

async function montarApoio(formData: FormData): Promise<ApoioCalculo> {
  const id = (campo: string) => parseInt(String(formData.get(campo) ?? "0"), 10) || 0;

  const [tecido, modelo, ilhos, entretela, forro, varao, padroes] = await Promise.all([
    id("tecido_id") > 0 ? prisma.tecido.findUnique({ where: { id: id("tecido_id") } }) : null,
    id("modelo_id") > 0 ? prisma.modeloCortina.findUnique({ where: { id: id("modelo_id") } }) : null,
    id("ilhos_id") > 0 ? prisma.acessorio.findUnique({ where: { id: id("ilhos_id") } }) : null,
    id("entretela_id") > 0 ? prisma.acessorio.findUnique({ where: { id: id("entretela_id") } }) : null,
    id("forro_id") > 0 ? prisma.acessorio.findUnique({ where: { id: id("forro_id") } }) : null,
    id("varao_id") > 0 ? prisma.acessorio.findUnique({ where: { id: id("varao_id") } }) : null,
    calcPadroes(),
  ]);

  return { tecido, modelo, ilhos, entretela, forro, varao, padroes };
}

/**
 * Salva um orçamento. O cálculo é REFEITO aqui no servidor a partir dos campos
 * crus — o que vai ao banco é sempre o que a fórmula produz, nunca um número
 * que veio pronto da tela. `dados` e `resultado` são gravados como snapshot.
 */
export async function salvarOrcamento(
  _anterior: string[] | null,
  formData: FormData
): Promise<string[]> {
  await exigirLogin();

  const valores = lerValores(formData);
  const apoio = await montarApoio(formData);
  const r = executarCalculo(valores, apoio);

  if (r.resultado.erros.length > 0) {
    return r.resultado.erros;
  }

  const padroes = apoio.padroes;
  const validadeDias =
    Math.trunc(parseNumero(String(formData.get("validade_dias") ?? ""))) || padroes.validade_dias;

  await prisma.calculo.create({
    data: {
      clienteNome: String(formData.get("cliente_nome") ?? "").trim(),
      ambiente: String(formData.get("ambiente") ?? "").trim(),
      tecidoId: apoio.tecido?.id ?? null,
      modeloId: apoio.modelo?.id ?? null,
      tecidoNome: apoio.tecido?.nome ?? "",
      modeloNome: apoio.modelo?.nome ?? "",
      metodo: r.resultado.metodo,
      metragemFinal: r.resultado.metragem_final,
      custoTotal: r.custo_total,
      dados: r.entrada as unknown as Prisma.InputJsonValue,
      resultado: r.resultado as unknown as Prisma.InputJsonValue,
      observacoes: String(formData.get("observacoes") ?? "").trim() || null,
      status: "rascunho",
      validadeDias,
      condicoesPagamento: String(formData.get("condicoes_pagamento") ?? "").trim(),
      maoObra: r.precificacao.mao_obra,
      margemPercent: r.precificacao.margem_percent,
      precoVenda: r.precificacao.preco_venda,
    },
  });

  revalidatePath("/orcamentos");
  redirect("/orcamentos?msg=salvo");
}

/** Status e condições — porte do POST de admin/calculo-ver.php. */
export async function atualizarOrcamento(id: number, formData: FormData): Promise<void> {
  await exigirLogin();

  let status = String(formData.get("status") ?? "rascunho");
  if (!(status in STATUS_ORCAMENTO)) {
    status = "rascunho";
  }
  let validadeDias = Math.trunc(parseNumero(String(formData.get("validade_dias") ?? "15")));
  if (validadeDias < 1) {
    validadeDias = 15;
  }

  await prisma.calculo.update({
    where: { id },
    data: {
      status,
      validadeDias,
      condicoesPagamento: String(formData.get("condicoes_pagamento") ?? "").trim(),
    },
  });

  revalidatePath(`/orcamentos/${id}`);
  revalidatePath("/orcamentos");
  redirect(`/orcamentos/${id}?msg=atualizado`);
}

export async function excluirOrcamento(id: number): Promise<void> {
  await exigirLogin();
  await prisma.calculo.delete({ where: { id } });
  revalidatePath("/orcamentos");
  redirect("/orcamentos?msg=excluido");
}
