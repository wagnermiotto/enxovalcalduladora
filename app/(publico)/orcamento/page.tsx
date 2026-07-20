import { prisma } from "@/lib/db";
import { calcPadroes, configTodas } from "@/lib/config";
import { SolicitarOrcamento } from "@/components/solicitar-orcamento";

export const metadata = {
  title: "Peça seu orçamento",
  description: "Informe as medidas da sua janela e receba um orçamento de cortina sob medida.",
  // Esta página é pública de propósito — pode ser indexada, ao contrário do painel.
  robots: { index: true, follow: true },
};

// Sem isto o Next pré-renderiza a página no build e o catálogo de tecidos fica
// congelado: um tecido cadastrado depois nunca apareceria para o cliente.
export const dynamic = "force-dynamic";

export default async function OrcamentoPublicoPage() {
  const [tecidos, modelos, padroes, cfg] = await Promise.all([
    // `select` explícito: preço, fornecedor e estoque NÃO saem do servidor.
    prisma.tecido.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        cor: true,
        tipo: true,
        largura: true,
        encolhimentoPercent: true,
        rapport: true,
        estampado: true,
      },
    }),
    prisma.modeloCortina.findMany({
      where: { ativo: true },
      orderBy: [{ fatorFranzimento: "asc" }, { nome: "asc" }],
      select: {
        id: true,
        nome: true,
        descricao: true,
        fatorFranzimento: true,
        margemBarras: true,
        usaIlhos: true,
        usaEntretela: true,
        espacamentoIlhos: true,
      },
    }),
    calcPadroes(),
    configTodas(),
  ]);

  return (
    <div className="publico">
      <div className="publico__intro">
        <h1>Cortinas sob medida</h1>
        <p>
          Informe as medidas da sua janela e escolha o tecido. Calculamos a metragem
          na hora e retornamos com o orçamento completo.
        </p>
      </div>

      {tecidos.length === 0 || modelos.length === 0 ? (
        <div className="vazio">
          <p>
            Nosso catálogo está em atualização no momento.
            {cfg["empresa_telefones"] ? ` Fale com a gente pelo ${cfg["empresa_telefones"]}.` : ""}
          </p>
        </div>
      ) : (
        <SolicitarOrcamento
          tecidos={tecidos}
          modelos={modelos.map((m) => ({ ...m, descricao: m.descricao ?? "" }))}
          // Só os padrões técnicos. Mão de obra e margem ficam no servidor.
          padroes={{
            seguranca_percent: padroes.seguranca_percent,
            rapport_percent: padroes.rapport_percent,
            perda_ourela: padroes.perda_ourela,
            folga_lateral: padroes.folga_lateral,
            incremento: padroes.incremento,
          }}
          whatsapp={cfg["empresa_telefones"] ?? ""}
        />
      )}
    </div>
  );
}
