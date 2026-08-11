# Research: Web App de Controle Financeiro de Obras

**Feature**: `001-web-app-obras` | **Date**: 2026-08-11 | **Fase**: 0

Resolve as incógnitas do Technical Context de `plan.md`. Cada item segue o
formato Decisão / Racional / Alternativas rejeitadas.

---

## R1. Provedor de cobrança recorrente

**Decisão**: Stripe (Checkout Session em modo `subscription` + Customer Portal +
webhooks). Resolve `TODO(BILLING_PROVIDER)` da constitution v2.0.0.

**Racional**:
- FR-024 (consultar estado e cancelar sem suporte) é atendido pelo Customer
  Portal hospedado — zero UI e zero endpoint nosso de cancelamento.
- FR-020 (eventos duplicados / fora de ordem) depende de `event.id` estável e
  assinatura verificável (`Stripe-Signature` + `constructEvent`). A Kiwify não
  oferece garantia equivalente documentada.
- FR-018 (liberação automática) é o caminho padrão: `checkout.session.completed`
  + `customer.subscription.*`.
- FR-021 (acesso até o fim do período pago no cancelamento) já vem modelado em
  `cancel_at_period_end` + `current_period_end`.
- FR-023 (avisar sobre falha de pagamento) usa `invoice.payment_failed` e as
  dunning emails do próprio Stripe como reforço.

**Alternativas rejeitadas**:
- *Kiwify recorrente*: mantém o provedor atual, mas cancelamento self-service,
  portal de assinatura e garantias de webhook viram código nosso — mais
  superfície para testar num requisito de corretude (SC-010: zero incidentes).
- *Abstração multi-provedor*: interface com uma implementação. YAGNI, e a
  constitution (Princípio I) exige necessidade real observada.

---

## R2. Trial de 14 dias sem cartão

**Decisão**: trial gerenciado **no nosso banco**, não no Stripe. A conta nasce
com `subscriptions.status = 'trialing'` e `access_until = now() + 14 dias`.
Nenhum objeto Stripe existe antes da primeira assinatura.

**Racional**: `trial_period_days` do Stripe exige uma Subscription, e criar
Subscription exige Customer com método de pagamento coletado (ou um fluxo
`SetupIntent`). FR-025 proíbe pedir cartão no cadastro. Um `timestamptz` na
nossa tabela custa uma coluna e atende FR-025, FR-025a e FR-025b integralmente.

**Assinar antes de o trial acabar** (edge case do spec: os dias restantes não
podem ser perdidos nem duplicados). A Checkout Session é criada com
`subscription_data.trial_end = subscriptions.access_until` sempre que o status
for `trialing`. O Stripe passa a cobrar só quando o trial termina, e o
`current_period_end` do primeiro período já vem contado a partir dali — os dias
restantes seguem valendo e não são somados duas vezes. Sem isso, quem assinasse
no dia 4 de 14 perderia 10 dias pagos do próprio bolso.

Consequência: a transição `trialing → active` **nunca reduz** `access_until`.

**Alternativas rejeitadas**:
- *Stripe trial nativo desde o cadastro*: obrigaria coletar cartão no cadastro
  (viola FR-025) ou criar Customer órfão para toda conta criada. Usar `trial_end`
  **no momento do checkout** é diferente — aí o cartão já está sendo coletado.
- *Creditar os dias restantes como desconto na primeira fatura*: mesma intenção,
  mais aritmética nossa e um cupom a gerar por assinatura.

---

## R3. Trial único por conta (FR-025c / SC-012)

**Decisão**: tabela `trial_grants` com PK = hash SHA-256 do e-mail normalizado
(lowercase + trim). A linha é gravada na criação da conta e **sobrevive à
exclusão do usuário**. Se o hash já existe, a nova conta nasce em `expired`
(acesso reduzido), não em `trialing`.

**Racional**: cobre o edge case "exclui a conta e cria outra com o mesmo e-mail".
Guardar o hash, não o e-mail, mantém o registro compatível com o direito de
exclusão de dados pessoais da LGPD (FR-028) — o resíduo não é identificável
sozinho.

**Alternativas rejeitadas**:
- *Soft delete do usuário*: retém dado pessoal de quem pediu exclusão.
- *Fingerprint de dispositivo/IP*: invasivo, contornável e sem valor proporcional.

---

## R4. Estados de acesso e degradação (FR-019, FR-021, FR-022, FR-025b)

**Decisão**: uma única função servidora `getAccess(userId)` que lê a assinatura
persistida e retorna `{ tier: 'full' | 'readonly', status, accessUntil }`.
Mapa de estados:

