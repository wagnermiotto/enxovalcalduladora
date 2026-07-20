"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";

/**
 * Server Action do formulário de login. O redirect de sucesso é lançado como
 * exceção pelo Next (NEXT_REDIRECT) e precisa ser repassado — só o erro de
 * credencial vira mensagem para a tela.
 */
export async function entrar(
  _anterior: string | null,
  formData: FormData
): Promise<string | null> {
  try {
    await signIn("credentials", {
      usuario: String(formData.get("usuario") ?? ""),
      senha: String(formData.get("senha") ?? ""),
      redirectTo: "/painel",
    });
    return null;
  } catch (erro) {
    if (erro instanceof AuthError) {
      return "Usuário ou senha incorretos.";
    }
    throw erro;
  }
}

export async function sair(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
