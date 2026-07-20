"use client";

/**
 * Botão de exclusão com confirmação — o onsubmit="return confirm(...)" do PHP.
 * Recebe a Server Action já com o id aplicado (action.bind).
 */
export function BotaoExcluir({
  action,
  mensagem,
  rotulo = "Excluir",
}: {
  action: () => Promise<void>;
  mensagem: string;
  rotulo?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(mensagem)) {
          e.preventDefault();
        }
      }}
    >
      <button className="btn btn--p btn--perigo" type="submit">
        {rotulo}
      </button>
    </form>
  );
}
