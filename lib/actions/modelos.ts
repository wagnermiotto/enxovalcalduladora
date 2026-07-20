"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { parseNumero } from "@/lib/formatar";

/** slugify() do PHP: minúsculas, sem acento, hífens. */
function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function salvarModelo(
  _anterior: string[] | null,
  formData: FormData
): Promise<string[]> {
  await exigirLogin();

  const id = parseInt(String(formData.get("id") ?? "0"), 10) || 0;
  const dados = {
    nome: String(formData.get("nome") ?? "").trim(),
    fatorFranzimento: parseNumero(String(formData.get("fator_franzimento") ?? "")),
    margemBarras: parseNumero(String(formData.get("margem_barras") ?? "")),
    usaEntretela: formData.get("usa_entretela") !== null,
    usaIlhos: formData.get("usa_ilhos") !== null,
    espacamentoIlhos: parseNumero(String(formData.get("espacamento_ilhos") ?? "0.16")),
    descricao: String(formData.get("descricao") ?? "").trim() || null,
    ativo: formData.get("ativo") !== null,
  };

  const erros: string[] = [];
  if (dados.nome === "") {
    erros.push("O nome do modelo é obrigatório.");
  }
  if (dados.fatorFranzimento <= 0) {
    erros.push("O fator de franzimento é obrigatório.");
  }
  if (dados.fatorFranzimento > 5) {
    erros.push("Fator acima de 5,0 consumiria cinco vezes a largura do varão em tecido. Confira o valor.");
  }
  if (dados.margemBarras < 0 || dados.margemBarras > 1) {
    erros.push("A margem de barras deve ficar entre 0 e 1,00 m.");
  }
  if (dados.usaIlhos && dados.espacamentoIlhos <= 0) {
    erros.push("Com ilhoses, o espaçamento precisa ser maior que zero.");
  }
  if (erros.length > 0) {
    return erros;
  }

  // O slug identifica o modelo e precisa ser único.
  let slug = slugify(dados.nome) || `modelo-${Date.now()}`;
  const conflito = await prisma.modeloCortina.findFirst({
    where: { slug, NOT: { id } },
  });
  if (conflito) {
    slug = `${slug}-${Date.now()}`;
  }

  if (id > 0) {
    await prisma.modeloCortina.update({ where: { id }, data: { ...dados, slug } });
  } else {
    await prisma.modeloCortina.create({ data: { ...dados, slug } });
  }
  revalidatePath("/modelos");
  redirect(`/modelos?msg=${id > 0 ? "atualizado" : "criado"}`);
}

export async function excluirModelo(id: number): Promise<void> {
  await exigirLogin();
  await prisma.modeloCortina.delete({ where: { id } });
  revalidatePath("/modelos");
  redirect("/modelos?msg=excluido");
}
