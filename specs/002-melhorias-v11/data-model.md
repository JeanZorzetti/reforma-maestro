# Data Model: Endurecimento, Conversão e Profundidade do App de Obras

**Feature**: `002-melhorias-v11` | **Fase**: 1 | **Data**: 2026-08-12

Tudo abaixo entra numa única migração `0003_melhorias_v11.sql`, com o par
`.down.sql` correspondente. Dinheiro em centavos (`integer`), como em 001.

---

## Tabelas novas

### `incidents` — Incidente operacional (FR-001 a FR-004)

Falha relevante detectada pelo sistema, agrupada por fingerprint.

| Coluna | Tipo | Regra |
|--------|------|-------|
| `fingerprint` | `text` PK | SHA-256 de `kind + rota + mensagem normalizada` |
| `kind` | `incident_kind` enum | `server_error`, `webhook_failed`, `cron_failed`, `cron_missing` |
| `route` | `text` | rota ou identificador do job; nunca query string |
| `message` | `text` | mensagem do erro, truncada em 2000 chars |
| `detail` | `jsonb` default `{}` | mesma lista de chaves proibidas de `logAudit` |
| `count` | `integer` not null default 1 | ocorrências acumuladas |
| `first_seen_at` | `timestamptz` not null default now() | |
| `last_seen_at` | `timestamptz` not null default now() | |
| `notified_at` | `timestamptz` nullable | `null` ⇒ nunca notificado, elegível a reenvio |

**Índice**: `incidents_notified_at_idx` em `(notified_at, last_seen_at)` — a
varredura de reenvio busca `notified_at IS NULL`.

**Validação (Princípio V)**: `detail` **MUST NOT** conter senha, hash, token,
chave, dado de cartão ou valor financeiro de obra. `recordIncident()` reusa a
verificação de `FORBIDDEN_KEYS` de `src/lib/audit.ts` e lança se violada. O
`userId` afetado vai em `detail.userId`; `item`, `fornecedor` e qualquer `*_cents`
nunca vão.

**Transições de `notified_at`**: `null` → timestamp no primeiro envio bem
sucedido. Reocorrência dentro da janela de silêncio (30 min) apenas incrementa
`count` e atualiza `last_seen_at`. Fora da janela, reenvia e atualiza
`notified_at`.

---

### `heartbeats` — Prova de vida de rotina agendada (FR-003)

| Coluna | Tipo | Regra |
|--------|------|-------|
| `name` | `text` PK | ex.: `trial-warnings` |
| `last_run_at` | `timestamptz` not null default now() | |

Escrito por `upsert` ao fim de cada execução bem-sucedida da rotina. Lido pelo
watchdog. Duas linhas no total, para sempre — é uma tabela de estado, não de log.

---

### `auth_attempts` — Tentativa de autenticação (FR-005 a FR-007)

Contagem por janela fixa. **Não guarda a credencial tentada** — nem a senha, nem
o e-mail em claro.

| Coluna | Tipo | Regra |
|--------|------|-------|
| `key` | `text` PK | `{escopo}:{alvo}` — `login:<sha256(email)>`, `login_ip:<ip>`, `reset:<sha256(email)>` |
| `window_start` | `timestamptz` not null | início da janela corrente |
| `count` | `integer` not null default 0 | tentativas dentro da janela |

**Limites** (constantes em `src/lib/rate-limit.ts`, não em banco):

| Escopo | Limite | Janela |
|--------|--------|--------|
| `login` (por conta) | 10 | 15 min |
| `login_ip` (por origem) | 30 | 15 min |
| `reset` (por e-mail) | 5 | 60 min |

**Transição**: se `now() - window_start > janela`, a linha é reiniciada
(`window_start = now()`, `count = 1`) na mesma escrita — nenhuma limpeza agendada
é necessária. Tentativa bem-sucedida de login apaga a linha da conta (FR-006 do
cenário 6: quem lembrou a senha entra normalmente).

