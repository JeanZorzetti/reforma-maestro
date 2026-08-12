# Research: Endurecimento, Conversão e Profundidade do App de Obras

**Feature**: `002-melhorias-v11` | **Fase**: 0 | **Data**: 2026-08-12

A spec deixou uma única incógnita declarada (`Dependencies`: serviço de captura
de erro de servidor). As demais decisões abaixo não eram `NEEDS CLARIFICATION`
formais, mas escolhiam entre caminhos com custo de dependência diferente — ficam
registradas porque `tasks.md` depende delas.

---

## R1 — Captura de erro de servidor (FR-001)

**Decisão**: `src/instrumentation.ts` exportando `onRequestError`, hook nativo do
Next.js 16, gravando na tabela `incidents` do Postgres. Nenhum serviço externo.

**Rationale**: o hook já recebe exatamente o que FR-001 pede — erro, rota e
contexto da requisição — para Server Components, Route Handlers e Server Actions,
sem instrumentação manual em cada arquivo. FR-002, FR-003 e FR-004 exigem lógica
própria de qualquer forma (falha de webhook e rotina agendada não são exceções
lançadas que um SDK capturaria sozinho, e o agrupamento é regra de negócio). Com
o hook nativo, o custo marginal de guardar o resto no mesmo lugar é uma tabela.

**Alternativas consideradas**:

- **Sentry (`@sentry/nextjs`)** — daria stack trace com source map, agrupamento e
  alerta prontos no free tier. Rejeitado por três motivos somados: é a única
  dependência externa nova de toda a spec e exigiria emenda da constitution para
  entrar; manda contexto de erro de dado financeiro de cliente para fora do
  perímetro, obrigando um `beforeSend` de scrub que vira ponto de falha silencioso
  de conformidade (Princípio V); e não resolve FR-002/003/004, que continuariam
  sendo código próprio. Fica permitido pela constitution v3.1.0 se a tabela
  `incidents` se mostrar insuficiente — o caminho de volta está aberto e custa
  pouco, já que `recordIncident()` é um ponto único de chamada.
- **Log drain da Vercel** — barato, mas é armazenamento passivo: não notifica, não
  agrupa e não sobrevive à retenção do plano. Não atende SC-001.

**Ceiling conhecido**: sem source map, o stack trace guardado aponta para o
bundle. Suficiente para localizar a rota e o tipo do erro, não para apontar a
linha do fonte. Quando isso doer, o upgrade é Sentry, já autorizado.

---

## R2 — Notificação em ≤ 15 min sem varredura agendada (SC-001, FR-002)

**Decisão**: o e-mail sai **no próprio ponto da falha**, dentro de
`recordIncident()`, não por cron.

**Rationale**: cron na Vercel no plano gratuito roda uma vez por dia — jamais
atenderia 15 minutos. Enviar no ponto da falha torna a latência de detecção igual
a zero e elimina a necessidade de um worker. O envio é `await`ado mas embrulhado
em `try/catch`: se o Resend estiver fora, o incidente **já está persistido** e
`notified_at` fica `null` para reenvio posterior — atende ao edge case "provedor
de alerta indisponível", em que o alerta não pode ser a única cópia da informação.

**Alternativas consideradas**: fila ou `waitUntil` para não bloquear a resposta —
rejeitado, o caminho já está em erro e alguns milissegundos a mais não mudam a
experiência de quem recebeu o 500.

---

## R3 — Agrupamento de alerta em cascata (FR-004)

**Decisão**: `fingerprint` = SHA-256 de `tipo + rota + mensagem normalizada`,
único na tabela. Repetição incrementa `count` e só reenvia e-mail se
`notified_at` for mais antigo que a janela de silêncio (30 min).

**Rationale**: cobre o edge case "falha sistêmica que afete muitos clientes não
pode gerar uma notificação por cliente" sem nenhuma infraestrutura de
agregação — a unicidade do fingerprint no Postgres faz o trabalho, e o `count`
no corpo do e-mail comunica a escala ("47 ocorrências desde 14:02").

**Nota**: a mensagem é normalizada antes do hash (UUIDs e números trocados por
`?`) para que o mesmo erro com IDs diferentes caia no mesmo grupo.

---

## R4 — Rate limit de autenticação (FR-005, FR-006, FR-007)

**Decisão**: tabela `auth_attempts` com janela fixa, chaveada por
`{escopo}:{alvo}`. Três escopos: `login:conta` (hash do e-mail), `login:origem`
(IP) e `reset:conta` (hash do e-mail).

**Rationale**: a própria spec já assumiu Postgres em vez de cache distribuído
(Assumptions, Princípio I), e o volume é de dezenas de sessões — janela fixa
resolve. Janela deslizante seria mais precisa na fronteira e mais cara em
escrita; a imprecisão de uma janela fixa aqui significa, no pior caso, permitir
até o dobro do limite na virada, o que é irrelevante contra um ataque de senha.

**Limites**: 10 tentativas/15 min por conta (SC-002 fixa "no máximo 10"), 30/15
min por IP, 5 pedidos de recuperação/hora por e-mail.

