# Reforma Maestro — Visão Geral do Projeto

**Documento técnico e executivo** · Última atualização: 11/08/2026

---

## 1. Sumário executivo

O **Reforma Maestro** deixou de ser a landing page de venda de uma planilha
Google Sheets e virou um **web app com backend próprio**: controle financeiro
de obras por assinatura recorrente (**R$ 47,90/mês**, cobrança via **Stripe**),
com **14 dias de teste grátis sem cartão**. O código deste repositório agora
serve tanto o canal de aquisição (landing page, blog, `/sobre`, todos com URL
preservada) quanto o produto em si, autenticado, em `/app`.

O produto ajuda uma pessoa física leiga — sem conhecimento técnico de
construção civil ou de planilhas — a não perder o controle do orçamento
durante uma reforma ou obra residencial. Isso não mudou. O que mudou é a
entrega: em vez de uma planilha provisionada manualmente por script, é uma
conta com dados persistidos em Postgres, cadastro/login, múltiplas obras por
conta e assinatura como fonte da verdade do acesso.

A migração (feature `001-web-app-obras`, fluxo Spec Kit) está com **MVP +
assinatura + exportação + SEO/conteúdo público completos e no `main`** (Fases
1–6). Resta a Fase 7 (polish e itens de pré-lançamento) — ver §8.

---

## 2. A dor que resolve

Reformas residenciais estouram orçamento com frequência porque o controle
financeiro de quem contrata é informal: anotações soltas, WhatsApp com
fornecedores, memória. Sem comparar **Previsto vs. Realizado** por categoria
(Material, Mão de Obra, Taxas, Mobília), o dono da obra só percebe o estouro
quando já é tarde — e não tem visibilidade de quanto do orçamento já foi
consumido nem de para onde o dinheiro está indo.

A dor não é "gerenciar uma obra" (isso é problema do engenheiro/construtora) —
é **fluxo de caixa pessoal durante um projeto de gasto imprevisível e
prolongado**, para alguém que não usaria (ou não sabe montar) uma ferramenta
de gestão de projetos ou um ERP de construção.

## 3. A quem se destina

**Perfil do cliente (ICP):** pessoa física, dona de imóvel, executando reforma
ou construção residencial — não é construtora, não é profissional de
engenharia/arquitetura. Uso majoritário em celular durante a obra.

Não é um produto para o mercado B2B de construção civil (não há e nunca houve
integração com tabela SINAPI real, ERPs de obra, ou fluxos
multiusuário/aprovação — a menção a SINAPI no marketing é apenas ilustrativa).

## 4. O que o produto faz

Depois de cadastrar (trial de 14 dias, sem cartão), a conta pode:

| Área | Função |
|---|---|
| Obras | Cadastrar múltiplas obras, cada uma com orçamento teto e % de fundo de reserva |
| Lançamentos | Registrar gastos por obra: data, categoria (Material / Mão de Obra / Taxas / Mobília), item, valor previsto, valor pago — com status (Pago/Pendente) e diferença calculados no servidor |
| Painel | Cards de total previsto, total pago, saldo restante, % do orçamento consumido, fundo de reserva explícito, alerta de estouro e gráfico por categoria |
| Exportação | CSV por obra a qualquer momento, inclusive com assinatura cancelada ou vencida |
| Assinatura | Checkout e Customer Portal Stripe, trial sem cartão, degradação de acesso previsível quando a assinatura expira ou falha o pagamento |

Todo cálculo financeiro (centavos, arredondamento, status do lançamento) é
feito no servidor, nunca confiado ao cliente.

## 5. Como funciona — jornada do cliente

1. Visitante chega ao site (orgânico via blog/SEO, ou tráfego pago/direto) em
   `orcaobra.roilabs.com.br` — a landing page, o blog e `/sobre` mantêm as
   mesmas URLs de antes da migração.
2. CTA leva ao cadastro em `/cadastrar`: conta nasce em **trial de 14 dias,
   sem cartão**.
3. O cliente já usa o produto completo durante o trial: cadastra obras,
   lança gastos, acompanha o painel.
4. Perto do fim do trial (ou depois dele), a conta é convidada a assinar via
   **Stripe Checkout** (`/app/assinar`). Pagamento aprovado libera o acesso
   automaticamente — o **webhook do Stripe é o único escritor de estado de
   assinatura**, nunca o cliente.
5. Cancelamento, inadimplência ou trial vencido degradam o acesso para
   **somente leitura + exportação** (nunca perda de dados) até o titular
   pedir a exclusão da conta.

## 6. Como funciona — arquitetura técnica

