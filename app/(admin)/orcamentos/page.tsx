import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { excluirOrcamento } from "@/lib/actions/orcamentos";
import { BotaoExcluir } from "@/components/botao-excluir";
import { dataHoraBr, formatarMetros, formatarReais } from "@/lib/formatar";
import { STATUS_ORCAMENTO, statusEtiquetaClasse } from "@/lib/constantes";

export const metadata = { title: "Orçamentos" };

const MSG: Record<string, string> = {
  salvo: "Orçamento salvo.",
  excluido: "Orçamento excluído.",
};

export default async function OrcamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; msg?: string }>;
}) {
  await exigirLogin();
  const { q = "", status = "", msg = "" } = await searchParams;

  const where: Prisma.CalculoWhereInput = {};
  if (q !== "") {
    where.OR = [
      { clienteNome: { contains: q } },
      { ambiente: { contains: q } },
      { tecidoNome: { contains: q } },
    ];
  }
  if (status !== "" && status in STATUS_ORCAMENTO) {
    where.status = status;
  }

  const orcamentos = await prisma.calculo.findMany({
    where,
    orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
    take: 200,
  });

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>Orçamentos</h1>
          <p className="cabecalho__sub">
            Cada orçamento guarda uma cópia das medidas e dos preços do dia em que foi feito.
            Mudar o preço de um tecido não altera o que já está aqui.
          </p>
        </div>
        <div className="cabecalho__acoes">
          <Link className="btn btn--primario" href="/calculadora">Novo orçamento</Link>
        </div>
      </div>

      {msg !== "" && MSG[msg] && <div className="aviso">{MSG[msg]}</div>}

      <form className="filtros" method="get">
        <div className="campo filtros__busca">
          <label className="campo__rotulo" htmlFor="q">Buscar</label>
          <input type="text" id="q" name="q" defaultValue={q} placeholder="cliente, ambiente ou tecido" />
        </div>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status}>
            <option value="">Todos</option>
            {Object.entries(STATUS_ORCAMENTO).map(([chave, rotulo]) => (
              <option key={chave} value={chave}>{rotulo}</option>
            ))}
          </select>
        </div>
        <button className="btn" type="submit">Filtrar</button>
        <Link className="btn" href="/orcamentos">Limpar</Link>
      </form>

      {orcamentos.length === 0 ? (
        <div className="vazio">
          <p>Nenhum orçamento salvo ainda.</p>
          <Link className="btn btn--primario" href="/calculadora">Fazer o primeiro</Link>
        </div>
      ) : (
        <div className="tabela-rolo">
          <table className="tabela">
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente / ambiente</th>
                <th>Tecido</th>
                <th>Modelo</th>
                <th>Corte</th>
                <th className="num">Metragem</th>
                <th className="num">Custo</th>
                <th className="num">Venda</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orcamentos.map((c) => (
                <tr key={c.id}>
                  <td>{dataHoraBr(c.criadoEm)}</td>
                  <td>
                    <strong>{c.clienteNome !== "" ? c.clienteNome : "—"}</strong>
                    {c.origem === "site" && (
                      <> <span className="etiqueta etiqueta--novo">pelo site</span></>
                    )}
                    {(c.ambiente !== "" || c.clienteTelefone !== "") && (
                      <>
                        <br />
                        <span className="campo__dica">
                          {[c.ambiente, c.clienteTelefone].filter(Boolean).join(" · ")}
                        </span>
                      </>
                    )}
                  </td>
                  <td>{c.tecidoNome}</td>
                  <td>{c.modeloNome}</td>
                  <td>
                    <span className={`etiqueta ${c.metodo === "travessado" ? "etiqueta--ok" : ""}`}>
                      {c.metodo === "travessado" ? "travessado" : "panos"}
                    </span>
                  </td>
                  <td className="num"><strong>{formatarMetros(c.metragemFinal)}</strong></td>
                  <td className="num">{formatarReais(c.custoTotal)}</td>
                  <td className="num">{c.precoVenda > 0 ? formatarReais(c.precoVenda) : "—"}</td>
                  <td>
                    <span className={`etiqueta ${statusEtiquetaClasse(c.status)}`}>
                      {STATUS_ORCAMENTO[c.status] ?? c.status}
                    </span>
                  </td>
                  <td>
                    <div className="acoes-linha">
                      <Link className="btn btn--p" href={`/orcamentos/${c.id}`}>Ver</Link>
                      <BotaoExcluir
                        action={excluirOrcamento.bind(null, c.id)}
                        mensagem="Excluir este orçamento?"
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