**Edge case "rede compartilhada"**: o limite por IP é deliberadamente 3× o limite
por conta, e a recusa por IP nunca bloqueia uma conta específica. Várias pessoas
legítimas atrás do mesmo Wi-Fi de obra esbarrariam no limite de conta antes do de
IP, e cada uma tem conta diferente. O limite por conta é o que protege; o de IP
existe só para um atacante que varre e-mails.

**FR-006 sem vazar existência de conta**: `requestPasswordReset` já retorna
`{ ok: true }` incondicionalmente. O rate limit é aplicado **antes** da consulta ao
banco e retorna o mesmo `{ ok: true }` — a resposta recusada é indistinguível da
aceita, mudando apenas que nenhum e-mail sai.

---

## R5 — Esgotamento de conexão em serverless (FR-008, SC-003)

**Decisão**: `postgres(url, { max: 1, idle_timeout: 20, connect_timeout: 10 })`.

**Rationale**: a causa raiz não é o Postgres ser pequeno, é `postgres.js` abrir
um pool de **10** conexões por padrão *por instância de lambda*. Em serverless,
concorrência vira instâncias, e cada instância multiplicava por 10 o consumo. Com
`max: 1`, 50 sessões simultâneas consomem no máximo o número de instâncias vivas,
e `idle_timeout` devolve a conexão em vez de segurá-la entre invocações. É a
configuração canônica de `postgres.js` em serverless e é uma linha de diff.

**Alternativas consideradas**: PgBouncer no host — resolveria de forma mais
robusta, mas é um serviço novo no mesmo host que já demonstrou não isolar IPC
entre containers (o incidente de TLS registrado no Princípio V). Desproporcional
para dezenas de sessões e contra o Princípio I.

**Como verificar**: teste de integração que dispara N requisições concorrentes
contra o dev server e falha se qualquer uma retornar erro de conexão. Descrito em
`quickstart.md`.

---

## R6 — Dead man's switch da rotina agendada (FR-003)

**Decisão**: `trial-warnings` grava um heartbeat ao terminar; um **segundo** Vercel
Cron (`/api/cron/watchdog`, 6 horas depois) alerta se o heartbeat estiver com mais
de 26 horas.

**Rationale**: "a rotina falhou" e "a rotina não executou" são problemas
diferentes. O primeiro se resolve com `try/catch` dentro da própria rota. O
segundo é impossível de detectar de dentro da rotina que não rodou — precisa de um
observador externo. Dois crons diários cabem até no plano gratuito da Vercel e não
introduzem nenhum mecanismo que o projeto já não use.

**Alternativas consideradas**: serviço externo de dead man's switch
(Healthchecks.io, Cronitor) — integração nova, rejeitada pelo Princípio I para um
problema que 40 linhas resolvem.

---

## R7 — Relatório apresentável (FR-030, FR-031, SC-009)

**Decisão**: rota `/app/obras/[id]/relatorio` como Server Component, estilizada
com `@media print`. A pessoa salva em PDF pelo navegador ou compartilha o link.

**Rationale**: "legível sem software de planilha" é satisfeito por HTML, que é o
formato mais legível que existe em celular — que é onde o produto é usado. Reusa
`painel-cards.tsx` e `grafico-categorias.tsx` sem duplicar layout, o que também
significa que o relatório não desatualiza quando o painel muda. Tempo de geração
é o de uma página normal, muito abaixo dos 2 s de SC-009.

**Alternativas consideradas**: `@react-pdf/renderer` — entregaria um arquivo
anexável, mas exige remontar todo o layout numa árvore de componentes própria,
mantendo dois layouts em sincronia para sempre. `puppeteer` não cabe no limite de
bundle da função serverless. Ambos rejeitados: dependência nova para resolver
"quero mandar isso para o meu contador", que um link ou um PDF do navegador já
resolve.

---

## R8 — Verificação automática do funil (FR-032, SC-010)

**Decisão**: teste de integração em Vitest exercitando `createAccount` →
`getAccess` (trial) → evento de webhook Stripe assinado localmente →
`processStripeWebhookEvent` → `getAccess` (full), rodando em GitHub Actions a cada
push, com `postgres:16` como service container e chave Stripe de **modo teste**.

**Rationale**: o funil é uma cadeia de funções de servidor, não de cliques — pode
ser verificado sem navegador. Vitest já está instalado e o `tests/setup.ts` de 001
já sabe truncar o banco entre casos. O service container elimina a dependência do
Postgres de produção no CI, que seria um risco tolo de correr por um teste.

**Alternativas consideradas**: Playwright — E2E de verdade, mas é dependência nova
e browser no CI para cobrir um percurso que não tem lógica de cliente relevante. A
parte que quebra em produção é a transição de estado da assinatura, e essa é
server-side. Fica como candidato se o funil crescer para incluir Checkout hospedado
de verdade.

**Ceiling conhecido**: o Action *reporta*, não *bloqueia* — a Vercel deploya por
conta própria no push. Fechar o gate exige branch protection com o check como
obrigatório, decisão de configuração do repositório fora do código.

---

## Decisões herdadas de 001 que continuam valendo

- Dinheiro em centavos (`integer`), nunca `float`.
- Toda leitura de dado de obra escopada por `obras.user_id` no servidor.
- Migração sempre em par `NNNN_nome.sql` + `NNNN_nome.down.sql`.
- `fileParallelism: false` no Vitest — o truncate entre casos assume banco único.
