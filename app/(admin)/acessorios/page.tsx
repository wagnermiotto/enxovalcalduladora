import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { excluirAcessorio } from "@/lib/actions/acessorios";
import { BotaoExcluir } from "@/components/botao-excluir";
import { formatarMetros, formatarNumero, formatarReais } from "@/lib/formatar";
import { TIPOS_ACESSORIO } from "@/lib/constantes";

export const metadata = { title: "Acessórios" };

const MSG: Record<string, string> = {
  criado: "Acessório cadastrado.",
  atualizado: "Acessório atualizado.",
  excluido: "Acessório excluído.",
};

export default async function AcessoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; msg?: string }>;
}) {
  await exigirLogin();
  const { q = "", tipo = "", msg = "" } = await searchParams;

  const where: Prisma.AcessorioWhereInput = {};
  if (q !== "") {
    where.OR = [{ nome: { contains: q } }, { fornecedor: { contains: q } }];
  }
  if (tipo !== "" && tipo in TIPOS_ACESSORIO) {
    where.tipo = tipo;
  }

  const acessorios = await prisma.acessorio.findMany({
    where,
    orderBy: [{ ativo: "desc" }, { tipo: "asc" }, { nome: "asc" }],
  });

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>Acessórios</h1>
          <p className="cabecalho__sub">Ilhoses, varões, trilhos, entretelas e forros.</p>
        </div>
        <div className="cabecalho__acoes">
          <Link className="btn btn--primario" href="/acessorios/novo">Novo acessório</Link>
        </div>
      </div>

      {msg !== "" && MSG[msg] && <div className="aviso">{MSG[msg]}</div>}

      <form className="filtros" method="get">
        <div className="campo filtros__busca">
          <label className="campo__rotulo" htmlFor="q">Buscar</label>
          <input type="text" id="q" name="q" defaultValue={q} placeholder="nome ou fornecedor" />
        </div>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="tipo">Tipo</label>
          <select id="tipo" name="tipo" defaultValue={tipo}>
            <option value="">Todos</option>
            {Object.entries(TIPOS_ACESSORIO).map(([chave, rotulo]) => (
              <option key={chave} value={chave}>{rotulo}</option>
            ))}
          </select>
        </div>
        <button className="btn" type="submit">Filtrar</button>
        <Link className="btn" href="/acessorios">Limpar</Link>
      </form>

      {acessorios.length === 0 ? (
        <div className="vazio">
          <p>Nenhum acessório cadastrado.</p>
          <Link className="btn btn--primario" href="/acessorios/novo">Cadastrar o primeiro</Link>
        </div>
      ) : (
        <div className="tabela-rolo">
          <table className="tabela">
            <thead>
              <tr>
                <th>Acessório</th>
                <th>Tipo</th>
                <th className="num">Preço</th>
                <th className="num">Largura</th>
                <th className="num">Estoque</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {acessorios.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.nome}</strong>{" "}
                    {!a.ativo && <span className="etiqueta etiqueta--inativo">inativo</span>}
                    {a.fornecedor && (
                      <>
                        <br />
                        <span className="campo__dica">{a.fornecedor}</span>
                      </>
                    )}
                  </td>
                  <td>{TIPOS_ACESSORIO[a.tipo] ?? a.tipo}</td>
                  <td className="num">
                    {formatarReais(a.preco)} / {a.unidade}
                  </td>
                  <td className="num">{a.largura > 0 ? formatarMetros(a.largura) : "—"}</td>
                  <td className="num">
                    {formatarNumero(a.estoque)}{" "}
                    {a.estoqueMinimo > 0 && a.estoque <= a.estoqueMinimo && (
                      <span className="etiqueta etiqueta--aviso">baixo</span>
                    )}
                  </td>
                  <td>
                    <div className="acoes-linha">
                      <Link className="btn btn--p" href={`/acessorios/${a.id}`}>Editar</Link>
                      <BotaoExcluir
                        action={excluirAcessorio.bind(null, a.id)}
                        mensagem={`Excluir "${a.nome}"?`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
