import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { ModeloForm, type ModeloFormDados } from "@/components/modelo-form";

export const metadata = { title: "Modelo de cortina" };

const NOVO: ModeloFormDados = {
  id: 0,
  nome: "",
  fatorFranzimento: 2.0,
  margemBarras: 0.2,
  usaEntretela: false,
  usaIlhos: false,
  espacamentoIlhos: 0.16,
  descricao: "",
  ativo: true,
};

export default async function ModeloFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirLogin();
  const { id } = await params;

  let modelo = NOVO;
  if (id !== "novo") {
    const numero = parseInt(id, 10);
    if (!Number.isFinite(numero) || numero <= 0) {
      redirect("/modelos");
    }
    const existente = await prisma.modeloCortina.findUnique({ where: { id: numero } });
    if (!existente) {
      notFound();
    }
    modelo = { ...existente, descricao: existente.descricao ?? "" };
  }

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>{modelo.id > 0 ? "Editar modelo" : "Novo modelo"}</h1>
        </div>
        <div className="cabecalho__acoes">
          <Link className="btn" href="/modelos">Voltar</Link>
        </div>
      </div>
      <ModeloForm modelo={modelo} />
    </>
  );
}
