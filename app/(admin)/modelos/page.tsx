import Link from "next/link";
import { prisma } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { excluirModelo } from "@/lib/actions/modelos";
import { BotaoExcluir } from "@/components/botao-excluir";
import { formatarMetros, formatarNumero } from "@/lib/formatar";

export const metadata = { title: "Modelos de cortina" };

const MSG: Record<string, string> = {
  criado: "Modelo cadastrado.",
  atualizado: "Modelo atualizado.",
  excluido: "Modelo excluído.",
};

export default async function ModelosPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  await exigirLogin();
  const { msg = "" } = await searchParams;

  const modelos = await prisma.modeloCortina.findMany({
    orderBy: [{ ativo: "desc" }, { fatorFranzimento: "asc" }, { nome: "asc" }],
  });

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>Modelos de cortina</h1>
          <p className="cabecalho__sub">
            O fator de franzimento diz quantas vezes a largura do varão em tecido o modelo consome.
            Os valores abaixo são um ponto de partida — ajuste ao caimento que a loja pratica.
          </p>
        </div>
        <div className="cabecalho__acoes">
          <Link className="btn btn--primario" href="/modelos/novo">Novo modelo</Link>
        </div>
      </div>

      {msg !== "" && MSG[msg] && <div className="aviso">{MSG[msg]}</div>}

      {modelos.length === 0 ? (
        <div className="vazio">
          <p>Nenhum modelo cadastrado.</p>
          <Link className="btn btn--primario" href="/modelos/novo">Cadastrar o primeiro</Link>
        </div>
      ) : (
        <div className="tabela-rolo">
          <table className="tabela">
            <thead>
              <tr>
                <th>Modelo</th>
                <th className="num">Fator</th>
                <th className="num">Barras</th>
                <th>Acabamento</th>
                <th>Exemplo em varão de 3,00 m</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {modelos.map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.nome}</strong>{" "}
                    {!m.ativo && <span className="etiqueta etiqueta--inativo">inativo</span>}
                    {m.descricao && (
                      <>
                        <br />
                        <span className="campo__dica">{m.descricao}</span>
                      </>
                    )}
                  </td>
                  <td className="num">{formatarNumero(m.fatorFranzimento)}×</td>
                  <td className="num">{formatarMetros(m.margemBarras)}</td>
                  <td>
                    {m.usaEntretela && <span className="etiqueta">entretela</span>}{" "}
                    {m.usaIlhos && (
                      <span className="etiqueta">ilhós a cada {formatarMetros(m.espacamentoIlhos)}</span>
                    )}
                  </td>
                  <td className="campo__dica">
                    consome {formatarMetros(3.0 * m.fatorFranzimento)} de largura franzida
                  </td>
                  <td>
                    <div className="acoes-linha">
                      <Link className="btn btn--p" href={`/modelos/${m.id}`}>Editar</Link>
                      <BotaoExcluir
                        action={excluirModelo.bind(null, m.id)}
                        mensagem={`Excluir o modelo "${m.nome}"?`}
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