| `status`     | Origem                                    | `access_until` | Tier enquanto `now() <= access_until` | Tier depois |
|--------------|-------------------------------------------|----------------|----------------------------------------|-------------|
| `trialing`   | criação da conta                          | +14 dias       | `full`                                 | `readonly`  |
| `active`     | `customer.subscription.created/updated`   | fim do período | `full`                                 | `readonly`  |
| `canceled`   | `cancel_at_period_end = true`             | fim do período | `full`                                 | `readonly`  |
| `past_due`   | `invoice.payment_failed`                  | fim do período | `full` (tolerância do Stripe)          | `readonly`  |
| `expired`    | `customer.subscription.deleted` / trial fim| passado        | —                                      | `readonly`  |

`readonly` = leitura de obras e lançamentos + exportação (FR-022, FR-027);
bloqueia criar/editar/excluir obra e lançamento.

**Racional**: uma tabela-verdade fecha SC-010 e o edge case "trial expira com o
app aberto" — a expiração é comparação de timestamp a cada requisição, não um
job agendado que pode atrasar. Sem cron, sem worker (Princípio I).

**Alternativas rejeitadas**:
- *Flag booleana `is_paid`*: perde a distinção entre cancelado-com-acesso e
  encerrado, exigida por FR-021.
- *Job noturno que marca contas expiradas*: adiciona agendador e uma janela em
  que o estado no banco está errado.

**Ponto de aplicação**: a checagem vive na camada de dados (helpers
`requireFullAccess()` / `requireUser()`), não em componentes. Estado do cliente
nunca participa da decisão (FR-019, Princípio IV).

---

## R5. Idempotência e ordenação de webhooks (FR-020)

**Decisão**: duas defesas combinadas.
1. **Idempotência**: `INSERT INTO stripe_events (id) VALUES ($1) ON CONFLICT DO
   NOTHING` no início do handler. Zero linhas afetadas ⇒ evento já processado,
   responde `200` e encerra.
2. **Ordenação**: a escrita em `subscriptions` só aplica o evento se
   `event.created >= subscriptions.last_event_at`. Evento antigo é registrado e
   descartado.

Handler responde `200` para evento conhecido-e-ignorado e `4xx` só para
assinatura inválida — Stripe reenvia em qualquer outra resposta.

**Racional**: cobre "notificação chega duplicada ou fora de ordem" sem fila nem
lock distribuído. O `ON CONFLICT` é o lock, e o Postgres já o dá de graça.

**Alternativas rejeitadas**:
- *Fila (SQS/QStash) para serializar eventos*: infra nova, proibida sem
  necessidade observada (Princípio I).

---

## R6. Pagamento confirmado para e-mail sem conta (edge case)

**Decisão**: o Checkout Session é sempre iniciado **a partir de uma sessão
autenticada**, com `client_reference_id = user.id` e `customer_email` pré-
preenchido. Se mesmo assim chegar um evento sem `client_reference_id` resolvível,
o handler grava o evento em `stripe_events` com `unmatched = true`, registra em
`audit_log` e responde `200` — sem criar conta fantasma.

**Racional**: vincular por `user.id` em vez de e-mail elimina a ambiguidade de
alguém pagar com um e-mail diferente do cadastro. Casos órfãos ficam auditáveis
(FR-030) e resolvíveis à mão, que é a frequência esperada: rara.

**Alternativas rejeitadas**:
- *Provisionar conta a partir do e-mail do pagamento*: cria conta sem senha e
  sem consentimento, e abre caminho para vincular pagamento à conta errada.

---

## R7. Autenticação

**Decisão**: Auth.js v5 (`next-auth@5`) com Credentials provider, hash de senha
`bcrypt` (custo 12), sessão em cookie httpOnly com estratégia **database**
(tabela `sessions`), adapter Drizzle sobre o mesmo Postgres.

**Racional**: sessão em banco permite invalidar sessão no logout e expirar por
inatividade de verdade (FR-003) — um JWT stateless não revoga. O adapter Drizzle
reaproveita a mesma conexão e as mesmas migrações (Princípio I e III).
Reset de senha (FR-002) usa a tabela `verification_tokens` que o adapter já cria.

**Alternativas rejeitadas**:
- *Auth caseiro*: ~150 linhas iniciais, mas reset de senha, rotação de sessão e
  proteção de CSRF passam a ser código nosso, num caminho onde erro é falha de
  segurança.
