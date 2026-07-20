"use client";

export function BotaoImprimir({
  rotulo = "Imprimir",
  primario = false,
}: {
  rotulo?: string;
  primario?: boolean;
}) {
  return (
    <button
      className={`btn${primario ? " btn--primario" : ""}`}
      type="button"
      onClick={() => window.print()}
    >
      {rotulo}
    </button>
  );
}
