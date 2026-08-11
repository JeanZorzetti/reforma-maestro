# Contrato: Server Actions

**Feature**: `001-web-app-obras` | **Fase**: 1

Toda mutação de dado do usuário é Server Action em
`frontend-next/src/server/actions/`. Leitura é feita direto em Server Component
pelas queries de `src/db/queries/`, não por action.

## Contrato comum

**Entrada**: `FormData` validado por schema Zod. Nenhuma action confia em campo
derivado vindo do cliente (`status`, `diferenca`, totais, `tier`).

**Saída** (discriminada, nunca `throw` para erro esperado):
```ts
type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fields?: Record<string, string> }
```

**Guardas, nesta ordem, em toda action**:
1. `requireUser()` → sessão válida no servidor; sem sessão ⇒
   `{ ok: false, error: 'SESSAO_EXPIRADA' }` e o cliente redireciona para
   `/entrar?next=<rota>`. O formulário de lançamento salva rascunho em
   `sessionStorage` a cada mudança e o restaura ao voltar autenticado — é o que
   fecha o edge case "sessão expira no meio do preenchimento". Nenhum outro
   formulário preserva estado.
2. `requireFullAccess()` → `tier === 'full'` lido de `subscriptions` (FR-019);
   caso contrário `{ ok: false, error: 'ACESSO_SOMENTE_LEITURA' }` + registro
   `access_denied` em `audit_log`. **Não** se aplica às actions de conta e
   assinatura.
3. Escopo: todo `WHERE` inclui `user_id = session.user.id` (FR-029). Recurso de
   outro usuário retorna `NAO_ENCONTRADO` — nunca `SEM_PERMISSAO`, que
   confirmaria a existência do recurso.

**Revalidação**: toda mutação bem-sucedida chama `revalidatePath` da rota da obra
afetada, garantindo que painel e lista reflitam a mudança imediatamente
(FR-011).

---

## Autenticação e conta

### `signUp(formData)`
`{ email: string, senha: string, nome?: string }` → `ActionResult<{ userId }>`

Sem guarda de sessão nem de acesso. Em uma única transação:
normaliza o e-mail, cria `users` com bcrypt(12), grava `trial_grants` e cria
`subscriptions`. `trial_grants` já existente ⇒ assinatura nasce `expired`
(FR-025c). Senha mínima de 8 caracteres. E-mail duplicado ⇒
`fields.email = 'Este e-mail já possui conta.'`. Em caso de sucesso a action
**cria a sessão** (`signIn` com as mesmas credenciais, sem novo formulário) e
redireciona para o cadastro da primeira obra (US1-1).

### `requestPasswordReset(formData)` · `resetPassword(formData)`
FR-002. `requestPasswordReset` responde `ok: true` **sempre**, exista o e-mail ou
não (não enumera contas). `resetPassword` consome o token de uso único, troca o
hash, invalida todas as `sessions` do usuário e registra `password_reset`.

### `signOut()`
FR-003. Apaga a linha de `sessions` e registra `logout`.

**Expiração de sessão** (FR-003): `maxAge` de 30 dias e `updateAge` de 24 h na
config do Auth.js — sessão sem uso por 30 dias expira sozinha, e a renovação só
grava no banco uma vez por dia. Login bem-sucedido registra `login`; tentativa
falha registra `login_failed` (FR-030).

### `deleteAccount(formData)`
FR-028. Exige reconfirmação da senha. `DELETE FROM users` cascateando; grava
`account_deleted` em `audit_log` (que sobrevive com `user_id = NULL`) e
`trial_grants` permanece.

---

## Obras

| Action | Entrada | Saída |
|--------|---------|-------|
| `createObra` | `{ nome, orcamentoTeto, reservaPct }` | `ActionResult<{ obraId }>` |
| `updateObra` | `{ obraId, nome, orcamentoTeto, reservaPct }` | `ActionResult` |
| `archiveObra` | `{ obraId, arquivar: boolean }` | `ActionResult` |
| `deleteObra` | `{ obraId, confirmacao: string }` | `ActionResult` |

`orcamentoTeto` e `reservaPct` chegam como string em formato pt-BR
(`"85.000,00"`, `"10"`) e são convertidos a centavos / `numeric` por parser
testado antes de qualquer validação.

Validações (FR-005), com as mesmas mensagens do `data-model.md`:
`orcamentoTeto > 0`; `0 <= reservaPct <= 100`; `nome` de 1 a 120 caracteres.

`updateObra` não recalcula nada persistido — os indicadores são derivados na
leitura (FR-006). `deleteObra` exige `confirmacao` igual ao nome da obra e
informa antes quantos lançamentos serão apagados.

---

## Lançamentos

| Action | Entrada | Saída |
|--------|---------|-------|
| `createLancamento` | `{ obraId, data, categoria, item, fornecedor?, previsto, pago? }` | `ActionResult<{ lancamentoId }>` |
| `updateLancamento` | `{ lancamentoId, ...mesmos campos }` | `ActionResult` |
| `deleteLancamento` | `{ lancamentoId }` | `ActionResult` |

- `data` em `dd/MM/yyyy`; data futura é aceita (edge case).
- `categoria` restrita ao enum `material | mao_de_obra | taxas | mobilia`
  (FR-009); valor fora do enum é erro de validação, não coerção.
- `previsto >= 0`, `pago >= 0`; `pago > previsto` é **aceito** (estouro no item).
- `status` e `diferenca` **não são aceitos como entrada** — se vierem no
  `FormData`, são ignorados (FR-010).
- Em `updateLancamento` e `deleteLancamento` o escopo é verificado por join:
  `lancamentos.obra_id → obras.user_id = session.user.id` (FR-029).

---

## Assinatura

Ambas ignoram `requireFullAccess` — quem está em `readonly` precisa justamente
delas.

### `createCheckoutSession()`
`ActionResult<{ url: string }>` — cria (ou reusa) o Stripe Customer, abre
Checkout Session em modo `subscription` com `client_reference_id = user.id`
(R6) e devolve a URL para redirecionamento. Não altera `subscriptions`: só o
webhook escreve estado de acesso (FR-018, FR-019).

**Preserva os dias de trial restantes**: quando `status === 'trialing'` e
`access_until > now()`, a session leva `subscription_data.trial_end =
access_until` (R2). O Stripe só cobra no fim do trial, e o primeiro
`current_period_end` já parte dali — nada de perder nem duplicar dias.

### `createPortalSession()`
`ActionResult<{ url: string }>` — Stripe Customer Portal para consultar a
assinatura e cancelar sem suporte (FR-024). Sem `stripe_customer_id` ⇒
`{ ok: false, error: 'SEM_ASSINATURA' }`.
