import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

/**
 * Autenticação — porte do login único de admin do PHP (includes/auth.php).
 * Auth.js com credentials + bcrypt contra a tabela AdminUsuario; sessão em
 * JWT assinado com AUTH_SECRET (o session_regenerate_id/CSRF do PHP viram
 * responsabilidade do Auth.js e das Server Actions, que validam origem).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  // Atrás do proxy da Hostinger (ou de qualquer host que não a Vercel) o
  // Auth.js precisa confiar no Host repassado pelo servidor da frente.
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        usuario: { label: "Usuário" },
        senha: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const usuario = String(credentials?.usuario ?? "").trim();
        const senha = String(credentials?.senha ?? "");
        if (usuario === "" || senha === "") {
          return null;
        }
        const u = await prisma.adminUsuario.findUnique({ where: { usuario } });
        if (!u || !(await bcrypt.compare(senha, u.senhaHash))) {
          return null;
        }
        return { id: String(u.id), name: u.nome !== "" ? u.nome : u.usuario };
      },
    }),
  ],
});
