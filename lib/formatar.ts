/**
 * Formatação e parse no padrão brasileiro — porte de includes/helpers.php.
 *
 * Implementado à mão (sem Intl) para reproduzir byte a byte o number_format()
 * do PHP: a memória de cálculo gerada aqui precisa ser idêntica à do sistema
 * PHP, inclusive nos textos que os testes comparam.
 */

/** number_format($v, $casas, ',', '.') do PHP: arredonda e agrupa milhar. */
export function formatarNumero(valor: number, casas = 2): string {
  const negativo = valor < 0;
  const fator = Math.pow(10, casas);
  // Epsilon corrige casos como 1.005 * 100 = 100.49999... antes do round
  const arredondado = Math.round(Math.abs(valor) * fator * (1 + Number.EPSILON)) / fator;

  const [inteira, decimal = ""] = arredondado.toFixed(casas).split(".");
  const comMilhar = inteira.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const corpo = casas > 0 ? `${comMilhar},${decimal}` : comMilhar;
  return negativo && arredondado > 0 ? `-${corpo}` : corpo;
}

export function formatarReais(valor: number): string {
  return `R$ ${formatarNumero(valor, 2)}`;
}

/** 19.2 -> "19,20 m" */
export function formatarMetros(valor: number, sufixo = " m"): string {
  return formatarNumero(valor, 2) + sufixo;
}

export function formatarPercent(valor: number): string {
  return `${formatarNumero(valor, 2)}%`;
}

/**
 * Converte número digitado no padrão brasileiro para number.
 * Aceita "1.005,50", "1005,50", "1005.50", "19,2" e "R$ 32,90".
 * Mesma lógica do parse_numero() do PHP: o separador que aparece por último
 * é o decimal.
 */
export function parseNumero(valor: string | number | null | undefined): number {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }
  const bruto = (valor ?? "").trim();
  if (bruto === "") {
    return 0;
  }
  let s = bruto.replace(/[^0-9,.\-]/g, "");
  if (s === "" || s === "-") {
    return 0;
  }

  const temVirgula = s.includes(",");
  const temPonto = s.includes(".");

  if (temVirgula && temPonto) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (temVirgula) {
    s = s.replace(",", ".");
  }

  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** Valor para um <input type="number">: ponto decimal, sem milhar. */
export function valorInput(valor: number, casas = 2): string {
  return valor.toFixed(casas);
}

export function dataBr(data: string | Date | null | undefined): string {
  if (!data) {
    return "";
  }
  const d = typeof data === "string" ? new Date(data) : data;
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function dataHoraBr(data: string | Date | null | undefined): string {
  if (!data) {
    return "";
  }
  const d = typeof data === "string" ? new Date(data) : data;
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
