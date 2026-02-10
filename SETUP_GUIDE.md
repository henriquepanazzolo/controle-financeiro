# 🚀 Guia de Configuração — FinancePro (Controle Financeiro)

Guia completo para configurar e rodar o app em um novo computador.

---

## 📋 Pré-requisitos

| Ferramenta | Versão Mínima | Download |
|------------|---------------|----------|
| **Node.js** | 18.x (recomendado 20+) | [nodejs.org](https://nodejs.org/) |
| **npm** | 9+ (vem com Node.js) | — |
| **Git** | Qualquer versão atual | [git-scm.com](https://git-scm.com/) |

> [!TIP]
> Para verificar se já estão instalados, abra o PowerShell e rode:
> ```powershell
> node -v
> npm -v
> git --version
> ```

---

## 1️⃣ Clonar o Repositório

Se o projeto está no GitHub:
```powershell
git clone <URL_DO_SEU_REPOSITORIO> controle-financeiro
cd controle-financeiro
```

Se o projeto está apenas no outro computador (sem GitHub), copie a pasta inteira **exceto** `node_modules` e `.next` para o novo PC via pendrive, OneDrive, etc.

---

## 2️⃣ Instalar Dependências

```powershell
npm install
```

Isso instala todas as dependências (Next.js 16, Prisma 7, NextAuth, etc.).

---

## 3️⃣ Configurar o Banco de Dados PostgreSQL

O app usa **PostgreSQL**. Você tem duas opções:

### Opção A: Banco de Dados na Nuvem (Recomendado — mais fácil)

Use um dos serviços gratuitos:

| Serviço | Plano Gratuito | Link |
|---------|---------------|------|
| **Neon** | 0.5 GB grátis | [neon.tech](https://neon.tech/) |
| **Supabase** | 500 MB grátis | [supabase.com](https://supabase.com/) |
| **Railway** | Trial gratuito | [railway.app](https://railway.app/) |

**Passo a passo com Neon (exemplo):**

1. Acesse [neon.tech](https://neon.tech/) e crie uma conta (pode usar GitHub/Google)
2. Clique em **"Create Project"**
3. Dê um nome (ex: `financepro`) e selecione a região mais próxima
4. Após criar, copie a **Connection String** que aparece — ela tem este formato:
   ```
   postgresql://usuario:senha@host.neon.tech/nome_do_banco?sslmode=require
   ```
5. Guarde essa string, você vai usar no passo 4

### Opção B: PostgreSQL Local (para quem já tem instalado)

Se preferir instalar localmente:

1. Baixe e instale o [PostgreSQL](https://www.postgresql.org/download/windows/)
2. Durante a instalação, anote a **senha do superusuário** (postgres)
3. Abra o **pgAdmin** ou o terminal `psql` e crie um banco:
   ```sql
   CREATE DATABASE financepro;
   ```
4. Sua connection string será:
   ```
   postgresql://postgres:SUA_SENHA@localhost:5432/financepro
   ```

---

## 4️⃣ Criar o Arquivo `.env.local`

> [!IMPORTANT]
> Este é o passo mais importante! O arquivo `.env.local` contém os segredos do app e **não é salvo no Git** (está no `.gitignore`). Por isso você precisa criá-lo manualmente.

Na **raiz do projeto**, crie o arquivo `.env.local`:

```powershell
# No PowerShell, na pasta do projeto:
New-Item -Path ".env.local" -ItemType File
```

Abra o arquivo e cole o seguinte conteúdo:

```env
# ==============================================
# 🔐 VARIÁVEIS DE AMBIENTE — FinancePro
# ==============================================

# --- Banco de Dados ---
# Cole aqui a connection string do seu PostgreSQL (Neon, Supabase, ou local)
DATABASE_URL="postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO?sslmode=require"

# --- Autenticação (NextAuth.js) ---
# Gere um segredo aleatório com o comando abaixo:
#   npx auth secret
# Ou use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_SECRET="COLE_AQUI_O_SEGREDO_GERADO"

# URL base do app (deixe assim para desenvolvimento local)
AUTH_URL="http://localhost:3000"
```

### Como gerar o `AUTH_SECRET`

Execute no PowerShell:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e cole no lugar de `COLE_AQUI_O_SEGREDO_GERADO`.

> [!CAUTION]
> Nunca compartilhe o conteúdo do `.env.local` publicamente! Ele contém credenciais sensíveis.

---

## 5️⃣ Buscar os Dados do Outro Computador

### O que você precisa copiar do outro PC:

| Dado | Onde Encontrar | Para Que Serve |
|------|----------------|----------------|
| `DATABASE_URL` | Arquivo `.env.local` do outro PC | Conexão com o banco de dados |
| `AUTH_SECRET` | Arquivo `.env.local` do outro PC | Criptografia das sessões |

**Como encontrar no outro computador:**

1. Abra a pasta do projeto no outro PC
2. Procure o arquivo `.env.local` (pode estar oculto!)
   - No Windows Explorer: Exibir → Itens ocultos ✅
   - Ou no PowerShell: `Get-Content .env.local`
3. Copie os valores de `DATABASE_URL` e `AUTH_SECRET`
4. Cole no `.env.local` do novo computador

> [!WARNING]
> Se você usar a **mesma** `DATABASE_URL`, ambos os computadores compartilharão o mesmo banco de dados (ideal para banco na nuvem). Se criar um banco novo, você terá dados separados.

---

## 6️⃣ Configurar o Banco de Dados (Prisma)

### a) Gerar o Prisma Client

```powershell
npx prisma generate
```

### b) Aplicar as Migrations (criar as tabelas)

```powershell
npx prisma migrate deploy
```

> [!NOTE]
> Use `migrate deploy` se o banco já foi inicializado antes (ex: mesmo banco do outro PC).
> Use `migrate dev` se é um banco completamente novo:
> ```powershell
> npx prisma migrate dev
> ```

### c) Popular o Banco (Seed) — Apenas para Banco Novo

Se você criou um banco novo (sem dados), rode o seed:

```powershell
npx tsx prisma/seed.ts
```

Isso cria:
- 👤 Usuário admin: `admin@financepro.app` / senha: `Admin@2026`
- 🎟️ Código de convite: `FINANCE2026`
- 📁 Categorias padrão (Alimentação, Transporte, Saúde, etc.)

---

## 7️⃣ Rodar o App

```powershell
npm run dev
```

Acesse: **[http://localhost:3000](http://localhost:3000)**

### Credenciais de Login Iniciais

| Campo | Valor |
|-------|-------|
| Email | `admin@financepro.app` |
| Senha | `Admin@2026` |

Para registrar novos usuários, use o código de convite: **`FINANCE2026`**

---

## 🔧 Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Compila para produção |
| `npm start` | Roda a versão compilada |
| `npx prisma studio` | Interface visual para ver/editar dados no banco |
| `npx prisma migrate dev` | Cria/aplica novas migrations |
| `npx prisma generate` | Regenera o Prisma Client |
| `npx tsx prisma/seed.ts` | Popula o banco com dados iniciais |

---

## ❓ Solução de Problemas

### "next não é reconhecido como comando"
```powershell
npm install
```

### "DATABASE_URL is not set"
Verifique se criou o `.env.local` na raiz do projeto com a `DATABASE_URL` preenchida.

### "AUTH_SECRET is required"
Adicione o `AUTH_SECRET` no `.env.local`. Veja o passo 4.

### Erro de conexão com o banco
- Verifique se a `DATABASE_URL` está correta
- Se for banco na nuvem, verifique se tem `?sslmode=require` no final
- Se for local, verifique se o PostgreSQL está rodando

### Erro "Can't reach database server"
- Banco na nuvem: verifique sua conexão de internet
- Banco local: rode `pg_isready` para verificar se o PostgreSQL está ativo

### Prisma Client desatualizado
```powershell
npx prisma generate
```

---

## 📁 Estrutura do Projeto

```
controle-financeiro/
├── .env.local          ← ⚠️ CRIAR MANUALMENTE (não vai no Git)
├── prisma/
│   ├── schema.prisma   ← Definição do banco de dados
│   ├── seed.ts         ← Script para popular o banco
│   └── migrations/     ← Histórico de alterações do banco
├── src/
│   ├── app/            ← Páginas e rotas (Next.js App Router)
│   ├── components/     ← Componentes React
│   ├── lib/            ← Configurações (auth, prisma, config)
│   └── actions/        ← Server Actions
├── package.json        ← Dependências e scripts
└── next.config.ts      ← Configuração do Next.js
```

---

## ✅ Checklist Rápido

- [ ] Node.js instalado (18+)
- [ ] `npm install` executado
- [ ] `.env.local` criado com `DATABASE_URL` e `AUTH_SECRET`
- [ ] `npx prisma generate` executado
- [ ] `npx prisma migrate deploy` (ou `dev`) executado
- [ ] `npx tsx prisma/seed.ts` executado (se banco novo)
- [ ] `npm run dev` rodando
- [ ] Acessou `http://localhost:3000` com sucesso
