# Supabase — projeto `enxoval-cortinas`

Projeto criado no plano gratuito (US$ 0/mês), região **sa-east-1 (São Paulo)**.

| | |
|---|---|
| Ref do projeto | `pwvqyprgooemwaitnbov` |
| URL da API | `https://pwvqyprgooemwaitnbov.supabase.co` |
| Painel | https://supabase.com/dashboard/project/pwvqyprgooemwaitnbov |

## O que já está no banco

As 6 tabelas criadas (`AdminUsuario`, `Configuracao`, `Tecido`, `ModeloCortina`,
`Acessorio`, `Calculo`), mais os dados iniciais: 17 configurações, os 5 modelos
de cortina e o usuário `admin`.

**Não há tecidos nem acessórios** — esses são dados reais da loja e devem ser
cadastrados pela tela.

## Falta um passo: a senha do banco

A senha do Postgres só aparece no painel do Supabase — nem o assistente nem a
API a recuperam depois de criada.

1. Abra **Project Settings → Database → Connection string → URI**
   (se não souber a senha, use **Reset database password** ali mesmo).
2. Copie a URI da porta **5432** (*session mode*). O Prisma precisa de conexão
   direta; a 6543 (*transaction mode*) não serve para migrações.
3. Ponha no `.env` local ou nas variáveis do servidor:

```
DATABASE_URL="postgresql://postgres.pwvqyprgooemwaitnbov:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
```

O provider do Prisma se ajusta sozinho ao ver `postgresql://` — nada mais a
configurar.

## Segurança aplicada

- **RLS habilitado em todas as tabelas, sem nenhuma policy.** A aplicação usa
  Prisma por conexão direta (que não passa por RLS), então isso não a afeta —
  mas faz a API pública do Supabase **negar tudo**. Sem isso, a chave
  publishable, que é pública por natureza, daria acesso de leitura a preços,
  margens, dados de clientes e ao hash da senha do admin.
- Privilégios dos papéis `anon` e `authenticated` revogados no schema `public`,
  como defesa em profundidade.
- O aviso *"RLS Enabled No Policy"* no painel é **esperado e intencional**:
  significa exatamente "ninguém entra pela API pública".

## Trocar a senha do admin

O seed cria `admin` / `enxoval123` — pública, pois está escrita neste
repositório. Antes de divulgar o site:

```sql
-- no SQL Editor do Supabase, com um hash bcrypt gerado localmente:
--   node -e "console.log(require('bcryptjs').hashSync('SUA_SENHA_NOVA', 10))"
UPDATE "AdminUsuario" SET "senhaHash" = '<hash-gerado>' WHERE usuario = 'admin';
```
