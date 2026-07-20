import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * O require_login() do PHP: chamado no topo de toda página e de toda Server
 * Action do grupo (admin). Preferido a um middleware/proxy porque roda no
 * runtime Node junto do Prisma e não depende de convenções que mudam entre
 * versões do Next.
 */
export async function exigirLogin() {
  const sessao = await auth();
  if (!sessao?.user) {
    redirect("/login");
  }
  return sessao;
}
