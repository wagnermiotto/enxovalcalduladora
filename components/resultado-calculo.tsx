import Link from "next/link";
import type { ResultadoExecucao } from "@/lib/calculo-executar";
import { formatarMetros, formatarNumero, formatarPercent, formatarReais } from "@/lib/formatar";

/**
 * Bloco de resultado — porte de includes/calculo_resultado.php. Usado pelo
 * preview ao vivo da calculadora E pela página do orçamento salvo, para os
 * dois mostrarem exatamente a mesma coisa.
 */
export function ResultadoCalculo({ r }: { r: ResultadoExecucao }) {
  const res = r.resultado;

  if (res.erros.length > 0) {
    return (
      <div className="aviso aviso--erro">
        {res.erros.map((erro) => (
          <div key={erro}>{erro}</div>
        ))}
      </div>
    );
  }

  const prec = r.precificacao;
  const temPrecificacao = prec && (prec.mao_obra > 0 || prec.margem_valor > 0);

  return (
    <>
      <div className="resultado">
        <div className="resultado__destaque">
          <div className="resultado__numero">{formatarMetros(res.metragem_final)}</div>
          <div className="resultado__legenda">de tecido</div>
          {res.custo_tecido > 0 && (
            <div className="resultado__custo">{formatarReais(res.custo_tecido)}</div>
          )}
        </div>
        <div className="resultado__metodo">
          <span className={`etiqueta ${res.metodo === "travessado" ? "etiqueta--ok" : ""}`}>
            {res.metodo === "travessado" ? "Corte travessado" : "Corte tradicional (panos)"}
          </span>
          <p>{res.metodo_motivo}</p>
          <dl className="resumo">
            <div><dt>Largura franzida</dt><dd>{formatarMetros(res.ctl)}</dd></div>
            <div><dt>Altura de corte</dt><dd>{formatarMetros(res.altura_corte)}</dd></div>
            {res.metodo === "tradicional" && (
              <>
                <div><dt>Panos</dt><dd>{res.panos}</dd></div>
                <div><dt>Altura por pano</dt><dd>{formatarMetros(res.metragem_por_altura)}</dd></div>
              </>
            )}
            <div><dt>Metragem base</dt><dd>{formatarMetros(res.metragem_base)}</dd></div>
            <div><dt>Acréscimo total</dt><dd>{formatarPercent(res.perda_percent)}</dd></div>
          </dl>
        </div>
      </div>

      {res.avisos.map((aviso) => (
        <div className="aviso aviso--atencao" key={aviso}>{aviso}</div>
      ))}

      {r.acessorios.length > 0 && (
        <div className="cartao" style={{ marginTop: "1rem" }}>
          <div className="cartao__titulo">Acessórios</div>
          <div className="tabela-rolo">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="num">Quantidade</th>
                  <th>Observação</th>
                  <th className="num">Custo</th>
                </tr>
              </thead>
              <tbody>
                {r.acessorios.map((item) => (
                  <tr key={item.item}>
                    <td>{item.item}</td>
                    <td className="num">
                      {item.unidade === "m"
                        ? formatarMetros(item.quantidade)
                        : `${formatarNumero(item.quantidade, 0)} un`}
                    </td>
                    <td className="campo__dica">{item.detalhe}</td>
                    <td className="num">{item.custo > 0 ? formatarReais(item.custo) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="cartao memoria">
        <div className="cartao__titulo">Memória de cálculo</div>
        <p className="campo__dica" style={{ marginTop: "-.4rem" }}>
          Cada linha mostra de onde veio o número seguinte. Confira antes de cortar.
        </p>
        <div className="tabela-rolo">
          <table className="tabela memoria__tabela">
            <tbody>
              {res.passos.map((passo) => (
                <tr key={passo.rotulo + passo.valor}>
                  <td className="memoria__rotulo">{passo.rotulo}</td>
                  <td className="memoria__formula">{passo.formula}</td>
                  <td className="memoria__valor">{passo.valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {r.custo_total > 0 && (
        <>
          <div className="totais">
            <div><span>Tecido</span><strong>{formatarReais(res.custo_tecido)}</strong></div>
            {r.custo_acessorios > 0 && (
              <div><span>Acessórios</span><strong>{formatarReais(r.custo_acessorios)}</strong></div>
            )}
            {temPrecificacao ? (
              <>
                <div><span>Custo dos materiais</span><strong>{formatarReais(r.custo_total)}</strong></div>
                {prec.mao_obra > 0 && (
                  <div><span>Mão de obra</span><strong>{formatarReais(prec.mao_obra)}</strong></div>
                )}
                {prec.margem_valor > 0 && (
                  <div>
                    <span>Margem ({formatarNumero(prec.margem_percent, 0)}%)</span>
                    <strong>{formatarReais(prec.margem_valor)}</strong>
                  </div>
                )}
                <div className="totais__total">
                  <span>Preço de venda</span>
                  <strong>{formatarReais(prec.preco_venda)}</strong>
                </div>
              </>
            ) : (
              <div className="totais__total">
                <span>Custo dos materiais</span>
                <strong>{formatarReais(r.custo_total)}</strong>
              </div>
            )}
          </div>
          {!temPrecificacao && (
            <p className="campo__dica">
              Este é o custo dos materiais — não inclui mão de obra, instalação nem margem de lucro.
              Configure em <Link href="/configuracoes">Configurações</Link> para ver o preço de venda completo.
            </p>
          )}
        </>
      )}
    </>
  );
}
