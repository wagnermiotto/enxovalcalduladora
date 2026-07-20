"use client";

import { useActionState, useMemo, useState } from "react";
import { enviarSolicitacao, type RespostaSolicitacao } from "@/lib/actions/solicitacao";
import { calcCortina } from "@/lib/calculo";
import { formatarMetros, formatarNumero } from "@/lib/formatar";

/**
 * Formulário público de pedido de orçamento.
 *
 * O que este componente PODE saber (vai para o navegador de qualquer visitante):
 * dados técnicos do tecido — largura, encolhimento, rapport. Isso basta para
 * estimar a metragem.
 *
 * O que ele NÃO recebe: preço por metro, fornecedor, estoque, mão de obra e
 * margem. São informações comerciais da loja; o valor é calculado no servidor
 * e enviado ao cliente depois, pela própria loja.
 */

export interface TecidoPublico {
  id: number;
  nome: string;
  cor: string;
  tipo: string;
  largura: number;
  encolhimentoPercent: number;
  rapport: number;
  estampado: boolean;
}

export interface ModeloPublico {
  id: number;
  nome: string;
  descricao: string;
  fatorFranzimento: number;
  margemBarras: number;
  usaIlhos: boolean;
  usaEntretela: boolean;
  espacamentoIlhos: number;
}

/** Só os padrões técnicos — nada de dinheiro. */
export interface PadroesTecnicos {
  seguranca_percent: number;
  rapport_percent: number;
  perda_ourela: number;
  folga_lateral: number;
  incremento: number;
}

