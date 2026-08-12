# Contrato: captura e notificação de incidente

**Feature**: `002-melhorias-v11` | **Fase**: 1 | Cobre FR-001, FR-002, FR-003, FR-004

## Ponto único de entrada

```ts
// src/lib/incidents.ts
export type IncidentKind =
  | "server_error"   // exceção não tratada numa rota (FR-001)
  | "webhook_failed" // evento Stripe recebido e não aplicado (FR-002)
  | "cron_failed"    // rotina agendada lançou erro (FR-003)
  | "cron_missing";  // rotina agendada não executou na janela (FR-003)

export async function recordIncident(
  kind: IncidentKind,
  route: string,
  error: unknown,
  detail?: Record<string, unknown>,
): Promise<void>;
```

Toda notificação de falha do sistema passa por aqui. Nenhum outro arquivo manda
e-mail de erro direto.

**`recordIncident` nunca lança.** Está sempre num caminho que já falhou; deixar
o observador derrubar o observado seria trocar um erro por dois. Falha interna
dela vai para `console.error` e para de propagar. A única exceção é a violação de
chave proibida em `detail`, que lança em desenvolvimento e teste para pegar
vazamento antes de produção.

## Fluxo

```
recordIncident(kind, route, error, detail)
  │
  ├─ fingerprint = sha256(kind + route + normalize(message))
  │    normalize: UUID → '?', sequência de dígitos → '?'
  │
  ├─ UPSERT incidents
  │    ON CONFLICT (fingerprint) DO UPDATE
  │      count = count + 1, last_seen_at = now()
  │
  ├─ detail passa por FORBIDDEN_KEYS (reusado de lib/audit.ts)
  │
  └─ deve notificar?
       notified_at IS NULL  OR  now() - notified_at > 30 min
         ├─ sim → sendIncidentEmail(...)  [try/catch]
         │          sucesso → notified_at = now()
         │          falha   → notified_at fica como está (reenvio depois)
         └─ não → nada; o count já registrou a ocorrência
```

**Janela de silêncio: 30 min.** Cobre o edge case de alerta em cascata: uma falha
sistêmica atingindo 200 clientes gera **um** e-mail dizendo "200 ocorrências",
não 200 e-mails (FR-004).

**Registro sobrevive à indisponibilidade do alerta.** O `UPSERT` acontece antes
da tentativa de envio. Se o Resend estiver fora, o incidente está no banco com
`notified_at IS NULL` — o alerta nunca é a única cópia da informação.

## Chamadores

| Origem | Onde | Kind | Observação |
|--------|------|------|-----------|
| Erro não tratado de servidor | `src/instrumentation.ts` → `onRequestError` | `server_error` | Hook nativo do Next 16; pega Server Component, Route Handler e Server Action |
| Webhook Stripe não aplicado | `src/server/stripe/webhook.ts`, ramo `unmatched` | `webhook_failed` | Já grava `stripe_events.unmatched` e `audit_log`; passa a alertar também |
| Assinatura do webhook inválida | `src/app/api/stripe/webhook/route.ts` | `webhook_failed` | Falha na verificação também é falha no caminho do dinheiro |
| Rotina de trial falhou | `src/app/api/cron/trial-warnings/route.ts`, `catch` | `cron_failed` | O `catch` envolve o corpo inteiro |
| Rotina de trial não rodou | `src/app/api/cron/watchdog/route.ts` | `cron_missing` | Heartbeat com mais de 26 h |

## Route Handler: `/api/cron/watchdog`

```
GET /api/cron/watchdog
Authorization: Bearer ${CRON_SECRET}        # mesmo esquema de trial-warnings

200 { ok: true, stale: false }              # heartbeat fresco
200 { ok: true, stale: true }               # incidente cron_missing registrado
401 { error: "NAO_AUTENTICADO" }
```

Roda às `0 18 * * *` (6 h depois de `trial-warnings`, que roda às `0 12 * * *`).
Limiar de 26 h dá folga de duas horas sobre o intervalo diário, evitando alarme
por atraso normal de agendamento.

O watchdog também reenvia incidentes com `notified_at IS NULL` — é onde os
alertas perdidos por indisponibilidade do Resend são recuperados.

## Contrato do e-mail (FR-002)

Assunto: `[Reforma Maestro] {kind}: {route}`

Corpo, em texto: tipo, rota, mensagem, contagem de ocorrências, primeira e última
ocorrência, e o `userId` afetado quando houver.

**MUST NOT conter** (Princípio V): senha, hash, token, chave de API, dado de
cartão, `item`, `fornecedor` ou qualquer valor em centavos. O identificador do
cliente afetado é o `userId` — suficiente para o fornecedor achar a conta no
banco sem que o dado dela trafegue por e-mail.

Destinatário: `INCIDENT_EMAIL` (env var nova, sem default — ausente desliga o
envio mas **não** o registro).
