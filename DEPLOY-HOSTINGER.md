# Publicar na Hostinger (Node.js Web Apps)

A Hostinger roda aplicações Node.js **nos planos Business e Cloud** (Startup,
Professional, Enterprise). Os planos Single e Premium não têm Node — neles, a
alternativa é a versão PHP em `codgos site`, que existe exatamente para isso.
Node suportado: 18.x, 20.x, 22.x ou 24.x (use 22).

## 1. Criar o banco MySQL

A Hostinger só oferece MySQL nos planos de hospedagem (não há Postgres).

1. hPanel → **Bancos de dados → MySQL** → **Criar banco de dados**.
2. Anote: nome do banco, usuário, senha e **host** (aparece na lista, algo
   como `srvNNNN.hstgr.io` — não use `localhost`).

## 2. Preparar o projeto para MySQL

**Nada a fazer** — é automático. O build roda `scripts/prisma-provider-auto.mjs`,
que lê o `DATABASE_URL` e ajusta o provider do Prisma sozinho: `mysql://` vira
MySQL, `file:` vira SQLite. O schema serve aos dois bancos sem mudar nenhum tipo.

(Se precisar forçar à mão: `npm run db:mysql` / `npm run db:sqlite`.)

## 3. Criar o Web App no hPanel

1. hPanel → **Websites → Adicionar site → Deploy Web App**.
2. Escolha o método:
   - **GitHub** (recomendado): conecte o repositório; cada push publica.
   - **Upload ZIP**: compacte a pasta `next-app` **sem** `node_modules`,
     `.next`, `.env` e `prisma/dev.db`.
3. A Hostinger detecta Next.js sozinha (build `next build`, start `next start`).
   Se pedir configuração manual: diretório de saída `.next`, Node 22.

## 4. Variáveis de ambiente (no painel do Web App)

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `mysql://USUARIO:SENHA@HOST:3306/NOME_DO_BANCO` |
| `AUTH_SECRET` | um segredo novo — gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `SEED_ADMIN_SENHA` | a senha do admin de produção (NÃO use a de teste) |

O `postinstall` do projeto já roda `prisma generate` no build da Hostinger —
não precisa configurar nada para isso.

## 5. Criar as tabelas e o admin (uma vez só)

Pelo **SSH** do plano (hPanel → Avançado → SSH), dentro da pasta do app:

```bash
npx prisma db push          # cria as tabelas no MySQL
npx prisma db seed          # configurações padrão + 5 modelos + admin
```

Sem `SEED_DEMO=1`, o seed NÃO cria tecidos de demonstração — em produção você
cadastra os tecidos reais pela tela.

## 6. Conferir

- Abra o domínio → deve cair na tela de login.
- Entre com `admin` + a senha de `SEED_ADMIN_SENHA`.
- Rode um cálculo conhecido (varão 3,00 × altura 2,50, prega americana,
  tecido 1,40 m, encolhimento 5%, segurança 10% → **19,20 m**) e confira
  que bate com o sistema local.

## Se aparecer "problema com a configuração do servidor"

```json
{"message":"Ocorreu um problema com a configuração do servidor..."}
```

É o Auth.js dizendo que não conseguiu funcionar — quase sempre por causa do
banco. Verifique nesta ordem:

1. **As tabelas existem?** Se você ainda não rodou o passo 5 (`prisma db push`),
   o banco está vazio e toda consulta falha. **Esta é a causa mais comum.**
2. **`DATABASE_URL` está certa?** Precisa começar com `mysql://` e usar o
   **host da Hostinger** (`srvNNNN.hstgr.io`), nunca `localhost`. Teste pelo
   SSH: `npx prisma db pull` — se conectar, a URL está boa.
3. **`AUTH_SECRET` está definida?** Sem ela o Auth.js recusa a iniciar.
4. **O provider bateu?** No log de build deve aparecer
   `[prisma] provider ajustado de "sqlite" para "mysql"`. Se não apareceu, o
   `DATABASE_URL` não estava disponível durante o build — confirme que a
   variável está salva no painel do Web App e refaça o deploy.

Os registros ficam em hPanel → seu Web App → **Logs**.

## Referências

- Guia oficial: hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- MySQL + Node: hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/