- *Clerk / Supabase Auth*: serviço externo fora da lista da constitution e um
  segundo lugar onde o usuário existe.

---

## R8. Envio de e-mail (FR-002, FR-023, FR-025a)

**Decisão**: Resend com um helper `sendEmail()` de uma função. Três templates:
reset de senha, trial expirando (D-3 e D-1), falha de pagamento.

**Racional**: reset de senha é obrigatório (FR-002) e exige entrega
transacional; SMTP próprio na Vercel não é opção. Resend tem free tier
suficiente e SDK de uma chamada.

**Disparo dos avisos de trial**: Vercel Cron diário (`vercel.json`) batendo em
`/api/cron/trial-warnings`, protegido por `CRON_SECRET`. É o único agendamento
do sistema; os avisos de falha de pagamento saem do webhook, não do cron.

**Alternativas rejeitadas**:
- *Só o banner in-app para avisar do trial*: FR-025a pede aviso antecipado, e
  quem não abre o app não é avisado.
- *Fila de e-mails com retry*: YAGNI no volume desta fase.

---

## R9. Acesso a Postgres e migrações

**Decisão**: `drizzle-orm` + `drizzle-kit`, driver `postgres.js`, schema único em
`src/db/schema.ts`, migrações SQL versionadas em `src/db/migrations/` geradas por
`drizzle-kit generate` e aplicadas por `drizzle-kit migrate`.

**Racional**: a constitution exige migrações versionadas em arquivo e reversíveis
(Development Workflow) e desencoraja ORM pesado. Drizzle gera SQL legível em
arquivo, não tem engine em runtime (importa no bundle serverless sem binário) e
tipa as queries a partir do schema — o que remove mapeamento manual em cada
consulta de dinheiro.

**Reversibilidade**: cada migração gerada ganha um `NNNN_nome.down.sql` escrito à
mão junto do commit.

**Alternativas rejeitadas**:
- *`pg` + SQL puro*: menos uma dependência, mas tipagem e mapeamento manuais em
  todas as queries financeiras — mais código onde erro custa caro.
- *Prisma*: é o "ORM pesado" que a constitution manda justificar; engine extra no
  bundle serverless sem ganho aqui.

---

## R10. Representação de dinheiro

**Decisão**: **inteiros em centavos** (`integer` no Postgres, `number` em TS).
Nenhum `float`, nenhum `numeric` para valores monetários. Formatação só na borda
de apresentação, via `Intl.NumberFormat('pt-BR', { style: 'currency', currency:
'BRL' })`. Percentual de fundo de reserva é `numeric(5,2)` (0.00–100.00).

**Racional**: soma de centenas de lançamentos em ponto flutuante acumula erro
visível em reais; `numeric` evita o erro mas atravessa o driver como string e
convida a `parseFloat` espalhado. Inteiro é exato e trivial de testar.

**Arredondamento**: o único cálculo não inteiro é o fundo de reserva
(`round(orcamento_teto_cents * reserva_pct / 100)`), arredondado meio-para-cima
uma única vez, em uma função pura testada.

---

## R11. Exportação para planilha (FR-026, FR-027, US3-3)

**Decisão**: CSV gerado no servidor em Route Handler, com **BOM UTF-8**
(`﻿`), separador `;` e decimal com vírgula; datas em `dd/MM/yyyy`. Header
`Content-Disposition: attachment`.

**Racional**: é o formato que o Excel em locale pt-BR abre com acentuação e
colunas corretas sem passo de importação — exatamente o cenário de aceitação
US3-3. Zero dependência: `Array.join` resolve. XLSX exigiria uma lib e não
entrega nada a mais aqui.

**Escopo de acesso**: a rota exige usuário autenticado e obra do próprio usuário,
mas **não** exige tier `full` (FR-027).

**Alternativas rejeitadas**:
- *XLSX via `exceljs`/`sheetjs`*: dependência pesada para o mesmo resultado.
- *Google Sheets API como exportador*: a constitution permite, mas reintroduz
  Service Account e um serviço externo por um CSV.

---

## R12. Desempenho do painel com 500 lançamentos (SC-009)

**Decisão**: agregações calculadas **em SQL** (`SUM(...) ... GROUP BY categoria`)
em Server Component, não no cliente. Índices: `(obra_id, data DESC)` para a
listagem e `(obra_id, categoria)` para a quebra por categoria. Listagem paginada
em 50 por página com filtros de categoria e status aplicados no `WHERE`.

**Racional**: 500 linhas cabem em memória, mas mandar tudo ao navegador para
somar desperdiça payload e trava celular — e o uso majoritário é celular na obra.
Duas queries agregadas respondem em poucos milissegundos com os índices acima.

