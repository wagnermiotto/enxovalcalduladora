# Supabase — projeto `calculadoraenchoval`

| | |
|---|---|
| Ref do projeto | `fckybhfnzsvxchlyimwd` |
| URL da API | `https://fckybhfnzsvxchlyimwd.supabase.co` |
| Região | sa-east-1 (São Paulo) |
| Painel | https://supabase.com/dashboard/project/fckybhfnzsvxchlyimwd |

> **Existe um projeto duplicado.** `enxoval-cortinas` (`pwvqyprgooemwaitnbov`) foi
> criado por engano no mesmo instante que este e tem o mesmo conteúdo. O projeto
> em uso é o `calculadoraenchoval`; o outro pode ser apagado no painel.

## O que já está no banco

As 6 tabelas (`AdminUsuario`, `Configuracao`, `Tecido`, `ModeloCortina`,
`Acessorio`, `Calculo`), as 17 configurações padrão, os 5 modelos de cortina e
o usuário `admin`.

**Não há tecidos nem acessórios** — são dados reais da loja, cadastrados pela tela.

## Falta a senha do banco (para o Prisma)

As variáveis `NEXT_PUBLIC_*` já estão no `.env`, mas elas servem à API pública.
Quem lê e grava os dados é o **Prisma**, e ele precisa da senha do Postgres —
que só aparece no painel.

1. **Project Settings → Database → Connection string → URI**
   (se não souber a senha: **Reset database password**).
2. Copie a da porta **5432** (*session mode*). A 6543 (*transaction mode*) não
   serve para migrações.
3. No `.env`, troque a linha do `DATABASE_URL`:

```
DATABASE_URL="postgresql://postgres.fckybhfnzsvxchlyimwd:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
```

O provider do Prisma se ajusta sozinho ao ver `postgresql://`.

## Por que a API pública nega tudo

RLS está habilitado em todas as tabelas **sem nenhuma policy**, e os papéis
`anon`/`authenticated` tiveram os privilégios revogados.

Isso é intencional. A `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` vai para o
navegador de qualquer visitante — tudo que ela alcança é, na prática, público.
Sem RLS, ela daria acesso de leitura a preço de custo dos tecidos, margem de
lucro, dados de clientes e ao hash da senha do admin.

O formulário público de orçamento funciona por **Server Action + Prisma**, no
servidor, onde essas regras não atrapalham e nada sensível chega ao cliente.

O aviso *"RLS Enabled No Policy"* no painel é esperado.

### Se um dia precisar de acesso direto do navegador

Cada caso pede uma policy de escopo mínimo. Exemplo, para deixar qualquer
visitante enviar um pedido pela API (o que hoje já acontece via Server Action):

```sql
CREATE POLICY "visitante pode enviar pedido" ON "Calculo"
  FOR INSERT TO anon WITH CHECK (true);
GRANT INSERT ON "Calculo" TO anon;
```

**Nunca** libere `SELECT` em `Tecido` para `anon`: a tabela tem `precoMetro`,
que é o custo da loja. Se precisar expor o catálogo, crie uma view só com as
colunas neutras (`WITH (security_invoker = true)`).

## Trocar a senha do admin

O seed cria `admin` / `enxoval123` — pública, pois está escrita neste
repositório. Antes de divulgar o site:

```sql
-- SQL Editor do Supabase, com um hash gerado localmente:
--   node -e "console.log(require('bcryptjs').hashSync('SUA_SENHA_NOVA', 10))"
UPDATE "AdminUsuario" SET "senhaHash" = '<hash-gerado>' WHERE usuario = 'admin';
```
