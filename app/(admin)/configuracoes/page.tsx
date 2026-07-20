import { exigirLogin } from "@/lib/sessao";
import { configTodas } from "@/lib/config";
import { ConfiguracoesForm } from "@/components/configuracoes-form";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  await exigirLogin();
  const { msg = "" } = await searchParams;
  const valores = await configTodas();

  return (
    <>
      <div className="cabecalho">
        <div>
          <h1>Configurações</h1>
          <p className="cabecalho__sub">
            Os padrões que a calculadora usa. Nenhuma regra de cálculo está presa no código — tudo aqui é seu.
          </p>
        </div>
      </div>

      {msg === "salvo" && <div className="aviso">Configurações salvas.</div>}

      <ConfiguracoesForm valores={valores} />
    </>
  );
}
