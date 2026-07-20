/**
 * Ajusta o provider do Prisma ao banco apontado por DATABASE_URL.
 *
 * Roda sozinho no `postinstall` e no `build` — inclusive no build da
 * Hostinger. Existe porque o provider do Prisma precisa ser uma string
 * literal no schema (não aceita env()), e um schema com "sqlite" apontando
 * para um DATABASE_URL "mysql://" quebra a aplicação inteira no ar, com uma
 * mensagem genérica de "problema com a configuração do servidor".
 *
 * Idempotente: se o provider já corresponde, não escreve nada.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * DATABASE_URL do ambiente (é assim que a Hostinger entrega) ou, no
 * desenvolvimento local, do arquivo .env — que o Next lê sozinho, mas um
 * script Node avulso não.
 */
function lerDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const env = join(raiz, ".env");
  if (!existsSync(env)) {
    return null;
  }
  const linha = readFileSync(env, "utf8")
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith("DATABASE_URL"));
  if (!linha) {
    return null;
  }
  return linha.slice(linha.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

const PROTOCOLOS = {
  "mysql:": "mysql",
  "postgres:": "postgresql",
  "postgresql:": "postgresql",
  "file:": "sqlite",
};

function providerDaUrl(url) {
  if (!url) {
    return null;
  }
  const protocolo = Object.keys(PROTOCOLOS).find((p) => url.startsWith(p));
  return protocolo ? PROTOCOLOS[protocolo] : null;
}

const caminho = join(raiz, "prisma", "schema.prisma");
const schema = readFileSync(caminho, "utf8");

const atual = schema.match(/provider\s*=\s*"(sqlite|mysql|postgresql)"/)?.[1] ?? null;
const desejado = providerDaUrl(lerDatabaseUrl());

if (!desejado) {
  // Sem DATABASE_URL (ou protocolo desconhecido) não há o que decidir —
  // mantém o schema como está em vez de chutar.
  console.log(
    `[prisma] DATABASE_URL ausente ou não reconhecida; mantendo provider "${atual}".`
  );
  process.exit(0);
}

if (atual === desejado) {
  console.log(`[prisma] provider já é "${desejado}", de acordo com DATABASE_URL.`);
  process.exit(0);
}

writeFileSync(caminho, schema.replace(/provider\s*=\s*"(sqlite|mysql|postgresql)"/, `provider = "${desejado}"`));
console.log(`[prisma] provider ajustado de "${atual}" para "${desejado}" (conforme DATABASE_URL).`);
