# Publicar na Hostinger (Node.js Web Apps)

> **Antes de tudo — o plano precisa suportar Node.js.**
> Só os planos **Business** e **Cloud** (Startup, Professional, Enterprise) rodam
> Node. Confira em hPanel → **Assinaturas**.
> Nos planos **Single** e **Premium** o Next.js não roda de jeito nenhum. Nesse
> caso: faça upgrade, publique na **Vercel** (gratuita, do próprio time do
> Next.js), ou publique a versão PHP em `../codgos site`, que roda em qualquer
> plano — mas não tem o site público de orçamento.

O banco é o **Supabase** (Postgres), não o MySQL da Hostinger. As tabelas já
existem e já têm os dados iniciais — **não há migração para rodar**.
Detalhes do projeto em [SUPABASE.md](SUPABASE.md).

---

## 1. Pegar a senha do banco

Painel do Supabase → **Project Settings → Database → Connection string → URI**.
Se não souber a senha, use **Reset database password** ali mesmo.

Copie a URI da porta **5432** (*session mode*). A **6543** (*transaction mode*)
não serve ao Prisma.

## 2. Criar o Web App

hPanel → **Websites → Adicionar site → Deploy Web App → GitHub**.

O repositório `enxovalcalduladora` é **privado**, então a Hostinger vai pedir
autorização à sua conta do GitHub. Escolha a branch `main`.

Ela detecta Next.js sozinha: build `npm run build`, start `npm start`. Se pedir
configuração manual, use **Node 22** e diretório de saída `.next`.

## 3. Variáveis de ambiente (no painel do Web App)

| Variável | Valor |
|---|---|
| `DATABASE_URL` | a URI do Supabase do passo 1 (porta 5432) |
| `AUTH_SECRET` | **um segredo novo** (veja abaixo) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fckybhfnzsvxchlyimwd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_rpE3hxvQvLiPhQ0TliRrOg_h7owK739` |

Gere o `AUTH_SECRET` com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Não reaproveite o `AUTH_SECRET` do `.env` local** — ele é de desenvolvimento
e já circulou fora do servidor.

Nada mais precisa ser configurado: o `postinstall` roda `prisma generate`, e o
provider do Prisma se ajusta sozinho ao ver `postgresql://` na `DATABASE_URL`.

## 4. Publicar e conferir o log

No log de build (hPanel → seu Web App → **Logs**) deve aparecer:

```
[prisma] provider ajustado de "sqlite" para "postgresql" (conforme DATABASE_URL)
```

Se **não** aparecer, a `DATABASE_URL` não chegou ao build: confirme que foi
salva no painel e refaça o deploy.

## 5. Antes de divulgar o endereço

1. **Trocar a senha do admin.** Ela nasce como `admin` / `enxoval123`, que está
   escrita neste repositório — ou seja, é pública. O comando está em
   [SUPABASE.md](SUPABASE.md).
2. **Cadastrar os tecidos reais.** O banco de produção está sem nenhum, de
   propósito: largura, preço e encolhimento são os dados que alimentam a
   calculadora e precisam ser os seus.

---

## Conferir que subiu certo

1. Abrir o endereço → cai em **/orcamento**, sem pedir login.
2. Abrir **/painel** deslogado → deve mandar para o login.
3. Enviar um pedido pelo formulário público → mensagem de sucesso com número.
4. Entrar no painel → o pedido aparece em Pendências, com o telefone clicável.
5. Cadastrar um tecido de 1,40 m a R$ 32,90 e rodar varão 3,00 × altura 2,50 em
   prega americana, encolhimento 5% → deve dar **19,20 m** e **R$ 631,68**,
   iguais aos 72 testes automatizados (`npm test`).
6. Apagar o pedido e o tecido de teste.

## Se aparecer "problema com a configuração do servidor"

```json
{"message":"Ocorreu um problema com a configuração do servidor..."}
```

É o Auth.js avisando que não conseguiu iniciar. Verifique nesta ordem:

1. **`DATABASE_URL` está definida e é a da porta 5432?**
2. **`AUTH_SECRET` está definida?** Sem ela o Auth.js recusa a iniciar.
3. **O provider bateu?** Procure a linha `[prisma] provider ajustado…` no log.
4. **A Hostinger está no commit mais recente?** Um deploy travado num commit
   antigo roda código velho — force o *Redeploy*.

## Referências

- Node.js na Hostinger: hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
