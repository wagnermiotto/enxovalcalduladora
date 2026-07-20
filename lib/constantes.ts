/**
 * Tabelas de rótulos do domínio — porte de includes/helpers.php.
 */

export const TIPOS_TECIDO: Record<string, string> = {
  algodao: "Algodão",
  linho: "Linho",
  viscose: "Viscose",
  poliester: "Poliéster",
  voil: "Voil",
  "linho-sint": "Linho sintético",
  blackout: "Blackout",
  gorgurao: "Gorgurão",
  jacquard: "Jacquard",
  renda: "Renda",
  outro: "Outro",
};

/**
 * Encolhimento típico por tipo — só um chute inicial que o formulário
 * pré-preenche. O valor que vale é o que fica salvo no cadastro do tecido.
 */
export const ENCOLHIMENTO_SUGERIDO: Record<string, number> = {
  algodao: 8,
  linho: 10,
  viscose: 7,
  poliester: 1,
  voil: 2,
  "linho-sint": 2,
  blackout: 1,
  gorgurao: 3,
  jacquard: 3,
  renda: 3,
  outro: 3,
};

export const TIPOS_ACESSORIO: Record<string, string> = {
  ilhos: "Ilhós",
  varao: "Varão",
  trilho: "Trilho",
  entretela: "Entretela",
  forro: "Forro",
  fita: "Fita franzidora",
  suporte: "Suporte / ponteira",
  outro: "Outro",
};

export const UNIDADES: Record<string, string> = {
  un: "Unidade",
  m: "Metro",
};

export const STATUS_ORCAMENTO: Record<string, string> = {
  /** Chegou pelo site público e ainda não foi trabalhado pela loja. */
  solicitado: "Solicitado pelo cliente",
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

/** Classe de etiqueta (.etiqueta--*) para colorir o status na tela. */
export function statusEtiquetaClasse(status: string): string {
  switch (status) {
    case "aprovado":
      return "etiqueta--ok";
    case "enviado":
      return "etiqueta--aviso";
    case "solicitado":
      return "etiqueta--novo";
    case "recusado":
      return "etiqueta--inativo";
    default:
      return "";
  }
}

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;
