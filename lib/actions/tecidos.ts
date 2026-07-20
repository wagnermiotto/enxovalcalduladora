"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { parseNumero } from "@/lib/formatar";
import { TIPOS_TECIDO } from "@/lib/constantes";

/**
 * Mesmas validações do PHP (admin/tecido-form.php). Em caso de erro devolve
 * as mensagens para a tela re-exibir; em caso de sucesso redireciona com o
 * código de flash (?msg=) — o padrão POST-redirect do sistema original.
 */
export async function salvarTecido(
  _anterior: string[] | null,
  formData: FormData
): Promise<string[]> {
  await exigirLogin();

  const id = parseInt(String(formData.get("id") ?? "0"), 10) || 0;
  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();
  const numero = (campo: string) => parseNumero(String(formData.get(campo) ?? ""));

  const dados = {
    nome: texto("nome"),
    codigo: texto("codigo"),
    tipo: texto("tipo") || "outro",
    composicao: texto("composicao"),
    cor: texto("cor"),
    largura: numero("largura"),
    precoMetro: numero("preco_metro"),
    encolhimentoPercent: numero("encolhimento_percent"),
    rapport: numero("rapport"),
    estampado: formData.get("estampado") !== null,
    fornecedor: texto("fornecedor"),
    estoqueMetros: numero("estoque_metros"),
    estoqueMinimo: numero("estoque_minimo"),
    observacoes: texto("observacoes") || null,
    ativo: formData.get("ativo") !== null,
  };

  const erros: string[] = [];
  if (dados.nome === "") {
    erros.push("O nome do tecido é obrigatório.");
  }
  if (dados.largura <= 0) {
    erros.push("A largura do rolo é obrigatória — é ela que decide o método de corte.");
  }
  if (dados.largura > 4) {
    erros.push("Largura de rolo acima de 4,00 m não existe no mercado. Confira se digitou em metros.");
  }
  if (!(dados.tipo in TIPOS_TECIDO)) {
    erros.push("Tipo de tecido inválido.");
  }
  if (dados.encolhimentoPercent < 0 || dados.encolhimentoPercent > 50) {
    erros.push("O encolhimento deve ficar entre 0% e 50%.");
  }
  if (dados.rapport < 0) {
    erros.push("O rapport não pode ser negativo.");
  }
  if (erros.length > 0) {
    return erros;
  }

  if (id > 0) {
    await prisma.tecido.update({ where: { id }, data: dados });
  } else {
    await prisma.tecido.create({ data: dados });
  }
  revalidatePath("/tecidos");
  redirect(`/tecidos?msg=${id > 0 ? "atualizado" : "criado"}`);
}

export async function excluirTecido(id: number): Promise<void> {
  await exigirLogin();
  await prisma.tecido.delete({ where: { id } });
  revalidatePath("/tecidos");
  redirect("/tecidos?msg=excluido");
}
