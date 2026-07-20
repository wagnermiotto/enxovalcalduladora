import Link from "next/link";
import { prisma } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { dataHoraBr, formatarMetros, formatarNumero, formatarReais } from "@/lib/formatar";
import { STATUS_ORCAMENTO, statusEtiquetaClasse } from "@/lib/constantes";

export const metadata = { title: "Painel" };

export default async function PainelPage() {
  await exigirLogin();

  const inicioDoMes = new Date();
  inicioDoMes.setDate(1);
  inicioDoMes.setHours(0, 0, 0, 0);

  const [totalTecidos, totalModelos, totalOrcamentos, mes, ultimos, semRapport, comMinimo] =
    await Promise.all([
      prisma.tecido.count({ where: { ativo: true } }),
      prisma.modeloCortina.count({ where: { ativo: true } }),
      prisma.calculo.count(),
      prisma.calculo.aggregate({
        where: { criadoEm: { gte: inicioDoMes } },
        _count: true,
        _sum: { metragemFinal: true, custoTotal: true, precoVenda: true },
      }),
      prisma.calculo.findMany({ orderBy: [{ criadoEm: "desc" }, { id: "desc" }], take: 8 }),
      prisma.tecido.findMany({
        where: { ativo: true, estampado: true, rapport: { lte: 0 } },
        orderBy: { nome: "asc" },
      }),
      prisma.tecido.findMany({
        where: { ativo: true, estoqueMinimo: { gt: 0 } },
        orderBy: { nome: "asc" },
      }),
    ]);

  // Comparação coluna-a-coluna (estoque <= mínimo) feita em memória — o Prisma
  // não expressa isso no where, e SQL cru quebraria na troca SQLite→Postgres.
  const estoqueBaixo = comMinimo.filter((t) => t.estoqueMetros <= t.estoqueMinimo);

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>Painel</h1>
          <p className="cabecalho__sub">Visão geral do sistema.</p>
        </div>
        <div className="cabecalho__acoes">
          <Link className="btn btn--primario" href="/calculadora">Calcular uma cortina</Link>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi">
          <div className="kpi__rotulo">Orçamentos no mês</div>
          <div className="kpi__valor">{mes._count}</div>
          <div className="kpi__pe">{totalOrcamentos} no total</div>
        </div>
        <div className="kpi">
          <div className="kpi__rotulo">Tecido calculado no mês</div>
          <div className="kpi__valor">{formatarNumero(mes._sum.metragemFinal ?? 0, 1)} m</div>
          <div className="kpi__pe">soma das metragens</div>
        </div>
        <div className="kpi">
          <div className="kpi__rotulo">Vendas orçadas no mês</div>
          <div className="kpi__valor">{formatarReais(mes._sum.precoVenda ?? 0)}</div>
          <div className="kpi__pe">materiais: {formatarReais(mes._sum.custoTotal ?? 0)}</div>
        </div>
        <div className="kpi">
          <div className="kpi__rotulo">Cadastros</div>
          <div className="kpi__valor">{totalTecidos}</div>
          <div className="kpi__pe">
            {totalTecidos === 1 ? "tecido ativo" : "tecidos ativos"} · {totalModelos} modelos
          </div>
        </div>
      </div>

      {(semRapport.length > 0 || estoqueBaixo.length > 0) && (
        <div className="cartao" style={{ marginBottom: "1.2rem" }}>
          <div className="cartao__titulo">Pendências</div>

          {semRapport.length > 0 && (
            <div className="aviso aviso--atencao">
              <strong>{semRapport.length}</strong>{" "}
              {semRapport.length === 1
                ? "tecido estampado está"
                : "tecidos estampados estão"}{" "}
              sem o rapport medido, então o casamento da estampa entra por estimativa em vez da conta exata:{" "}
              {semRapport.map((t, i) => (
                <span key={t.id}>
                  <Link href={`/tecidos/${t.id}`}>{t.nome}</Link>
                  {i < semRapport.length - 1 ? ", " : ""}
                </span>
              ))}
            </div>
          )}

          {estoqueBaixo.length > 0 && (
            <div className="aviso aviso--atencao">
              <strong>Estoque baixo:</strong>{" "}
              {estoqueBaixo.map((t, i) => (
                <span key={t.id}>
                  <Link href={`/tecidos/${t.id}`}>{t.nome}</Link> ({formatarMetros(t.estoqueMetros)})
                  {i < estoqueBaixo.length - 1 ? ", " : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="cartao">
        <div className="cartao__titulo">Últimos orçamentos</div>
        {ultimos.length === 0 ? (
          <div className="vazio" style={{ border: "none", background: "none" }}>
            <p>Nenhum orçamento ainda.</p>
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
                  <th>Status</th>
                  <th className="num">Metragem</th>
                  <th className="num">Venda</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ultimos.map((c) => (
                  <tr key={c.id}>
                    <td>{dataHoraBr(c.criadoEm)}</td>
                    <td>
                      {c.clienteNome !== "" ? c.clienteNome : "—"}
                      {c.ambiente !== "" && (
                        <span className="campo__dica"> · {c.ambiente}</span>
                      )}
                    </td>
                    <td>{c.tecidoNome}</td>
                    <td>
                      <span className={`etiqueta ${statusEtiquetaClasse(c.status)}`}>
                        {STATUS_ORCAMENTO[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="num"><strong>{formatarMetros(c.metragemFinal)}</strong></td>
                    <td className="num">
                      {c.precoVenda > 0 ? formatarReais(c.precoVenda) : formatarReais(c.custoTotal)}
                    </td>
                    <td>
                      <Link className="btn btn--p" href={`/orcamentos/${c.id}`}>Ver</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
