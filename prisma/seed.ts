/**
 * Seed do banco — porte dos seeds de includes/db.php.
 *
 * Idempotente: só insere o que não existe. Roda com `npx prisma db seed`.
 * - Configurações padrão e modelos de cortina: sempre (são dados de produção).
 * - Admin: cria "admin" se não houver nenhum usuário (senha em SEED_ADMIN_SENHA).
 * - Tecidos/acessórios de demonstração: só com SEED_DEMO=1 (dados de teste).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ---------- configurações (chave/valor) ----------
  const configs: Record<string, string> = {
    // padrões de cálculo — ponto de partida, tudo editável na tela
    calc_seguranca_percent: "10",
    calc_rapport_percent: "20",
    calc_perda_ourela: "0.04",
    calc_folga_lateral: "0.10",
    calc_incremento: "0.10",
    calc_espacamento_ilhos: "0.16",
    calc_mao_obra_metro: "0",
    calc_margem_percent: "0",
    calc_validade_dias: "15",
    // dados da empresa (impressões)
    empresa_razao: "",
    empresa_fantasia: "Enxovais & Cortinas",
    empresa_cnpj: "",
    empresa_endereco: "",
    empresa_cidade: "",
    empresa_uf: "",
    empresa_telefones: "",
    empresa_email: "",
  };
  for (const [chave, valor] of Object.entries(configs)) {
    await prisma.configuracao.upsert({
      where: { chave },
      update: {}, // nunca sobrescreve valor já configurado pelo usuário
      create: { chave, valor },
    });
  }

  // ---------- modelos de cortina ----------
  // margem_barras: 0,27 com entretela (12cm + 15cm) / 0,20 sem (5cm + 15cm)
  const modelos = [
    { nome: "Ilhós", slug: "ilhos", fatorFranzimento: 2.0, margemBarras: 0.27, usaEntretela: true, usaIlhos: true, espacamentoIlhos: 0.16, descricao: "Cortina com ilhoses metálicos no cabeçalho." },
    { nome: "Franzida simples", slug: "franzida-simples", fatorFranzimento: 2.0, margemBarras: 0.2, usaEntretela: false, usaIlhos: false, espacamentoIlhos: 0.16, descricao: "Franzimento simples com fita franzidora." },
    { nome: "Wave", slug: "wave", fatorFranzimento: 2.4, margemBarras: 0.27, usaEntretela: true, usaIlhos: false, espacamentoIlhos: 0.16, descricao: "Ondas contínuas e uniformes (fita wave + trilho próprio)." },
    { nome: "Prega americana", slug: "prega-americana", fatorFranzimento: 2.6, margemBarras: 0.27, usaEntretela: true, usaIlhos: false, espacamentoIlhos: 0.16, descricao: "Prega tripla costurada à mão. Caimento clássico." },
    { nome: "Xale", slug: "xale", fatorFranzimento: 3.0, margemBarras: 0.2, usaEntretela: false, usaIlhos: false, espacamentoIlhos: 0.16, descricao: "Bem franzida, para tecidos leves." },
  ];
  for (const modelo of modelos) {
    await prisma.modeloCortina.upsert({
      where: { slug: modelo.slug },
      update: {},
      create: modelo,
    });
  }

  // ---------- admin ----------
  const temAdmin = (await prisma.adminUsuario.count()) > 0;
  if (!temAdmin) {
    const senha = process.env.SEED_ADMIN_SENHA ?? "enxoval123";
    await prisma.adminUsuario.create({
      data: {
        usuario: process.env.SEED_ADMIN_USUARIO ?? "admin",
        nome: "Administrador",
        senhaHash: await bcrypt.hash(senha, 10),
      },
    });
    console.log(
      `Admin "${process.env.SEED_ADMIN_USUARIO ?? "admin"}" criado` +
        (process.env.SEED_ADMIN_SENHA ? "." : " com a senha padrão — troque em produção.")
    );
  }

  // ---------- dados de demonstração (opcional) ----------
  if (process.env.SEED_DEMO === "1" && (await prisma.tecido.count()) === 0) {
    await prisma.tecido.createMany({
      data: [
        { nome: "Linho Rústico Areia", codigo: "LR-140", tipo: "linho", composicao: "100% linho", cor: "Areia", largura: 1.4, precoMetro: 32.9, encolhimentoPercent: 5, rapport: 0, estampado: false, fornecedor: "Tecelagem Sul", estoqueMetros: 45, estoqueMinimo: 20 },
        { nome: "Voil Liso Branco", codigo: "VL-280", tipo: "voil", composicao: "100% poliéster", cor: "Branco", largura: 2.8, precoMetro: 45.0, encolhimentoPercent: 1, rapport: 0, estampado: false, fornecedor: "Casa do Voil", estoqueMetros: 120, estoqueMinimo: 30 },
        { nome: "Jacquard Folhas", codigo: "JQ-280", tipo: "jacquard", composicao: "70% poliéster 30% viscose", cor: "Verde", largura: 2.8, precoMetro: 68.0, encolhimentoPercent: 3, rapport: 0.64, estampado: true, fornecedor: "Tecelagem Sul", estoqueMetros: 30, estoqueMinimo: 15 },
        { nome: "Algodão Listrado", codigo: "AL-150", tipo: "algodao", composicao: "100% algodão", cor: "Azul", largura: 1.5, precoMetro: 28.5, encolhimentoPercent: 8, rapport: 0, estampado: true, fornecedor: "Malharia Norte", estoqueMetros: 18, estoqueMinimo: 20 },
        { nome: "Blackout Corta-Luz", codigo: "BO-280", tipo: "blackout", composicao: "100% poliéster", cor: "Grafite", largura: 2.8, precoMetro: 52.0, encolhimentoPercent: 1, rapport: 0, estampado: false, fornecedor: "Casa do Voil", estoqueMetros: 60, estoqueMinimo: 25 },
      ],
    });
    await prisma.acessorio.createMany({
      data: [
        { nome: "Ilhós metálico 40mm cromado", tipo: "ilhos", unidade: "un", preco: 1.2, largura: 0, fornecedor: "Ferragens Lar", estoque: 800, estoqueMinimo: 200 },
        { nome: "Entretela 12cm", tipo: "entretela", unidade: "m", preco: 4.5, largura: 0.12, fornecedor: "Tecelagem Sul", estoque: 90, estoqueMinimo: 30 },
        { nome: "Forro Percal 2,80m", tipo: "forro", unidade: "m", preco: 18.0, largura: 2.8, fornecedor: "Casa do Voil", estoque: 70, estoqueMinimo: 20 },
        { nome: "Varão 28mm aço", tipo: "varao", unidade: "m", preco: 34.0, largura: 0, fornecedor: "Ferragens Lar", estoque: 40, estoqueMinimo: 10 },
        { nome: "Trilho suíço", tipo: "trilho", unidade: "m", preco: 29.0, largura: 0, fornecedor: "Ferragens Lar", estoque: 25, estoqueMinimo: 10 },
      ],
    });
    console.log("Dados de demonstração inseridos (5 tecidos, 5 acessórios).");
  }

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
