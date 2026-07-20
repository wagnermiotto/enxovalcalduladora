/**
 * Especificação dos campos de configuração — uma tabela só alimenta a
 * validação (Server Action) e a tela, para os limites nunca divergirem.
 * Porte de admin/configuracoes.php.
 */

/** Padrões de cálculo resolvidos — definido aqui (módulo isomórfico) para o
 *  cliente poder tipar sem importar lib/config.ts, que é server-only. */
export interface PadroesCalculo {
  seguranca_percent: number;
  rapport_percent: number;
  perda_ourela: number;
  folga_lateral: number;
  incremento: number;
  espacamento_ilhos: number;
  mao_obra_metro: number;
  margem_percent: number;
  validade_dias: number;
}

export interface CampoCalculoSpec {
  rotulo: string;
  min: number;
  max: number;
  passo: number;
  dica: string;
}

export const CAMPOS_CALCULO: Record<string, CampoCalculoSpec> = {
  calc_seguranca_percent: {
    rotulo: "Margem de segurança (%)",
    min: 0, max: 50, passo: 0.5,
    dica: "Cobre defeitos no tecido, erros de corte e sobra para reparos futuros.",
  },
  calc_rapport_percent: {
    rotulo: "Rapport estimado (%)",
    min: 0, max: 60, passo: 1,
    dica: "Só entra quando o tecido é estampado e o rapport não foi medido. Meça e cadastre no tecido para a conta virar exata.",
  },
  calc_perda_ourela: {
    rotulo: "Perda de ourela (m)",
    min: 0, max: 0.5, passo: 0.01,
    dica: "Descontado da largura de cada pano: ourela mais a costura da emenda.",
  },
  calc_folga_lateral: {
    rotulo: "Folga lateral no travessado (m)",
    min: 0, max: 1, passo: 0.01,
    dica: "Somada à metragem quando o corte é travessado, para as barras laterais.",
  },
  calc_incremento: {
    rotulo: "Incremento de venda (m)",
    min: 0.01, max: 5, passo: 0.01,
    dica: "O resultado final sobe para o próximo múltiplo disso. Use 0,10 se a loja corta em 10 cm; 1,00 se só vende metro fechado.",
  },
  calc_espacamento_ilhos: {
    rotulo: "Espaçamento padrão dos ilhoses (m)",
    min: 0.01, max: 1, passo: 0.01,
    dica: "Usado quando o modelo não define o próprio.",
  },
  calc_mao_obra_metro: {
    rotulo: "Mão de obra por metro (R$/m)",
    min: 0, max: 500, passo: 0.5,
    dica: "Rateada pela metragem final do tecido. Zero = não cobrar mão de obra no orçamento.",
  },
  calc_margem_percent: {
    rotulo: "Margem de lucro (%)",
    min: 0, max: 300, passo: 0.5,
    dica: "Aplicada sobre materiais + mão de obra. Zero = preço de venda igual ao custo.",
  },
  calc_validade_dias: {
    rotulo: "Validade do orçamento (dias)",
    min: 1, max: 120, passo: 1,
    dica: "Prazo impresso no orçamento entregue ao cliente.",
  },
};

export const CAMPOS_EMPRESA: Record<string, string> = {
  empresa_fantasia: "Nome fantasia",
  empresa_razao: "Razão social",
  empresa_cnpj: "CNPJ",
  empresa_telefones: "Telefones",
  empresa_email: "E-mail",
  empresa_endereco: "Endereço",
  empresa_cidade: "Cidade",
  empresa_uf: "UF",
};
