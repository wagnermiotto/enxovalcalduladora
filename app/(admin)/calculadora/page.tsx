import { prisma } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { calcPadroes, configTodas } from "@/lib/config";
import { Calculadora } from "@/components/calculadora";
import type { AcessorioLite } from "@/lib/calculo-executar";

export const metadata = { title: "Calculadora de cortinas" };

export default async function CalculadoraPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await exigirLogin();
  const sp = await searchParams;

  const [tecidos, modelos, acessorios, padroes, cfg] = await Promise.all([
    prisma.tecido.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.modeloCortina.findMany({
      where: { ativo: true },
      orderBy: [{ fatorFranzimento: "asc" }, { nome: "asc" }],
    }),
    prisma.acessorio.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    calcPadroes(),
    configTodas(),
  ]);

  const porTipo = (...tipos: string[]): AcessorioLite[] =>
    acessorios.filter((a) => tipos.includes(a.tipo));

  return (
    <>
      <div className="cabecalho nao-imprimir">
        <div>
          <h1>Calculadora de cortinas</h1>
          <p className="cabecalho__sub">Medidas e tecido; o método de corte é escolhido sozinho.</p>
        </div>
      </div>

      {(tecidos.length === 0 || modelos.length === 0) && (
        <div className="aviso aviso--atencao nao-imprimir">
          {tecidos.length === 0 && (
            <>Nenhum tecido ativo cadastrado — a calculadora precisa da largura do rolo.{" "}</>
          )}
          {modelos.length === 0 && (
            <>Nenhum modelo ativo cadastrado — é dele que vem o fator de franzimento.</>
          )}
        </div>
      )}

      <Calculadora
        inicial={{
          largura_varao: sp.largura_varao ?? "",
          altura: sp.altura ?? "",
          tecido_id: sp.tecido_id ?? "",
          modelo_id: sp.modelo_id ?? "",
          cliente_nome: sp.cliente_nome ?? "",
          ambiente: sp.ambiente ?? "",
        }}
        tecidos={tecidos}
        modelos={modelos}
        ilhoses={porTipo("ilhos")}
        entretelas={porTipo("entretela")}
        forros={porTipo("forro")}
        varoes={porTipo("varao", "trilho")}
        padroes={padroes}
        empresa={{
          fantasia: cfg["empresa_fantasia"] || "Enxovais & Cortinas",
          telefones: cfg["empresa_telefones"] || "",
        }}
      />
    </>
  );
}
