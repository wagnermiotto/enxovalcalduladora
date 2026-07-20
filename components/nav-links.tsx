"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/painel", rotulo: "Painel" },
  { href: "/calculadora", rotulo: "Calculadora" },
  { href: "/orcamentos", rotulo: "Orçamentos" },
  { href: "/tecidos", rotulo: "Tecidos" },
  { href: "/modelos", rotulo: "Modelos" },
  { href: "/acessorios", rotulo: "Acessórios" },
  { href: "/configuracoes", rotulo: "Configurações" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="nav">
      {LINKS.map(({ href, rotulo }) => {
        const ativo = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} className={`nav__link${ativo ? " nav__link--ativo" : ""}`}>
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
