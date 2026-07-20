import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { excluirTecido } from "@/lib/actions/tecidos";
import { BotaoExcluir } from "@/components/botao-excluir";
import { formatarMetros, formatarPercent, formatarReais } from "@/lib/formatar";
import { TIPOS_TECIDO } from "@/lib/constantes";

export const metadata = { title: "Tecidos" };

const MSG: Record<string, string> = {
  criado: "Tecido cadastrado.",
  atualizado: "Tecido atualizado.",
  excluido: "Tecido excluído.",
};

export default async function TecidosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; situacao?: string; msg?: string }>;
}) {
  await exigirLogin();
  const { q = "", tipo = "", situacao = "", msg = "" } = await searchParams;

  const where: Prisma.TecidoWhereInput = {};
  if (q !== "") {
    where.OR = [
      { nome: { contains: q } },
      { codigo: { contains: q } },
      { cor: { contains: q } },
      { fornecedor: { contains: q } },
    ];
  }
  if (tipo !== "" && tipo in TIPOS_TECIDO) {
    where.tipo = tipo;
  }
  if (situacao === "ativo" || situacao === "inativo") {
    where.ativo = situacao === "ativo";
  }

  const tecidos = await prisma.tecido.findMany({
    where,
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>Tecidos</h1>
          <p className="cabecalho__sub">
            A largura, o encolhimento e o rapport cadastrados aqui alimentam a calculadora.
          </p>
        </div>
        <div className="cabecalho__acoes">
          <Link className="btn btn--primario" href="/tecidos/novo">
            Novo tecido
          </Link>
        </div>
      </div>

      {msg !== "" && MSG[msg] && <div className="aviso">{MSG[msg]}</div>}

      <form className="filtros" method="get">
        <div className="campo filtros__busca">
          <label className="campo__rotulo" htmlFor="q">Buscar</label>
          <input type="text" id="q" name="q" defaultValue={q} placeholder="nome, código, cor ou fornecedor" />
        </div>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="tipo">Tipo</label>
          <select id="tipo" name="tipo" defaultValue={tipo}>
            <option value="">Todos</option>
            {Object.entries(TIPOS_TECIDO).map(([chave, rotulo]) => (
              <option key={chave} value={chave}>{rotulo}</option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="situacao">Situação</label>
          <select id="situacao" name="situacao" defaultValue={situacao}>
            <option value="">Todas</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>
        <button className="btn" type="submit">Filtrar</button>
        <Link className="btn" href="/tecidos">Limpar</Link>
      </form>

      {tecidos.length === 0 ? (
        <div className="vazio">
          <p>Nenhum tecido encontrado.</p>
          <Link className="btn btn--primario" href="/tecidos/novo">Cadastrar o primeiro</Link>
        </div>
      ) : (
        <div className="tabela-rolo">
          <table className="tabela">
            <thead>
              <tr>
                <th>Tecido</th>
                <th>Tipo</th>
                <th className="num">Largura</th>
                <th className="num">Preço/m</th>
                <th className="num">Encolhimento</th>
                <th className="num">Rapport</th>
                <th className="num">Estoque</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tecidos.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.nome}</strong>{" "}
                    {!t.ativo && <span className="etiqueta etiqueta--inativo">inativo</span>}{" "}
                    {t.estampado && <span className="etiqueta">estampado</span>}
                    <br />
                    <span className="campo__dica">
                      {[t.codigo, t.cor].filter(Boolean).join(" · ")}
                    </span>
                  </td>
                  <td>{TIPOS_TECIDO[t.tipo] ?? t.tipo}</td>
                  <td className="num">{formatarMetros(t.largura)}</td>
                  <td className="num">{formatarReais(t.precoMetro)}</td>
                  <td className="num">{formatarPercent(t.encolhimentoPercent)}</td>
                  <td className="num">
                    {t.rapport > 0 ? (
                      formatarMetros(t.rapport)
                    ) : t.estampado ? (
                      <span className="etiqueta etiqueta--aviso">não medido</span>
                    ) : (
                      <span className="campo__dica">liso</span>
                    )}
                  </td>
                  <td className="num">
                    {formatarMetros(t.estoqueMetros)}{" "}
                    {t.estoqueMinimo > 0 && t.estoqueMetros <= t.estoqueMinimo && (
                      <span className="etiqueta etiqueta--aviso">baixo</span>
                    )}
                  </td>
                  <td>
                    <div className="acoes-linha">
                      <Link className="btn btn--p" href={`/tecidos/${t.id}`}>Editar</Link>
                      <BotaoExcluir
                        action={excluirTecido.bind(null, t.id)}
                        mensagem={`Excluir o tecido "${t.nome}"? Os orçamentos já salvos não mudam.`}
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
