"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { parseNumero } from "@/lib/formatar";
import { TIPOS_ACESSORIO, UNIDADES } from "@/lib/constantes";

export async function salvarAcessorio(
  _anterior: string[] | null,
  formData: FormData
): Promise<string[]> {
  await exigirLogin();

  const id = parseInt(String(formData.get("id") ?? "0"), 10) || 0;
  const dados = {
    nome: String(formData.get("nome") ?? "").trim(),
    tipo: String(formData.get("tipo") ?? "outro"),
    unidade: String(formData.get("unidade") ?? "un"),
    preco: parseNumero(String(formData.get("preco") ?? "")),
    largura: parseNumero(String(formData.get("largura") ?? "")),
    fornecedor: String(formData.get("fornecedor") ?? "").trim(),
    estoque: parseNumero(String(formData.get("estoque") ?? "")),
    estoqueMinimo: parseNumero(String(formData.get("estoque_minimo") ?? "")),
    ativo: formData.get("ativo") !== null,
  };

  const erros: string[] = [];
  if (dados.nome === "") {
    erros.push("O nome é obrigatório.");
  }
  if (!(dados.tipo in TIPOS_ACESSORIO)) {
    erros.push("Tipo inválido.");
  }
  if (!(dados.unidade in UNIDADES)) {
    erros.push("Unidade inválida.");
  }
  if (erros.length > 0) {
    return erros;
  }

  if (id > 0) {
    await prisma.acessorio.update({ where: { id }, data: dados });
  } else {
    await prisma.acessorio.create({ data: dados });
  }
  revalidatePath("/acessorios");
  redirect(`/acessorios?msg=${id > 0 ? "atualizado" : "criado"}`);
}

export async function excluirAcessorio(id: number): Promise<void> {
  await exigirLogin();
  await prisma.acessorio.delete({ where: { id } });
  revalidatePath("/acessorios");
  redirect("/acessorios?msg=excluido");
}
