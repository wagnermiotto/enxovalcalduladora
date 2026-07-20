/**
 * Tipos do domínio de cálculo. Espelham as chaves dos arrays do PHP
 * (includes/calculo.php) — o vocabulário é do negócio, não da linguagem.
 */

export type MetodoCorte = "travessado" | "tradicional";
export type ForcarMetodo = "auto" | MetodoCorte;

export interface EntradaCalculo {
  largura_varao?: number;
  altura?: number;
  fator_franzimento?: number;
  largura_tecido?: number;
  margem_barras?: number;
  rapport?: number;
  estampado?: boolean;
  encolhimento_percent?: number;
  rapport_percent?: number;
  seguranca_percent?: number;
  perda_ourela?: number;
  folga_lateral?: number;
  incremento?: number;
  preco_metro?: number;
  forcar_metodo?: ForcarMetodo;

  // acessórios
  usa_ilhos?: boolean;
  usa_entretela?: boolean;
  espacamento_ilhos?: number;
  ilhos_preco?: number;
  entretela_preco_metro?: number;
  forro_largura?: number;
  forro_preco_metro?: number;
  forro_encolhimento_percent?: number;
  varao_preco_metro?: number;
}

export interface PassoCalculo {
  rotulo: string;
  formula: string;
  valor: string;
}

export interface ResultadoCalculo {
  erros: string[];
  avisos: string[];
  metodo: MetodoCorte | "";
  metodo_motivo: string;
  cabe_travessado: boolean;
  ctl: number;
  altura_corte: number;
  largura_util: number;
  panos: number;
  metragem_por_altura: number;
  metragem_base: number;
  metragem_final: number;
  perda_percent: number;
  usou_rapport_percent: boolean;
  preco_metro: number;
  custo_tecido: number;
  passos: PassoCalculo[];
}

export interface ItemAcessorio {
  item: string;
  quantidade: number;
  unidade: "un" | "m";
  detalhe: string;
  custo: number;
}

export interface EntradaPrecificacao {
  custo_materiais?: number;
  metragem_final?: number;
  mao_obra_metro?: number;
  margem_percent?: number;
}

export interface Precificacao {
  custo_materiais: number;
  mao_obra: number;
  margem_percent: number;
  subtotal: number;
  margem_valor: number;
  preco_venda: number;
}
