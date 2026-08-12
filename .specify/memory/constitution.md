<!--
Sync Impact Report
- Version change: 3.0.0 → 3.1.0 (MINOR — nova integração externa permitida e expansão do Princípio V)
- Modified principles:
  - V. Credential & Customer Data Safety: expandido para cobrir telemetria. Com a entrada de um
    serviço externo de captura de erro (spec 002-melhorias-v11, FR-001), stack trace e contexto de
    erro passam a sair do perímetro do produto; a proibição de vazar segredo e dado financeiro do
    cliente agora vale explicitamente para o que é enviado a esse serviço.
- Modified sections:
  - Technology & Integration Constraints: provedor de billing deixa de ser "a definir" e passa a
    ser Stripe (assinatura recorrente já ativa em produção); Resend passa a constar como provedor
    de e-mail transacional já integrado; serviço de captura de erro de servidor passa a ser
    integração permitida — era o bloqueio declarado em `specs/002-melhorias-v11/spec.md`.
- PATCH 3.1.1 (2026-08-12): o plano da 002 resolveu a captura de erro com capacidade nativa
  (`onRequestError` + tabela `incidents` + Resend), sem adotar serviço externo. A permissão
  permanece registrada como caminho de upgrade já autorizado, agora marcada como não adotada,
  para que a lista de integrações descreva o sistema real e não uma intenção.
- Added sections: nenhuma
- Removed sections: nenhuma
- Deferred: FR-032 (verificação automática do funil pago a cada publicação) fica como requisito da
  spec 002, não como regra de governança; promover a Development Workflow só depois de existir e
  se mostrar estável.
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
`.env.local` e nas env vars da Vercel. A conexão de banco roda sem TLS
(`sslmode=disable`), mesmo padrão usado nos demais projetos hospedados no
mesmo host — o host não isola namespace de IPC entre containers Postgres, e
uma tentativa de habilitar TLS colidiu com outro banco de produção ativo.
Risco aceito conscientemente; não reabrir sem resolver o isolamento de IPC
no host primeiro. Toda query que lê dados de obra MUST ser escopada ao
usuário autenticado no servidor; isolamento por usuário é requisito de
corretude, não de conveniência. A mesma proibição vale para telemetria: log,
alerta e evento enviado a serviço externo de captura de erro MUST NOT conter
senha, hash de senha, token, chave de API, dado de cartão ou valor financeiro
de obra de cliente — identificador de usuário e rota são suficientes para
diagnóstico.

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
versionamento. Integrações externas limitadas a: Stripe (assinatura recorrente,
já em produção), Resend (e-mail transacional), Google Analytics 4 e Google Search
Console. Serviço gerenciado de captura de erro de servidor é **permitido mas não
adotado** — a captura roda in-house (`onRequestError` nativo do Next + tabela
`incidents`), e trocar por serviço externo não exige nova emenda, apenas registro
da decisão no plano correspondente. Qualquer integração fora dessa lista exige
emenda desta seção antes de entrar no código. Observabilidade, in-house ou
externa, MUST ser configurável por env var e MUST degradar sem derrubar
requisição quando indisponível — nunca pode virar ponto único de falha do
produto. Não existe nem está planejada integração SINAPI;
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

**Version**: 3.1.1 | **Ratified**: 2026-08-11 | **Last Amended**: 2026-08-12
