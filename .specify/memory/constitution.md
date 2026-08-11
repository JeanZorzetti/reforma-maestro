<!--
Sync Impact Report
- Version change: 1.0.0 → 2.0.0 (MAJOR — pivot de infoproduto estático para web app com backend)
- Modified principles:
  - I. Simplicity First (No Backend Creep) → I. Minimal Backend, Single Deploy (redefinido: backend agora permitido, mas restrito a Next.js API routes)
  - III. Next.js as the Canonical Stack → III. Single Codebase, Single Deploy (expandido para incluir API routes e Postgres)
  - V. Revenue-Path & Credential Safety → V. Credential & Customer Data Safety (reforçado: agora há dados financeiros de terceiros em banco)
- Added sections: IV. Subscription State is the Access Source of Truth; VI. Data Ownership & Portability
- Removed sections: IV. Manual Fulfillment is an Accepted Trade-off (obsoleto — fulfillment agora é provisionamento automático de conta)
- Follow-up TODOs:
  - TODO(SSL_ENFORCEMENT): conexão Postgres atual usa sslmode=disable sobre IP público; migrar para sslmode=require antes de dados reais de cliente.
  - TODO(BILLING_PROVIDER): definir se assinatura roda em Kiwify recorrente ou Stripe antes do /speckit-plan.
-->

# Reforma Maestro Constitution

## Core Principles

### I. Minimal Backend, Single Deploy
O produto agora exige backend (contas, dados persistidos, assinatura), mas
a complexidade MUST permanecer mínima: Next.js API routes (ou Server
Actions) contra Postgres, no mesmo deploy da Vercel. Serviços separados,
microsserviços, filas, cache distribuído e ORMs pesados exigem
justificativa explícita de necessidade real já observada — nunca
antecipada. YAGNI continua valendo; o que mudou foi o piso, não o teto.

### II. SEO & Content Integrity
Busca orgânica continua sendo o canal primário de aquisição. Estrutura de
SEO (sitemap, robots, linkagem interna conforme `regras_SEO.md`, blog,
`/sobre` para E-E-A-T) MUST ser preservada ou melhorada — a introdução do
app autenticado não pode degradar as rotas públicas indexadas. Structured
data (`schema-markup.tsx`) MUST refletir informação real e verificável;
reviews e ratings fabricados são proibidos independentemente do ganho de SEO.

### III. Single Codebase, Single Deploy
`frontend-next/` (Next.js 16 App Router, React 19, TypeScript, Tailwind +
shadcn/ui) é o único codebase ativo e passa a conter também a camada de
API e o acesso a Postgres. `frontend/` (protótipo legado Lovable/Vite)
MUST NOT receber features novas e deve ser removido nesta pivotada.

### IV. Subscription State is the Access Source of Truth
Acesso a qualquer funcionalidade paga MUST ser derivado do estado de
assinatura persistido no backend, verificado no servidor — nunca de estado
de cliente, localStorage ou flag em JWT sem revalidação. Assinatura
expirada, cancelada ou inadimplente MUST degradar o acesso de forma
previsível e documentada (o que o usuário ainda vê, o que perde, e por
quanto tempo os dados dele sobrevivem).

### V. Credential & Customer Data Safety
O sistema passa a guardar dados financeiros de terceiros (orçamentos,
gastos, fornecedores de obras reais). Segredos (connection strings, chaves
de billing, chaves de Service Account) MUST NEVER ser commitados — vivem em
`.env.local` e nas env vars da Vercel. Conexões de banco MUST usar TLS
(`sslmode=require`) em qualquer ambiente que trafegue dado real. Toda query
que lê dados de obra MUST ser escopada ao usuário autenticado no servidor;
isolamento por usuário é requisito de corretude, não de conveniência.

### VI. Data Ownership & Portability
O cliente é dono dos dados da obra dele. O app MUST oferecer exportação
legível (planilha/CSV) dos lançamentos a qualquer momento, inclusive após
cancelamento da assinatura, e MUST NOT reter dados indefinidamente sem
política declarada. Esse princípio preserva a promessa original do produto
(a planilha) e reduz o atrito de vender assinatura em vez de vitalício.

## Technology & Integration Constraints

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind, shadcn/ui,
API routes/Server Actions e Postgres, hospedado na Vercel. O banco Postgres
é auto-hospedado e acessado por connection string mantida fora do
versionamento. Integrações externas limitadas a: provedor de billing
recorrente (Kiwify recorrente ou Stripe — a definir), Google Analytics 4 e
Google Search Console. Não existe nem está planejada integração SINAPI;
menções de marketing a SINAPI são ilustrativas e MUST NOT sugerir
integração real de dados.

O produto anterior (planilha Google Sheets) e seus scripts de provisionamento
(`scripts/create-spreadsheet.ts`, `populate-spreadsheet.ts`) tornam-se legado
nesta pivotada; a Google Sheets API deixa de ser dependência de fulfillment e
só pode retornar como mecanismo de exportação (Princípio VI).

## Development Workflow

Features não triviais e mudanças estruturais seguem o fluxo Spec Kit
(`/speckit-specify` → `/speckit-clarify` → `/speckit-plan` →
`/speckit-tasks` → `/speckit-implement`). Testes automatizados deixam de ser
opcionais para código de backend: toda lógica de autenticação, escopo de
dados por usuário, cálculo financeiro e estado de assinatura MUST ter
cobertura de teste antes de ir a produção. Conteúdo e marketing seguem sem
exigência de teste. Antes de merge, verificar a mudança em dev server rodando
(`npm run dev` em `frontend-next/`) e, se afetar rotas públicas, confirmar
que sitemap e schema seguem válidos. Migrações de schema MUST ser versionadas
em arquivo e reversíveis.

## Governance

Esta constitution supersede prática ad-hoc neste repositório. Emendas exigem:
racional documentado, bump de versão semântico (MAJOR para remoção ou
redefinição incompatível de princípio, MINOR para princípio novo ou
materialmente expandido, PATCH para redação/clarificação) e Sync Impact
Report atualizado no topo deste arquivo. Todo `/speckit-plan` que proponha
trabalho conflitante com um Core Principle deve justificar o desvio
explicitamente na seção Complexity Tracking do plano ou ser revisado.

**Version**: 2.0.0 | **Ratified**: 2026-08-11 | **Last Amended**: 2026-08-11
