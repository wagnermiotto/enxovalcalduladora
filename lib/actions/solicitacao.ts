"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calcPadroes } from "@/lib/config";
import { parseNumero } from "@/lib/formatar";
import { executarCalculo, type ValoresFormulario } from "@/lib/calculo-executar";

/**
 * Pedido de orçamento vindo do site PÚBLICO — qualquer visitante pode chamar.
 *
 * Regras de segurança desta action (diferente da do painel):
 *
 * 1. NÃO aceita nenhum campo de dinheiro do formulário. Preço do tecido,
 *    mão de obra, margem e percentuais vêm SEMPRE do banco. Se aceitasse,
 *    um visitante poderia mandar margem=0 e descobrir o custo real da loja.
 * 2. Só grava; nunca lê nem devolve orçamento de outra pessoa.
 * 3. Nasce com status "solicitado" e origem "site", para a loja saber que
 *    veio de fora e ainda precisa ser conferido.
 * 4. Textos têm limite de tamanho, para não usarem o formulário como depósito.
 */

const LIMITE_TEXTO = 200;
const LIMITE_OBSERVACOES = 1000;

function texto(formData: FormData, campo: string, limite = LIMITE_TEXTO): string {
  return String(formData.get(campo) ?? "").trim().slice(0, limite);
}

export interface RespostaSolicitacao {
  ok: boolean;
  erros: string[];
  /** Número do pedido, para o cliente citar ao entrar em contato. */
  numero?: number;
}

export async function enviarSolicitacao(
  _anterior: RespostaSolicitacao | null,
  formData: FormData
): Promise<RespostaSolicitacao> {
  const nome = texto(formData, "cliente_nome");
  const telefone = texto(formData, "cliente_telefone", 40);
  const email = texto(formData, "cliente_email", 160);
  const ambiente = texto(formData, "ambiente");
  const observacoes = texto(formData, "observacoes", LIMITE_OBSERVACOES);

  const larguraVarao = parseNumero(String(formData.get("largura_varao") ?? ""));
  const altura = parseNumero(String(formData.get("altura") ?? ""));
  const tecidoId = parseInt(String(formData.get("tecido_id") ?? "0"), 10) || 0;
  const modeloId = parseInt(String(formData.get("modelo_id") ?? "0"), 10) || 0;

  const erros: string[] = [];
  if (nome === "") {
    erros.push("Informe seu nome.");
  }
  if (telefone === "") {
    erros.push("Informe um telefone ou WhatsApp para retornarmos.");
  }
  if (larguraVarao <= 0 || altura <= 0) {
    erros.push("Informe a largura e a altura da cortina.");
  }
  if (larguraVarao > 30 || altura > 10) {
    erros.push("Confira as medidas: elas parecem fora do comum (em metros).");
  }
  if (email !== "" && !email.includes("@")) {
    erros.push("O e-mail informado não parece válido.");
  }

  // Só tecidos e modelos ativos — um id qualquer não serve.
  const [tecido, modelo] = await Promise.all([
    tecidoId > 0 ? prisma.tecido.findFirst({ where: { id: tecidoId, ativo: true } }) : null,
    modeloId > 0 ? prisma.modeloCortina.findFirst({ where: { id: modeloId, ativo: true } }) : null,
  ]);
  if (!tecido) {
    erros.push("Escolha um tecido.");
  }
  if (!modelo) {
    erros.push("Escolha um modelo de cortina.");
  }

  if (erros.length > 0) {
    return { ok: false, erros };
  }

  const padroes = await calcPadroes();

  // Todos os campos de preço ficam em branco DE PROPÓSITO: assim
  // executarCalculo() usa o cadastro e as configurações, nunca a entrada
  // do visitante.
  const valores: ValoresFormulario = {
    largura_varao: String(larguraVarao),
    altura: String(altura),
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
    usa_ilhos: modelo!.usaIlhos,
    usa_entretela: modelo!.usaEntretela,
  };

  const r = executarCalculo(valores, {
    tecido,
    modelo,
    ilhos: null,
    entretela: null,
    forro: null,
    varao: null,
    padroes,
  });

  if (r.resultado.erros.length > 0) {
    return { ok: false, erros: r.resultado.erros };
  }

  const criado = await prisma.calculo.create({
    data: {
      clienteNome: nome,
      clienteTelefone: telefone,
      clienteEmail: email,
      origem: "site",
      status: "solicitado",
      ambiente,
      tecidoId: tecido!.id,
      modeloId: modelo!.id,
      tecidoNome: tecido!.nome,
      modeloNome: modelo!.nome,
      metodo: r.resultado.metodo,
      metragemFinal: r.resultado.metragem_final,
      custoTotal: r.custo_total,
      dados: r.entrada as unknown as Prisma.InputJsonValue,
      resultado: r.resultado as unknown as Prisma.InputJsonValue,
      observacoes: observacoes || null,
      validadeDias: padroes.validade_dias,
      maoObra: r.precificacao.mao_obra,
      margemPercent: r.precificacao.margem_percent,
      precoVenda: r.precificacao.preco_venda,
    },
    select: { id: true },
  });

  // O painel mostra o pedido novo na hora.
  revalidatePath("/orcamentos");
  revalidatePath("/painel");

  return { ok: true, erros: [], numero: criado.id };
}