export function SolicitarOrcamento({
  tecidos,
  modelos,
  padroes,
  whatsapp,
}: {
  tecidos: TecidoPublico[];
  modelos: ModeloPublico[];
  padroes: PadroesTecnicos;
  whatsapp: string;
}) {
  const [resposta, acaoEnviar, enviando] = useActionState<RespostaSolicitacao | null, FormData>(
    enviarSolicitacao,
    null
  );

  const [larguraVarao, setLarguraVarao] = useState("");
  const [altura, setAltura] = useState("");
  const [tecidoId, setTecidoId] = useState("");
  const [modeloId, setModeloId] = useState("");

  const tecido = tecidos.find((t) => t.id === parseInt(tecidoId, 10)) ?? null;
  const modelo = modelos.find((m) => m.id === parseInt(modeloId, 10)) ?? null;

  // Estimativa de metragem no próprio navegador — mesma função do sistema
  // interno, só que sem nenhum valor em reais.
  const estimativa = useMemo(() => {
    const lv = parseFloat(larguraVarao);
    const ac = parseFloat(altura);
    if (!(lv > 0) || !(ac > 0) || !tecido || !modelo) {
      return null;
    }
    const r = calcCortina({
      largura_varao: lv,
      altura: ac,
      fator_franzimento: modelo.fatorFranzimento,
      largura_tecido: tecido.largura,
      margem_barras: modelo.margemBarras,
      rapport: tecido.rapport,
      estampado: tecido.estampado,
      encolhimento_percent: tecido.encolhimentoPercent,
      rapport_percent: padroes.rapport_percent,
      seguranca_percent: padroes.seguranca_percent,
      perda_ourela: padroes.perda_ourela,
      folga_lateral: padroes.folga_lateral,
      incremento: padroes.incremento,
      preco_metro: 0, // de propósito: o cliente não vê valores
      forcar_metodo: "auto",
    });
    return r.erros.length > 0 ? null : r;
  }, [larguraVarao, altura, tecido, modelo, padroes]);

  if (resposta?.ok) {
    return (
      <div className="cartao publico__sucesso">
        <h2>Pedido enviado!</h2>
        <p>
          Recebemos sua solicitação sob o número <strong>#{resposta.numero}</strong>.
          Vamos conferir as medidas e retornar com o orçamento pelo contato que você informou.
        </p>
        {whatsapp !== "" && (
          <p className="campo__dica">
            Se preferir falar agora, o telefone da loja é <strong>{whatsapp}</strong>.
          </p>
        )}
        <button className="btn" type="button" onClick={() => window.location.reload()}>
          Fazer outro pedido
        </button>
      </div>
    );
  }

  return (
    <form action={acaoEnviar} className="publico__form">
      {resposta && resposta.erros.length > 0 && (
        <div className="aviso aviso--erro">
          {resposta.erros.map((erro) => (
            <div key={erro}>{erro}</div>
          ))}
        </div>
      )}

      <div className="cartao" style={{ marginBottom: "1rem" }}>
        <div className="bloco__titulo">Seus dados</div>
        <div className="grade">
          <div className="campo">
            <label className="campo__rotulo" htmlFor="cliente_nome">Nome *</label>
            <input type="text" id="cliente_nome" name="cliente_nome" required maxLength={200} />
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="cliente_telefone">Telefone / WhatsApp *</label>
            <input type="text" id="cliente_telefone" name="cliente_telefone" required maxLength={40}
                   placeholder="(16) 99999-0000" />
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="cliente_email">E-mail (opcional)</label>
            <input type="email" id="cliente_email" name="cliente_email" maxLength={160} />
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="ambiente">Ambiente</label>
            <input type="text" id="ambiente" name="ambiente" maxLength={200}
                   placeholder="ex.: sala, quarto do casal" />
          </div>
        </div>
      </div>

      <div className="cartao" style={{ marginBottom: "1rem" }}>
        <div className="bloco__titulo">Medidas da cortina</div>
        <div className="grade">
          <div className="campo">
            <label className="campo__rotulo" htmlFor="largura_varao">Largura do varão (m) *</label>
            <input type="number" id="largura_varao" name="largura_varao" step="0.01" min="0.1" max="30"
                   required value={larguraVarao} onChange={(e) => setLarguraVarao(e.target.value)} />
            <span className="campo__dica">Meça a barra onde a cortina será pendurada.</span>
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="altura">Altura desejada (m) *</label>
            <input type="number" id="altura" name="altura" step="0.01" min="0.1" max="10"
                   required value={altura} onChange={(e) => setAltura(e.target.value)} />
            <span className="campo__dica">Do varão até onde a cortina deve terminar.</span>
          </div>
        </div>
      </div>

      <div className="cartao" style={{ marginBottom: "1rem" }}>
        <div className="bloco__titulo">Tecido e modelo</div>
        <div className="grade">
          <div className="campo">
            <label className="campo__rotulo" htmlFor="tecido_id">Tecido *</label>
            <select id="tecido_id" name="tecido_id" required
                    value={tecidoId} onChange={(e) => setTecidoId(e.target.value)}>
              <option value="">Escolha o tecido…</option>
              {tecidos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}{t.cor ? ` — ${t.cor}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label className="campo__rotulo" htmlFor="modelo_id">Modelo *</label>
            <select id="modelo_id" name="modelo_id" required
                    value={modeloId} onChange={(e) => setModeloId(e.target.value)}>
              <option value="">Escolha o modelo…</option>
              {modelos.map((m) => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
            {modelo?.descricao && <span className="campo__dica">{modelo.descricao}</span>}
          </div>
        </div>
      </div>

      {estimativa && (
        <div className="publico__estimativa">
          <div>
            <span className="publico__estimativa-rotulo">Estimativa de tecido</span>
            <strong className="publico__estimativa-valor">
              {formatarMetros(estimativa.metragem_final)}
            </strong>
          </div>
          <p className="campo__dica">
            {estimativa.metodo === "travessado"
              ? "Este tecido permite corte travessado: a cortina sai em peça única, sem emendas."
              : `A cortina será montada com ${formatarNumero(estimativa.panos, 0)} panos costurados lado a lado.`}
            {" "}É uma estimativa — confirmamos tudo antes de produzir e enviamos o valor com o orçamento.
          </p>
        </div>
      )}

      <div className="cartao" style={{ marginBottom: "1rem" }}>
        <div className="campo">
          <label className="campo__rotulo" htmlFor="observacoes">Alguma observação?</label>
          <textarea id="observacoes" name="observacoes" rows={3} maxLength={1000}
                    placeholder="Cor preferida, prazo, se já tem varão instalado…" />
        </div>
      </div>

      <button className="btn btn--primario publico__enviar" type="submit" disabled={enviando}>
        {enviando ? "Enviando…" : "Pedir orçamento"}
      </button>
    </form>
  );
}