**Alternativas rejeitadas**:
- *Totais materializados em colunas da obra*: cria invalidação a manter em toda
  edição/exclusão (FR-011) — bug caro por ganho invisível nessa escala.
- *Cache/Redis*: infra nova, proibida sem necessidade observada.

---

## R13. Concorrência entre abas (edge case)

**Decisão**: sem locking otimista nesta versão. Última escrita vence, e os totais
são sempre recalculados do banco na leitura seguinte (nunca incrementais).

**Racional**: o app é de uso individual e assumido single-user (Assumptions do
spec). Como nenhum total é derivado incrementalmente, duas abas editando
lançamentos **diferentes** — o cenário descrito — não corrompem indicador algum.
O pior caso real é reeditar o mesmo lançamento em duas abas e perder um texto.

Marcado como `ponytail:` no código; adicionar `version` + checagem otimista se
surgir relato real.

---

## R14. Segmentação de rotas e SEO (FR-031, FR-032, FR-033)

**Decisão**: route groups do App Router — `(public)` para home/blog/sobre
(URLs **inalteradas**, pois route groups não entram no path) e `(app)` para a
área autenticada sob o prefixo `/app`. `middleware.ts` protege `/app/*`.
`robots.ts` ganha `disallow: ['/app', '/entrar', '/cadastrar', '/api']`; o
`layout.tsx` de `(app)` declara `robots: { index: false, follow: false }`.

**Racional**: nenhuma URL pública muda ⇒ FR-032 não gera redirect algum e o
risco de SC-008 cai a zero para as páginas existentes. A dupla barreira
(robots.txt + meta noindex) cobre FR-033 mesmo se alguém linkar uma rota interna.

**Página de vendas (FR-034)**: `Pricing.tsx` troca o link direto da Kiwify por um
CTA de cadastro/trial; a cópia passa a descrever app e assinatura. Nenhuma URL
nova, nenhum redirect necessário.

---

## R15. Remoção do legado (FR-035)

**Decisão**: excluir `frontend/` (protótipo Lovable) e
`frontend-next/scripts/{create-spreadsheet,populate-spreadsheet,test-sheets,diagnose-permissions}.ts`,
e remover as dependências `googleapis` e `google-auth-library` do
`package.json`. Executado como último passo da migração, em commit próprio.

**Racional**: a constitution (Princípio III) já declara `frontend/` morto, e
R11 decidiu que a exportação não usa Google Sheets — os scripts perdem a única
razão de existir. Dependência não usada é superfície de auditoria e peso de
instalação.

---

## R16. Testes

**Decisão**: Vitest. Duas camadas, só onde a constitution exige:
- **Unitário (sem banco)**: funções puras de cálculo financeiro (totais, saldo,
  fundo de reserva, percentual consumido, status derivado do lançamento),
  formatação/serialização do CSV e a tabela-verdade de `getAccess()` (R4).
- **Integração (banco de teste)**: escopo de dados por usuário (FR-029, SC-006),
  fluxo de webhook incluindo duplicata e evento fora de ordem (FR-020), e trial
  não-renovável (FR-025c).

Banco de teste: um Postgres local/descartável apontado por `DATABASE_URL_TEST`,
com as mesmas migrações aplicadas antes da suíte.

**Racional**: é literalmente o recorte da constitution — "autenticação, escopo de
dados por usuário, cálculo financeiro e estado de assinatura". Conteúdo e
marketing seguem sem teste. Sem E2E nesta fase: custo de manutenção alto e os
cenários críticos já ficam cobertos na camada de integração.

---

## R17. TLS na conexão de banco

**Decisão**: `sslmode=require` na `DATABASE_URL` de todo ambiente que trafegue
dado real, aplicado **antes** do primeiro cadastro de usuário real. Resolve o
`TODO(SSL_ENFORCEMENT)` da constitution.

**Racional**: Princípio V é explícito e agora passam a trafegar orçamentos e
fornecedores de obras reais. É mudança de connection string, não de código.

**Risco a validar em implementação**: o Postgres auto-hospedado precisa ter TLS
habilitado e certificado aceitável. Se o certificado for self-signed, a opção é
`sslmode=verify-full` com CA própria distribuída via env var — nunca
`sslmode=disable` nem `rejectUnauthorized: false`.

---

## Incógnitas remanescentes

Nenhuma. Todo `NEEDS CLARIFICATION` do Technical Context foi resolvido acima.