Um único codebase, um único deploy Vercel — sem microsserviço, fila ou cache
distribuído (Princípio I da constitution).

- **`frontend-next/`** — único frontend ativo (o protótipo legado `frontend/`,
  gerado via Lovable, foi removido do repositório). Next.js 16 (App Router) +
  React 19 + TypeScript, Tailwind + shadcn/ui, hospedado na Vercel. Contém:
  - `app/(public)/` — home, blog (`blog/[slug]`), `/sobre`, `/privacidade`:
    mesmas URLs de antes, sem redirect
  - `app/(auth)/` — `entrar`, `cadastrar`, `recuperar-senha`,
    `redefinir-senha/[token]`, `noindex`
  - `app/(app)/app/` — o produto autenticado: seletor de obras, painel,
    lançamentos, assinatura, conta — protegido por middleware, `noindex`
  - `app/api/` — handler do Auth.js, webhook do Stripe, exportação CSV,
    cron diário de avisos de trial
  - `db/` — schema único via Drizzle ORM, migrações SQL versionadas e
    reversíveis, queries de leitura sempre escopadas por `user_id`
  - `server/actions/` — mutações (Server Actions): auth, obras, lançamentos,
    assinatura
  - `lib/` — lógica pura testada (`money.ts`, `calc.ts`, `csv.ts`),
    `access.ts` (fonte da verdade do tier de acesso), integrações
    (`auth.ts`, `stripe.ts`, `email.ts`)

Integrações externas: **Stripe** (Checkout + Customer Portal + webhook,
cobrança recorrente), **Postgres** auto-hospedado (`sslmode=require` fora de
ambiente de teste), **Resend** (e-mail transacional), Google Analytics 4,
Google Search Console. A Google Sheets API e os scripts de provisionamento
manual da planilha foram removidos — não há mais fulfillment manual.

Testes automatizados (Vitest) cobrem o que a constitution exige: autenticação,
escopo de dados por usuário, cálculo financeiro e estado de assinatura —
55 testes em 10 arquivos, todos passando no `main`.

## 7. Por que existe / racional de negócio

SEO continua sendo o canal de aquisição primário (blog, `/sobre` para E-E-A-T,
sitemap, structured data — Princípio II da constitution), mas o modelo de
receita mudou de infoproduto de pagamento único para **assinatura recorrente**:
o produto agora tem custo de operação contínuo (banco de dados, e-mail,
processamento de pagamento) e entrega valor contínuo (dados sempre
atualizados, múltiplas obras, sem limite de uso), o que justifica cobrança
mensal em vez de "acesso vitalício".

## 8. Estado atual e maturidade

- Feature `001-web-app-obras` (Spec Kit): **Fases 1–6 completas, verificadas
  e no `main`** — MVP, assinatura, exportação, SEO/conteúdo público. Fase 7
  (polish e pré-lançamento) em andamento; ver
  [`specs/001-web-app-obras/tasks.md`](../specs/001-web-app-obras/tasks.md) e
  [`specs/001-web-app-obras/handoff.md`](../specs/001-web-app-obras/handoff.md)
  para o detalhe task-a-task.
- `npm test` (55/55), `npm run build` e `npm run lint` limpos no `main`.
- Governança do projeto segue a `.specify/memory/constitution.md` (v2.0.0),
  reescrita para refletir o pivot de infoproduto estático para web app com
  backend.

## 9. Riscos e lacunas conhecidas

- **TLS de produção pendente**: o Postgres real ainda não tem `sslmode=require`
  habilitado no host; `src/db/index.ts` derruba qualquer request em
  `NODE_ENV=production` sem isso (guarda proposital). É o bloqueio real antes
  de qualquer deploy funcionar em produção — rastreado como T080 na Fase 7.
- **Webhook de produção do Stripe** ainda não cadastrado apontando para o
  domínio final, nem as variáveis de ambiente de produção definidas na Vercel
  (T081).
- **Débito de conteúdo**: os artigos do blog (`frontend-next/src/data/blog-posts.ts`)
  ainda promovem "planilha" como entregável em vários pontos. Reescrever
  ~10+ artigos é decisão de conteúdo maior que o escopo de uma task
  individual — vale revisão antes do lançamento real.
- **Teste de usabilidade e instrumentação de eventos GA4** (`obra_criada`,
  `lancamento_criado`, `assinatura_concluida`) ainda pendentes — sem eles, os
  critérios de sucesso de tempo (SC-001 a SC-004) e conversão (SC-003,
  SC-011) ficam declarados mas não verificáveis após o lançamento.
