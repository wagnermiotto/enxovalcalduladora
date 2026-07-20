import Link from "next/link";
import { configTodas } from "@/lib/config";

/**
 * Layout do site público — quem chega aqui não fez login e não deve ver
 * nenhum vestígio do painel além de um link discreto de acesso da equipe.
 */
export default async function PublicoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cfg = await configTodas();
  const fantasia = cfg["empresa_fantasia"] || "Enxovais & Cortinas";

  return (
    <>
      <header className="topo">
        <div className="wrap topo__inner">
          <Link className="topo__marca" href="/">
            <span className="topo__logo">E&amp;C</span>
            <span className="topo__nome">{fantasia}</span>
          </Link>
          <div className="topo__usuario">
            {cfg["empresa_telefones"] && (
              <span className="topo__quem">{cfg["empresa_telefones"]}</span>
            )}
            <Link className="nav__link nav__link--sair" href="/painel">
              Área da loja
            </Link>
          </div>
        </div>
      </header>
      <main className="wrap principal">{children}</main>
      <footer className="rodape">
        <div className="wrap">
          <span>
            {fantasia}
            {cfg["empresa_cidade"] ? ` — ${cfg["empresa_cidade"]}/${cfg["empresa_uf"] ?? ""}` : ""}
          </span>
        </div>
      </footer>
    </>
  );
}
