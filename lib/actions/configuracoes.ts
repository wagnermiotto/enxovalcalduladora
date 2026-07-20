"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { formatarNumero, parseNumero } from "@/lib/formatar";
import { CAMPOS_CALCULO, CAMPOS_EMPRESA } from "@/lib/config-campos";

export async function salvarConfiguracoes(
  _anterior: string[] | null,
  formData: FormData
): Promise<string[]> {
  await exigirLogin();

  const paraSalvar: Record<string, string> = {};
  const erros: string[] = [];

  for (const [chave, spec] of Object.entries(CAMPOS_CALCULO)) {
    const valor = parseNumero(String(formData.get(chave) ?? ""));
    if (valor < spec.min || valor > spec.max) {
      erros.push(
        `${spec.rotulo} deve ficar entre ${formatarNumero(spec.min, 2)} e ${formatarNumero(spec.max, 2)}.`
      );
      continue;
    }
    paraSalvar[chave] = String(valor);
  }
  for (const chave of Object.keys(CAMPOS_EMPRESA)) {
    paraSalvar[chave] = String(formData.get(chave) ?? "").trim();
  }

  if (erros.length > 0) {
    return erros;
  }

  for (const [chave, valor] of Object.entries(paraSalvar)) {
    await prisma.configuracao.upsert({
      where: { chave },
      update: { valor },
      create: { chave, valor },
    });
  }

  revalidatePath("/configuracoes");
  redirect("/configuracoes?msg=salvo");
}
