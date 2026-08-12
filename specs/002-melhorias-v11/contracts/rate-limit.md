# Contrato: limite de tentativas de autenticação

**Feature**: `002-melhorias-v11` | **Fase**: 1 | Cobre FR-005, FR-006, FR-007

## Interface

```ts
// src/lib/rate-limit.ts
export type RateScope = "login" | "login_ip" | "reset";

export interface RateResult {
  allowed: boolean;
  retryAfterSeconds: number; // 0 quando allowed
}

/** Consome uma tentativa. Chamar ANTES de qualquer consulta ao banco de usuários. */
export async function consumeAttempt(scope: RateScope, target: string): Promise<RateResult>;

/** Zera o contador da conta após autenticação bem-sucedida. */
export async function clearAttempts(scope: RateScope, target: string): Promise<void>;
```

`target` é o e-mail normalizado (a função aplica SHA-256 internamente — o e-mail
em claro nunca chega à tabela) ou o IP de origem.

| Escopo | Limite | Janela | Chave |
|--------|--------|--------|-------|
| `login` | 10 | 15 min | `login:<sha256(email)>` |
| `login_ip` | 30 | 15 min | `login_ip:<ip>` |
| `reset` | 5 | 60 min | `reset:<sha256(email)>` |

Origem do IP: `x-forwarded-for` (primeiro valor). Ausente ⇒ o escopo `login_ip` é
pulado; nunca vira chave `unknown` compartilhada, que faria todo mundo se
bloquear mutuamente.

## Integração em `login` (FR-005)

```
login(formData)
  ├─ consumeAttempt("login", email)      ← ANTES de tocar em users
  ├─ consumeAttempt("login_ip", ip)
  │    qualquer um negado → { ok: false, error: "MUITAS_TENTATIVAS", retryAfterSeconds }
  │                          + logAudit(null, "rate_limited", { scope, retryAfterSeconds })
  ├─ signIn(...)
  │    sucesso → clearAttempts("login", email); redirect(next)
  └─ falha  → { ok: false, error: "CREDENCIAIS_INVALIDAS" }
```

`ActionResult` ganha o erro `MUITAS_TENTATIVAS`. O formulário
(`entrar-form.tsx`) mostra quando tentar de novo em minutos — cenário 4 exige
"mensagem clara de quando tentar de novo".

**Cenário 6 (quem esqueceu a senha não é punido)**: `clearAttempts` no sucesso
garante que passar a janela e acertar a senha entra normalmente, sem resíduo de
contagem.

## Integração em `requestPasswordReset` (FR-006)

```
requestPasswordReset(formData)
  ├─ consumeAttempt("reset", email)
  │    negado → logAudit(null, "rate_limited", { scope: "reset" })
  │             return { ok: true }        ← MESMA resposta do caminho aceito
  └─ permitido → fluxo atual (consulta, token, e-mail)
                 return { ok: true }
```

**A resposta recusada é byte a byte igual à aceita.** Só muda que nenhum e-mail
sai. Isso preserva a propriedade já existente de não revelar se o endereço está
cadastrado — expor "muitas tentativas" aqui viraria um oráculo de existência de
conta.

## Auditoria (FR-007)

`AuditEvent` em `src/lib/audit.ts` ganha `"rate_limited"`. O `detail` carrega
`scope` e `retryAfterSeconds`. **Não carrega** o e-mail nem o hash — `login_failed`
já existe para correlacionar por usuário quando há usuário, e uma recusa por
limite pode ser de e-mail inexistente, caso em que não há `userId`. `userId` fica
`null` nesses eventos.

## Concorrência

O `UPSERT` de contagem é atômico:

```sql
INSERT INTO auth_attempts (key, window_start, count) VALUES ($1, now(), 1)
ON CONFLICT (key) DO UPDATE SET
  window_start = CASE WHEN now() - auth_attempts.window_start > $2::interval
                      THEN now() ELSE auth_attempts.window_start END,
  count        = CASE WHEN now() - auth_attempts.window_start > $2::interval
                      THEN 1 ELSE auth_attempts.count + 1 END
RETURNING count, window_start;
```

Uma ida ao banco por tentativa, sem transação explícita, sem leitura antes da
escrita — duas requisições simultâneas não conseguem gastar a mesma cota duas
vezes. A decisão de permitir usa o `count` retornado.
