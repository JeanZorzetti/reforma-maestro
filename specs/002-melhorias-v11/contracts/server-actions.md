# Contrato: Server Actions novas e alteradas

**Feature**: `002-melhorias-v11` | **Fase**: 1

Segue o contrato comum de 001 (`../001-web-app-obras/contracts/server-actions.md`):
entrada por `FormData` validada por Zod, retorno `ActionResult`, nenhum campo
derivado vindo do cliente, escopo por `requireUser()` e mutação paga barrada por
`requireFullAccess()`.

`ActionResult` ganha dois erros novos: `MUITAS_TENTATIVAS` e `STRIPE_INDISPONIVEL`.

---

## `src/server/actions/auth.ts`

### `login` — ALTERADA (FR-005)

Ver [rate-limit.md](./rate-limit.md). Assinatura inalterada.

### `requestPasswordReset` — ALTERADA (FR-006)

Ver [rate-limit.md](./rate-limit.md). Assinatura e resposta inalteradas.

### `deleteAccount` — ALTERADA (FR-009 a FR-012)

Já existe e já apaga em cascata. Passa a cancelar a assinatura no Stripe **antes**
de apagar, e a encerrar a sessão depois.

```
deleteAccount(formData: { senha })
  ├─ requireUser()                 → SESSAO_EXPIRADA
  ├─ bcrypt.compare(senha)         → SENHA_INCORRETA
  ├─ se subscriptions.stripe_subscription_id existe:
  │     stripe.subscriptions.cancel(id)
  │     falha → { ok: false, error: "STRIPE_INDISPONIVEL" }   ← ABORTA a exclusão
  ├─ DELETE FROM users WHERE id = ...          (cascata leva obras e lançamentos)
  ├─ logAudit(null, "account_deleted", {})     ← já anônimo hoje
  └─ signOut({ redirect: false })
```

**Ordem é o contrato.** Cancelar no Stripe primeiro e abortar se falhar é o que
impede uma assinatura órfã cobrando cliente que não existe mais — o edge case
"exclusão de conta com pagamento em trânsito". O inverso (apagar e depois
cancelar) deixa a falha sem dono: o registro que apontava para a assinatura já
sumiu. Pedir para tentar de novo é preferível a cobrar alguém que pediu para sair.

`stripe.subscriptions.cancel` é idempotente para assinatura já cancelada, então
retentar depois de uma falha parcial é seguro.

**FR-012**: `audit_log.user_id` é `ON DELETE SET NULL` e o `detail` já vai vazio.
Nenhum dado pessoal identificável sobrevive à exclusão.

**FR-011** é UI, não action: `conta-delete-dialog.tsx` avisa que a exportação é
irreversivelmente perdida e linka a exportação antes de habilitar o botão.

---

## `src/server/actions/obras.ts`

### `arquivarObra` / `desarquivarObra` — NOVAS (FR-026, FR-027, FR-028)

```
arquivarObra(formData: { obraId })
  ├─ requireUser()
  ├─ requireFullAccess()          ← arquivar é mutação; readonly não arquiva
  └─ UPDATE obras SET arquivada_em = now()
       WHERE id = $1 AND user_id = $2      ← escopo no WHERE, sempre
```

`desarquivarObra` é simétrica com `arquivada_em = NULL`. Nenhuma das duas toca
`subscriptions` — FR-028 é satisfeito por construção, e um teste de integração
fixa que `getAccess()` devolve o mesmo `tier` antes e depois de arquivar.

Dados e exportação permanecem intactos: a obra arquivada continua acessível pela
listagem `/app/obras/arquivadas` e pela rota de exportação.

### `criarObraExemplo` — NOVA (FR-014, FR-015)

Cria uma obra com `exemplo = true` e um punhado de lançamentos ilustrativos numa
transação. Idempotente por usuário: se já existe obra com `exemplo = true`, não
cria outra. Removível pela exclusão de obra que já existe hoje.

---

## `src/server/actions/lancamentos.ts`

### `criarLancamento` — ALTERADA (FR-016, FR-017, FR-018 a FR-022)

O schema Zod passa a aceitar data em `yyyy-MM-dd` (formato do `<input type="date">`
nativo e do tipo `date` do Postgres) em vez de `dd/MM/yyyy`, e ganha dois campos
opcionais:

| Campo | Regra |
|-------|-------|
| `parcelas` | inteiro, 2 a 60; ausente ⇒ lançamento avulso, comportamento atual |
| `periodicidade` | `mensal` \| `quinzenal` \| `semanal`; obrigatório se `parcelas` presente |

Com `parcelas` presente:

```
├─ distribuirParcelas(previstoCents, parcelas)   → number[] soma exata (FR-019)
├─ transação:
│    INSERT parcelamentos (obra_id, total_cents, parcelas, periodicidade)
│    INSERT lancamentos × N  (data deslocada pela periodicidade,
│                             previsto_cents = fatia, parcela_num = 1..N)
└─ revalidatePath do painel e da lista
```

O teto de 60 (FR-022) é validado no Zod **e** por `CHECK` no banco — o edge case
"parcelamento longo" não depende de a UI se comportar.

### `excluirSerieParcelamento` — NOVA (FR-021)

```
excluirSerieParcelamento(formData: { parcelamentoId })
  ├─ requireUser() + requireFullAccess()
  ├─ COUNT dos lançamentos da série, escopado por join em obras.user_id
  └─ transação: DELETE lancamentos WHERE parcelamento_id = $1
                DELETE parcelamentos WHERE id = $1
```

A contagem é devolvida para a UI confirmar **antes** ("isso vai remover 6
lançamentos"). Editar ou excluir uma parcela isolada (FR-020) usa as actions de
lançamento que já existem, sem nenhuma alteração — é por isso que a série é um
agrupamento e não um lançamento recorrente virtual.

---

## Leituras novas (Server Components, não actions)

| Query | Arquivo | FR |
|-------|---------|-----|
| `evolucaoConsumo(userId, obraId)` | `db/queries/painel.ts` | FR-023, FR-024, FR-025 |
| `listObrasArquivadas(userId)` | `db/queries/obras.ts` | FR-027 |
| `dadosRelatorio(userId, obraId)` | `db/queries/obras.ts` | FR-030 |

`dadosRelatorio` reusa as agregações do painel e `listLancamentosParaExport`, que
já existe sem `LIMIT`. Nenhuma consulta nova de agregação é escrita para o
relatório.

---

## Rotas novas

| Rota | Acesso | FR |
|------|--------|-----|
| `/app/comecar` | sessão | FR-013 |
| `/app/obras/arquivadas` | sessão | FR-027 |
| `/app/obras/[id]/relatorio` | sessão, **sem** `requireFullAccess` | FR-030, FR-031 |
| `/api/cron/watchdog` | `Bearer CRON_SECRET` | FR-003 |

O relatório segue a exportação: é direito sobre o próprio dado, liberado também
em `readonly` (Princípio VI). Todas as três páginas ficam sob o route group
`(app)`, herdando `noindex` e checagem de sessão — nenhuma rota pública é tocada
(Princípio II).

`signUp` passa a redirecionar para `/app/comecar` em vez de `/app/obras/nova`.
