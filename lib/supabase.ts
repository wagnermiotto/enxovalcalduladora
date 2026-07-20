import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Clientes Supabase (@supabase/ssr).
 *
 * ATENÇÃO — como este sistema acessa os dados:
 * as telas e formulários usam **Prisma dentro de Server Actions**, não estes
 * clientes. O motivo é segurança: a chave publishable abaixo vai para o
 * navegador de qualquer visitante, então tudo que ela alcança é público. Preço
 * de custo, margem de lucro, dados de clientes e o hash da senha do admin não
 * podem estar nesse alcance.
 *
 * Por isso o banco está com RLS habilitado e sem policies: a Data API nega
 * tudo. Estes clientes existem para recursos onde o Supabase é o caminho
 * natural (Storage para fotos de tecido, Realtime), e cada um exigirá a
 * policy correspondente, criada de propósito e com escopo mínimo.
 */

function exigirEnv(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(
      `Variável ${nome} não definida. Confira o .env (veja .env.example).`
    );
  }
  return valor;
}

const URL_SUPABASE = () => exigirEnv("NEXT_PUBLIC_SUPABASE_URL");
const CHAVE_PUBLICA = () => exigirEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

/** Cliente para componentes que rodam no navegador ("use client"). */
export function supabaseNavegador() {
  return createBrowserClient(URL_SUPABASE(), CHAVE_PUBLICA());
}

/**
 * Cliente para Server Components e Server Actions, com os cookies da
 * requisição — necessário se um dia houver sessão do Supabase Auth.
 */
export async function supabaseServidor() {
  const armazenamento = await cookies();
  return createServerClient(URL_SUPABASE(), CHAVE_PUBLICA(), {
    cookies: {
      getAll: () => armazenamento.getAll(),
      setAll: (aDefinir) => {
        try {
          for (const { name, value, options } of aDefinir) {
            armazenamento.set(name, value, options);
          }
        } catch {
          // Server Component não pode gravar cookie; quem renova a sessão é
          // a Server Action ou o proxy. Ignorar aqui é o comportamento
          // recomendado pela própria documentação do @supabase/ssr.
        }
      },
    },
  });
}
