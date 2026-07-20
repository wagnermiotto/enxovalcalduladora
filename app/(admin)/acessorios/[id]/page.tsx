import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { AcessorioForm, type AcessorioFormDados } from "@/components/acessorio-form";

export const metadata = { title: "Acessório" };

const NOVO: AcessorioFormDados = {
  id: 0,
  nome: "",
  tipo: "ilhos",
  unidade: "un",
  preco: 0,
  largura: 0,
  fornecedor: "",
  estoque: 0,
  estoqueMinimo: 0,
  ativo: true,
};

export default async function AcessorioFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirLogin();
  const { id } = await params;

  let acessorio = NOVO;
  if (id !== "novo") {
    const numero = parseInt(id, 10);
    if (!Number.isFinite(numero) || numero <= 0) {
      redirect("/acessorios");
    }
    const existente = await prisma.acessorio.findUnique({ where: { id: numero } });
    if (!existente) {
      notFound();
    }
    acessorio = existente;
  }

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>{acessorio.id > 0 ? "Editar acessório" : "Novo acessório"}</h1>
        </div>
        <div className="cabecalho__acoes">
          <Link className="btn" href="/acessorios">Voltar</Link>
        </div>
      </div>
      <AcessorioForm acessorio={acessorio} />
    </>
  );
}
