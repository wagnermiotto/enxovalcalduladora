import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma único por processo — o equivalente do db() singleton do PHP.
 * Em desenvolvimento, o hot reload do Next recarrega módulos; guardar no
 * globalThis evita abrir uma conexão nova a cada recompilação.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