---

### `parcelamentos` — Série de parcelas (FR-018 a FR-022)

Agrupa lançamentos gerados num único preenchimento.

| Coluna | Tipo | Regra |
|--------|------|-------|
| `id` | `uuid` PK default random | |
| `obra_id` | `uuid` not null → `obras.id` `ON DELETE CASCADE` | escopo herdado da obra |
| `total_cents` | `integer` not null | `CHECK > 0`; total informado pela pessoa |
| `parcelas` | `integer` not null | `CHECK BETWEEN 2 AND 60` (FR-022) |
| `periodicidade` | `periodicidade` enum | `mensal`, `quinzenal`, `semanal` |
| `created_at` | `timestamptz` not null default now() | |

**Invariante (FR-019)**: a soma de `previsto_cents` dos lançamentos da série é
**exatamente** `total_cents`. Garantida por `distribuirParcelas()` em
`src/lib/parcelas.ts`: base `Math.floor(total / n)` e o resto distribuído um
centavo por parcela a partir da primeira. Coberta por teste unitário com casos
não divisíveis (ex.: `1000 / 3` → `334, 333, 333`).

---

## Colunas novas em tabelas existentes

### `obras`

| Coluna | Tipo | Motivo |
|--------|------|--------|
| `exemplo` | `boolean` not null default `false` | FR-014, FR-015 — obra de demonstração |

`arquivada_em` **já existe** desde 001 (`timestamptz` nullable, já indexada em
`obras_user_id_arquivada_em_idx`) e já é respeitada pela exportação. FR-026 e
FR-027 são trabalho de action e de UI, não de schema.

**Regra FR-015**: `exemplo = true` é excluída de indicadores de uso e marcada de
forma inequívoca na exportação. As queries de painel de uma obra específica
**não** filtram por `exemplo` — a obra de exemplo tem painel funcionando, que é
justamente o ponto dela (FR-014).

**Regra FR-028**: `getAccess()` não lê `obras`. Arquivar ou desarquivar não
altera acesso, por construção. Um teste de integração fixa isso contra regressão.

### `lancamentos`

| Coluna | Tipo | Motivo |
|--------|------|--------|
| `parcelamento_id` | `uuid` nullable → `parcelamentos.id` `ON DELETE SET NULL` | FR-020 |
| `parcela_num` | `integer` nullable | `CHECK (parcela_num IS NULL) = (parcelamento_id IS NULL)` |

**`ON DELETE SET NULL` é deliberado**: excluir a série (FR-021) apaga os
lançamentos explicitamente numa transação, contando quantos antes de confirmar.
O `SET NULL` cobre o caso de a série ser removida deixando os lançamentos como
avulsos, que é o comportamento seguro para dado financeiro — nunca sumir com
lançamento de cliente por efeito colateral de FK.

**Índice**: `lancamentos_parcelamento_id_idx` em `(parcelamento_id)`, para editar
ou excluir a série inteira sem varredura.

---

## Agregação nova (sem tabela)

### `evolucaoConsumo(userId, obraId)` — FR-023, FR-024, FR-025

Consulta em `src/db/queries/painel.ts`, sem materialização. Retorna soma
acumulada por mês:

```
{ mes: '2026-03', pagoAcumulado: 1250000, previstoAcumulado: 1800000 }[]
```

- `pagoAcumulado`: janela `SUM(pago_cents) OVER (ORDER BY mes)` sobre lançamentos
  com `data <= CURRENT_DATE` — o que já saiu do bolso.
- `previstoAcumulado`: mesma janela sobre `previsto_cents` de todos os
  lançamentos, inclusive datas futuras — o que está programado (FR-024).
- Escopo por join em `obras.user_id`, como toda query de 001.
- **FR-025**: menos de 2 meses distintos retorna array vazio, e a UI mostra a
  mensagem explicativa em vez de um gráfico degenerado.
