import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { TecidoForm, type TecidoFormDados } from "@/components/tecido-form";

export const metadata = { title: "Tecido" };

/** Valores de um tecido novo — mesmos padrões do formulário PHP. */
const NOVO: TecidoFormDados = {
  id: 0,
  nome: "",
  codigo: "",
  tipo: "poliester",
  composicao: "",
  cor: "",
  largura: 2.8,
  precoMetro: 0,
  encolhimentoPercent: 1,
  rapport: 0,
  estampado: false,
  fornecedor: "",
  estoqueMetros: 0,
  estoqueMinimo: 0,
  observacoes: "",
  ativo: true,
};

export default async function TecidoFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirLogin();
  const { id } = await params;

  let tecido = NOVO;
  if (id !== "novo") {
    const numero = parseInt(id, 10);
    if (!Number.isFinite(numero) || numero <= 0) {
      redirect("/tecidos");
    }
    const existente = await prisma.tecido.findUnique({ where: { id: numero } });
    if (!existente) {
      notFound();
    }
    tecido = { ...existente, observacoes: existente.observacoes ?? "" };
  }

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>{tecido.id > 0 ? "Editar tecido" : "Novo tecido"}</h1>
          <p className="cabecalho__sub">Largura, encolhimento e rapport são o que a calculadora vai usar.</p>
        </div>
        <div className="cabecalho__acoes">
          <Link className="btn" href="/tecidos">Voltar</Link>
        </div>
      </div>
      <TecidoForm tecido={tecido} />
    </>
  );
}
