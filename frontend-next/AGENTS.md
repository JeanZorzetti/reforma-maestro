<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Feature 002 — endurecimento, conversão e profundidade (v1.1)

**Tabelas novas** (migração `0003_melhorias_v11`): `incidents` (incidente
operacional, PK `fingerprint`), `heartbeats` (prova de vida de cron, PK
`name`), `auth_attempts` (rate limit de autenticação, PK `key`),
`parcelamentos` (série de parcelas de um lançamento). Colunas novas:
`obras.exemplo`, `lancamentos.parcelamento_id`/`parcela_num`.

**Alerta de incidente**: `recordIncident()` em `src/lib/incidents.ts` é o
único ponto de captura e notificação de falha do sistema — nenhum outro
arquivo manda e-mail de erro direto. Nunca lança (exceto violação de
`FORBIDDEN_KEYS` em `detail`, fora de produção). Janela de silêncio de 30min
entre reenvios da mesma falha (por `fingerprint`).

**Crons** (`vercel.json`): `trial-warnings` roda `0 12 * * *` e grava
heartbeat ao terminar; `watchdog` roda `0 18 * * *`, dispara `cron_missing`
se o heartbeat passar de 26h e reenvia incidentes com `notified_at IS NULL`
(dead man's switch).

**Rate limit** (`src/lib/rate-limit.ts`): janela fixa em Postgres, sem Redis.
`login` 10/15min, `login_ip` 30/15min, `reset` 5/60min.
