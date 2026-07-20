/**
 * Troca o provider do Prisma entre sqlite (desenvolvimento local) e mysql
 * (produção na Hostinger — lá o banco disponível é MySQL).
 *
 * Uso:  node scripts/trocar-provider.mjs mysql
 *       node scripts/trocar-provider.mjs sqlite
 * Ou:   npm run db:mysql   /   npm run db:sqlite
 *
 * Depois de trocar, rode `npx prisma generate` (o npm run db:* já faz).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const alvo = process.argv[2];
if (alvo !== "sqlite" && alvo !== "mysql") {
  console.error("Uso: node scripts/trocar-provider.mjs <sqlite|mysql>");
  process.exit(1);
}

const caminho = join(dirname(fileURLToPath(import.meta.url)), "..", "prisma", "schema.prisma");
const schema = readFileSync(caminho, "utf8");

const trocado = schema.replace(
  /provider = "(sqlite|mysql)"/,
  `provider = "${alvo}"`
);

if (trocado === schema && !schema.includes(`provider = "${alvo}"`)) {
  console.error("Não encontrei a linha do provider no schema — nada foi alterado.");
  process.exit(1);
}

writeFileSync(caminho, trocado);
console.log(`Provider do Prisma agora é "${alvo}".`);
if (alvo === "mysql") {
  console.log('Lembre-se: DATABASE_URL precisa começar com "mysql://".');
} else {
  console.log('Lembre-se: DATABASE_URL local é "file:./dev.db".');
}
