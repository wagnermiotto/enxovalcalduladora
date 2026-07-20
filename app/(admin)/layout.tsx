import Link from "next/link";
import { NavLinks } from "@/components/nav-links";
import { exigirLogin } from "@/lib/sessao";
import { sair } from "@/lib/actions/sessao";

/**
 * Layout do grupo (admin): topo + nav + rodapé, com login exigido.
 * As páginas também chamam exigirLogin() individualmente (o require_login()
 * de cada arquivo PHP) — o layout é conforto visual, a página é a fronteira.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sessao = await exigirLogin();

  return (
    <>
      <header className="topo">
        <div className="wrap topo__inner">
          <Link className="topo__marca" href="/painel">
            <span className="topo__logo">E&amp;C</span>
            <span className="topo__nome">Enxovais &amp; Cortinas</span>
          </Link>
          <NavLinks />
          <div className="topo__usuario">
            <span className="topo__quem">{sessao.user?.name}</span>
            <form action={sair}>
              <button className="nav__link nav__link--sair" type="submit">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="wrap principal">{children}</main>
      <footer className="rodape">
        <div className="wrap">
          <span>Enxovais &amp; Cortinas — sistema de gestão</span>
        </div>
      </footer>
    </>
  );
}
