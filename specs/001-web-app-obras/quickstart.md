# Quickstart: validar o Web App de Controle Financeiro de Obras

**Feature**: `001-web-app-obras` | **Fase**: 1

Guia de execução e validação. Detalhes de schema estão em
[`data-model.md`](./data-model.md); assinaturas de action e rota em
[`contracts/`](./contracts/). Nenhum código de implementação aqui.

---

## Pré-requisitos

- Node 20+ e npm
- Postgres acessível (o auto-hospedado do projeto ou um local para dev)
- Conta Stripe em modo teste + [Stripe CLI](https://stripe.com/docs/stripe-cli)
- Conta Resend (chave de API em modo teste)

## Variáveis de ambiente

`frontend-next/.env.local` (nunca versionado — Princípio V):

```ini
DATABASE_URL=postgres://user:senha@host:5432/reforma?sslmode=require
DATABASE_URL_TEST=postgres://user:senha@localhost:5432/reforma_test
AUTH_SECRET=            # openssl rand -base64 32
AUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # sai do `stripe listen`
STRIPE_PRICE_ID=price_...         # preço recorrente mensal
RESEND_API_KEY=re_...
CRON_SECRET=                      # openssl rand -hex 32
TRIAL_DAYS=14
```

> `sslmode=require` é obrigatório em qualquer ambiente com dado real (R17,
> Princípio V). Se o Postgres ainda não tiver TLS habilitado, habilitar **antes**
> do primeiro cadastro real — não é aceitável cair para `sslmode=disable`.

Na Vercel, as mesmas variáveis vão em Project Settings → Environment Variables,
com `AUTH_URL` apontando para o domínio de produção.

## Subir o ambiente

```bash
cd frontend-next
npm install
npx drizzle-kit migrate          # aplica src/db/migrations/
npm run dev                      # http://localhost:3000
```

Em outro terminal, para receber webhooks localmente:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Rodar os testes

```bash
npm test                  # Vitest: unitários + integração
npm test -- --coverage
```

Os testes de integração aplicam as migrações em `DATABASE_URL_TEST` e truncam as
tabelas entre casos. O banco de teste **nunca** aponta para produção — o setup
aborta se `DATABASE_URL_TEST` e `DATABASE_URL` forem iguais.

---

## Cenários de validação

Cada cenário fecha uma User Story do spec e é verificável de ponta a ponta.

### V1 — Controlar o orçamento (US1, P1)

1. `/cadastrar` com e-mail e senha ⇒ entra autenticado e cai no cadastro da
   primeira obra (US1-1).
2. Cadastrar obra: nome, orçamento `85.000,00`, fundo de reserva `10`. O painel
   deve mostrar orçamento `R$ 85.000,00`, reserva `R$ 8.500,00`, saldo
   disponível `R$ 76.500,00` (US1-2, FR-017).
3. Lançar: `10/08/2026`, Material, "Cimento CP-II", "Depósito Central",
   previsto `1.200,00`, pago `1.200,00` ⇒ aparece na lista com status **Pago** e
   diferença `R$ 0,00` (US1-3, FR-010).
4. Lançar um segundo com pago `500,00` sobre previsto `1.200,00` ⇒ status
   **Pendente**, diferença `-R$ 700,00`.
5. Painel deve somar previsto `R$ 2.400,00`, pago `R$ 1.700,00`, saldo
   `R$ 82.600,00`, 2,8% consumido, e mostrar a quebra por categoria (US1-4).
6. Lançar um item de `90.000,00` ⇒ o painel sinaliza estouro e informa o valor
   excedido (US1-5, FR-016).
7. Editar esse lançamento para `1.000,00` e excluir outro ⇒ todos os indicadores
   se atualizam na hora (US1-7, FR-011).
8. Criar uma segunda obra e alternar entre elas ⇒ painel e lista refletem só a
   obra selecionada, sem soma cruzada (US1-8, FR-007).

**Isolamento (US1-6, SC-006)** — o cenário que não pode falhar:
1. Criar um segundo usuário com sua própria obra.
2. Autenticado como o usuário A, acessar `/app/obras/<id-da-obra-do-B>` ⇒ **404**,
   nunca 403 nem o conteúdo.
3. Acessar `/api/obras/<id-da-obra-do-B>/export` ⇒ **404**.
4. Chamar `updateLancamento` com o `lancamentoId` do B ⇒ `NAO_ENCONTRADO`.

### V2 — Trial, assinatura e acesso (US2, P2)

1. Conta recém-criada mostra os dias restantes do trial, **sem pedir cartão**
   (US2-1, FR-025).
2. `/app/assinar` → checkout Stripe → cartão de teste `4242 4242 4242 4242` ⇒
   após o webhook `checkout.session.completed`, a conta vira `active` sem nenhuma
   ação manual (US2-4, FR-018, SC-005).
3. Reenviar o mesmo evento (`stripe events resend <id>`) ⇒ nada muda em
   `subscriptions` (FR-020). Conferir `stripe_events`.
4. Expirar o trial à mão (`UPDATE subscriptions SET access_until = now() -
   interval '1 day' WHERE user_id = ...`) ⇒ o app entra em `readonly`: leitura e
   exportação funcionam, criar/editar redireciona para `/app/assinar`
   (US2-3, US2-5, FR-025b).
5. Cancelar pelo Customer Portal ⇒ acesso `full` permanece até `access_until`;
   depois cai para `readonly` com os dados intactos (US2-6, FR-021, FR-024).
6. Simular `invoice.payment_failed` via Stripe CLI ⇒ `past_due`, e-mail de
   regularização enviado, acesso mantido até o fim da tolerância (US2-7, FR-023).
7. Reassinar a partir de `expired` ⇒ `full` restabelecido com as obras anteriores
   preservadas (US2-8).
8. Excluir a conta e recadastrar com o **mesmo e-mail** ⇒ a nova conta nasce sem
   trial (US2 edge case, FR-025c, SC-012).
9. Com uma conta no **dia 4 de um trial de 14**, assinar ⇒ a primeira cobrança é
   agendada para o fim do trial (não para hoje) e o `access_until` resultante é
   posterior ao que o trial já garantia. Nenhum dia perdido, nenhum duplicado
   (US2 edge case, R2).

### V3 — Levar os dados embora (US3, P3)

1. Com a obra populada, baixar `/api/obras/<id>/export` ⇒ CSV com todos os
   lançamentos e todos os campos (US3-1, FR-026).
2. Abrir o arquivo no Excel em pt-BR ⇒ colunas separadas, acentuação correta
   ("Mão de Obra"), valores e datas em formato brasileiro (US3-3).
3. Repetir com a conta em `readonly` ⇒ o download continua funcionando (US3-2,
   FR-027, SC-007).

### V4 — Canal público (US4, P4)

1. Anônimo acessa `/`, `/blog`, `/blog/<slug>` e `/sobre` ⇒ todas carregam sem
   login (US4-1, FR-031).
2. `curl -I` em cada URL indexada antes da virada ⇒ **200**, sem redirect e sem
   erro (US4-2, FR-032, SC-008).
3. `/robots.txt` contém `Disallow: /app` e as rotas de auth; `view-source` de
   `/app` mostra `<meta name="robots" content="noindex">` (US4-4, FR-033).
4. A página de vendas descreve app e assinatura, sem oferecer planilha
   (US4-3, FR-034).
5. `/sitemap.xml` lista apenas rotas públicas — nenhuma rota de `/app`.

---

## Checagens antes do merge

- [ ] `npm test` verde, com os cenários obrigatórios de
      [`contracts/stripe-webhook.md`](./contracts/stripe-webhook.md) cobertos
- [ ] `npm run build` e `npm run lint` sem erro
- [ ] V1-isolamento executado manualmente (SC-006 é requisito de corretude)
- [ ] `DATABASE_URL` de produção com `sslmode=require` (R17)
- [ ] Nenhum segredo em código versionado; `.env.local` fora do git
- [ ] Sitemap e structured data ainda válidos (Princípio II)
- [ ] Webhook de produção cadastrado no Stripe apontando para o domínio final,
      com o `STRIPE_WEBHOOK_SECRET` de produção
- [ ] Obra com 500 lançamentos: queries agregadas do painel em < 200 ms (p95) e
      LCP do painel < 2,5 s em 3G rápido (SC-009)
- [ ] `frontend/` e os scripts de planilha removidos ao fim da migração
      (FR-035, R15)
