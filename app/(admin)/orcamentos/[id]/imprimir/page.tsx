import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { configTodas } from "@/lib/config";
import { reconstruirOrcamento, validoAte } from "@/lib/orcamento-salvo";
import { BotaoImprimir } from "@/components/botao-imprimir";
import { dataBr, formatarMetros, formatarNumero, formatarReais } from "@/lib/formatar";

export const metadata = { title: "Orçamento para o cliente" };

/**
 * A folha que vai para o CLIENTE — porte de admin/calculo-imprimir.php.
 * Mostra itens, totais, validade e condições; a memória de cálculo é
 * documento interno e fica de fora.
 */
export default async function OrcamentoImprimirPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirLogin();
  const { id } = await params;

  const numero = parseInt(id, 10);
  if (!Number.isFinite(numero) || numero <= 0) {
    redirect("/orcamentos");
  }
  const calculo = await prisma.calculo.findUnique({ where: { id: numero } });
  if (!calculo) {
    notFound();
  }

  const cfg = await configTodas();
  const r = reconstruirOrcamento(calculo);
  const prec = r?.precificacao ?? null;
  const temPrecificacao = prec !== null && (prec.mao_obra > 0 || prec.margem_valor > 0);

  const enderecoLinha = [
    cfg["empresa_endereco"],
    cfg["empresa_cidade"] ? `${cfg["empresa_cidade"]}/${cfg["empresa_uf"] ?? ""}` : "",
  ].filter(Boolean).join(", ");
  const contatoLinha = [cfg["empresa_telefones"], cfg["empresa_email"]].filter(Boolean).join(" · ");

  return (
    <>
      <div className="cabecalho nao-imprimir">
        <div>
          <h1>Orçamento para o cliente</h1>
          <p className="cabecalho__sub">Pronto para imprimir ou salvar como PDF pelo navegador.</p>
        </div>
        <div className="cabecalho__acoes">
          <Link className="btn" href={`/orcamentos/${calculo.id}`}>Voltar</Link>
          <BotaoImprimir rotulo="Imprimir / salvar PDF" primario />
        </div>
      </div>

      <div className="cartao">
        <div className="orcamento-cabecalho">
          <strong>{cfg["empresa_fantasia"] || "Enxovais & Cortinas"}</strong>
          {(cfg["empresa_razao"] || cfg["empresa_cnpj"]) && (
            <span>
              {[cfg["empresa_razao"], cfg["empresa_cnpj"] ? `CNPJ ${cfg["empresa_cnpj"]}` : ""]
                .filter(Boolean).join(" · ")}
            </span>
          )}
          {enderecoLinha && <span>{enderecoLinha}</span>}
          {contatoLinha && <span>{contatoLinha}</span>}
        </div>

        <dl className="resumo" style={{ marginBottom: "1.2rem" }}>
          <div><dt>Orçamento</dt><dd>Nº {calculo.id}</dd></div>
          <div><dt>Data</dt><dd>{dataBr(calculo.criadoEm)}</dd></div>
          <div><dt>Válido até</dt><dd>{dataBr(validoAte(calculo))}</dd></div>
          {calculo.clienteNome !== "" && (
            <div><dt>Cliente</dt><dd>{calculo.clienteNome}</dd></div>
          )}
          {calculo.ambiente !== "" && (
            <div><dt>Ambiente</dt><dd>{calculo.ambiente}</dd></div>
          )}
        </dl>

        <div className="tabela-rolo">
          <table className="tabela">
            <thead>
              <tr><th>Item</th><th>Descrição</th><th className="num">Valor</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Tecido</td>
                <td>
                  {calculo.tecidoNome} · {calculo.modeloNome} · {formatarMetros(calculo.metragemFinal)}
                </td>
                <td className="num">{formatarReais(r?.resultado.custo_tecido ?? 0)}</td>
              </tr>
              {(r?.acessorios ?? []).map((item) => (
                <tr key={item.item}>
                  <td>{item.item}</td>
                  <td>
                    {item.unidade === "m"
                      ? formatarMetros(item.quantidade)
                      : `${formatarNumero(item.quantidade, 0)} un`}
                  </td>
                  <td className="num">{item.custo > 0 ? formatarReais(item.custo) : "—"}</td>
                </tr>
              ))}
              {prec !== null && prec.mao_obra > 0 && (
                <tr>
                  <td>Mão de obra</td>
                  <td>confecção / instalação</td>
                  <td className="num">{formatarReais(prec.mao_obra)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="totais">
          {temPrecificacao && prec !== null ? (
            <>
              <div>
                <span>Subtotal (materiais + mão de obra)</span>
                <strong>{formatarReais(prec.subtotal)}</strong>
              </div>
              {prec.margem_valor > 0 && (
                <div>
                  <span>Margem ({formatarNumero(prec.margem_percent, 0)}%)</span>
                  <strong>{formatarReais(prec.margem_valor)}</strong>
                </div>
              )}
              <div className="totais__total">
                <span>Total</span>
                <strong>{formatarReais(prec.preco_venda)}</strong>
              </div>
            </>
          ) : (
            <div className="totais__total">
              <span>Total</span>
              <strong>{formatarReais(prec?.custo_materiais ?? calculo.custoTotal)}</strong>
            </div>
          )}
        </div>

        {calculo.condicoesPagamento !== "" && (
          <p style={{ marginTop: "1rem" }}>
            <strong>Condições de pagamento:</strong> {calculo.condicoesPagamento}
          </p>
        )}

        {calculo.observacoes && (
          <p style={{ marginTop: ".5rem", whiteSpace: "pre-wrap" }}>
            <strong>Observações:</strong> {calculo.observacoes}
          </p>
        )}
      </div>
    </>
  );
}
