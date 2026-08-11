# Contrato: webhook do Stripe

**Feature**: `001-web-app-obras` | **Fase**: 1
**Rota**: `POST /api/stripe/webhook` · **Runtime**: `nodejs` · corpo lido como
raw (`await req.text()`), nunca `req.json()` — a verificação de assinatura exige
os bytes originais.

Este é o **único** caminho que escreve estado de acesso em `subscriptions`
(FR-018, FR-019). Nenhuma Server Action e nenhuma página altera `status` ou
`access_until`.

---

## Verificação

```ts
stripe.webhooks.constructEvent(rawBody, req.headers.get('stripe-signature'), STRIPE_WEBHOOK_SECRET)
```
Falha ⇒ `400 { error: 'ASSINATURA_INVALIDA' }` e nada é gravado. É a única
resposta de erro do handler: qualquer outro código faz o Stripe reenviar.

## Pipeline

```text
1. verifica assinatura                       → falha: 400
2. INSERT INTO stripe_events (id, ...) ON CONFLICT (id) DO NOTHING
      0 linhas  → evento repetido            → 200 { duplicado: true }
3. resolve o usuário (ver Resolução abaixo)
      sem match → marca unmatched=true, audit_log, 200 { unmatched: true }
4. checagem de ordem:
      event.created < subscriptions.last_event_at
                → applied=false              → 200 { fora_de_ordem: true }
5. aplica a transição, grava last_event_at = event.created, audit_log
                                             → 200 { ok: true }
```

Passos 2 a 5 rodam **em uma única transação**. Erro inesperado ⇒ rollback e
`500`, e o Stripe reenvia — como o `INSERT` do passo 2 também é revertido, o
reenvio reprocessa corretamente em vez de ser descartado como duplicata.

## Resolução do usuário

Em ordem, primeiro que resolver vence:
1. `event.data.object.client_reference_id` → `users.id` (caminho normal, R6)
2. `event.data.object.customer` → `subscriptions.stripe_customer_id`
3. `event.data.object.subscription` → `subscriptions.stripe_subscription_id`

Nenhum resolve ⇒ **não cria conta** (R6): grava `stripe_events.unmatched = true`,
registra `webhook_unmatched` em `audit_log` e responde `200`.

---

## Eventos tratados

| Evento | Efeito em `subscriptions` |
|--------|---------------------------|
| `checkout.session.completed` | grava `stripe_customer_id` e `stripe_subscription_id`; `status = 'active'`; `access_until = current_period_end` (FR-018) |
| `customer.subscription.updated` | `status` ← mapa abaixo; `access_until = current_period_end`; `cancel_at_period_end` espelhado (FR-021) |
| `customer.subscription.deleted` | `status = 'expired'`; `access_until = now()` (FR-022) |
| `invoice.payment_succeeded` | `status = 'active'`; estende `access_until = current_period_end` |
| `invoice.payment_failed` | `status = 'past_due'`; `access_until` **inalterado**; dispara e-mail de regularização (FR-023) |

Qualquer outro tipo é gravado em `stripe_events` e ignorado com `200`.

**Mapa `subscription.status` do Stripe → nosso `status`**

| Stripe | Nosso | Observação |
|--------|-------|------------|
| `active`, `trialing` | `active` | trial do Stripe não é usado (R2), mas é aceito |
| `past_due`, `unpaid` | `past_due` | mantém acesso até `access_until` (tolerância) |
| `canceled`, `incomplete_expired` | `expired` | acesso encerra imediatamente |
| `incomplete`, `paused` | inalterado | estado transitório, não decide acesso |

`cancel_at_period_end = true` com Stripe ainda `active` ⇒ nosso `status =
'canceled'` e `access_until = current_period_end`: acesso pago segue até o fim do
período já pago (FR-021), depois cai para `readonly` por comparação de timestamp.

**Nunca reduzir acesso por conta própria**: o handler jamais escreve
`access_until` no passado exceto em `customer.subscription.deleted`. Trial e
período pago expiram por comparação de timestamp na leitura (R4), não por
escrita.

---

## Cenários de teste obrigatórios (constitution: estado de assinatura)

1. Assinatura de conta em trial ⇒ `active` e acesso `full` mantido sem intervalo.
2. **Mesmo evento entregue duas vezes** ⇒ segunda resposta `duplicado: true` e
   `subscriptions` inalterada (FR-020).
3. **`customer.subscription.updated` antigo chegando depois de um recente** ⇒
   `applied = false`, `access_until` preservado (FR-020).
4. `payment_failed` seguido de `payment_succeeded` ⇒ volta a `active` e
   `access_until` estendido.
5. Cancelamento ⇒ `full` até `access_until`, `readonly` depois, obras e
   lançamentos intactos e exportação disponível (FR-021, FR-022, FR-027).
6. Evento sem usuário resolvível ⇒ `unmatched: true`, `200`, nenhuma conta criada
   (R6).
7. Assinatura inválida no header ⇒ `400` e zero escrita.
8. Reassinatura depois de `expired` ⇒ `full` restabelecido com os dados da obra
   anterior preservados (US2-8).
