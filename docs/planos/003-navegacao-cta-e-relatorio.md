# Navegação, CTA de assinatura e relatório como documento

> Plano de implementação — criado em 12/08/2026. Escopo: 5 correções de UX no app autenticado.

## Contexto

O app já está em produção (`orcaobra.roilabs.com.br`) e cinco problemas de uso apareceram:

1. **CTA errado na conta.** `src/app/(app)/app/conta/page.tsx:66` decide o botão por `sub?.stripeCustomerId`, não por status de acesso. Uma assinatura concedida direto no banco (`status='active'`, `access_until='2099-12-31'`, `stripe_customer_id NULL`) mostra "Assinatura: Ativa" **e** "Assinar agora". Pior: clicar cai em `/app/assinar`, que já faz `redirect("/app")` para acesso ativo — o botão é um beco sem saída.
2. **Filtros de lançamentos feios** — e quebrados. São `<Link>` crus com `font-semibold` vs `text-muted-foreground`. Além do visual, `filterUrl()` em `src/app/(app)/app/obras/[id]/lancamentos/page.tsx:54-63` faz `next.categoria ?? categoria`, então passar `undefined` para limpar **cai de volta no valor atual**: com `?categoria=material` ativo, "Todas as categorias" aponta para `?categoria=material`. Filtro não limpa.
3. **Não há navegação in-app.** O header do `(app)` só tem logo → `/app`, "Minha conta" e "Sair". Não existe `layout.tsx` sob `obras/[id]`; a única forma de circular entre Dashboard / Lançamentos / Relatório é a fileira de botões no topo do dashboard. Uma vez em Lançamentos, não há volta visível.
4. **"Entrar na obra deve abrir o dashboard".** Isso **já acontece** — `/app/obras/[id]/page.tsx` é o dashboard (`PainelObraPage`), e todos os caminhos de entrada (card em `/app`, criação de obra) apontam para lá. O problema real é rotulagem e retorno: a página se chama só pelo nome da obra e não há como voltar a ela. Resolve-se com a sidebar do item 3 + título explícito. **Nenhuma rota nova ou redirect.**
5. **Relatório ≈ Dashboard.** Os dois renderizam `PainelCards` + `GraficoCategorias`. O relatório só acrescenta a tabela de lançamentos.

Resultado esperado: navegação persistente por sidebar, CTA de assinatura coerente com o acesso real, filtros que funcionam e são legíveis, e um relatório que é um documento imprimível — não uma segunda cópia do dashboard.

**Decisões confirmadas:** relatório vira documento imprimível; sidebar global com seção contextual da obra; filtros como pills agrupadas.

---

## 1. CTA de assinatura (`Assinar agora`)

**Causa raiz:** a decisão está duplicada em dois lugares com regras diferentes. `/app/assinar` usa `access.tier === "full" && access.status === "active"`; a conta usa `stripeCustomerId`. Unifica-se numa função só.

- `src/lib/access.ts` — nova função ao lado de `getAccess()`:
  ```ts
  /** `false` quando o acesso já é uma assinatura ativa — não oferecer checkout. */
  export function precisaAssinar(access: Access): boolean {
    return !(access.tier === "full" && access.status === "active");
  }
  ```
- `src/app/(app)/app/conta/page.tsx` — trocar o `db.select()` cru por `getAccess(session.user.id)` (mantendo a leitura de `sub` só para `stripeCustomerId`), e a ternária vira:
  - tem `stripeCustomerId` → "Gerenciar assinatura" (portal Stripe, como hoje);
  - senão, `precisaAssinar(access)` → "Assinar agora";
  - senão (ativo sem Stripe = concessão manual) → nada, apenas o texto "Assinatura: Ativa / Acesso até".
- `src/app/(app)/app/assinar/page.tsx` — trocar o literal do guard por `if (!precisaAssinar(access)) redirect("/app")`.
- `tests/unit/access.test.ts` — estender a tabela-verdade existente com `precisaAssinar`: `active` + futuro → `false`; `trialing` → `true`; `past_due`/`expired`/`canceled` vencido → `true`.

## 2. Filtros dos lançamentos — pills + correção do clear

**Extrair a URL para poder testá-la.** Novo `src/lib/lancamentos-url.ts`:

```ts
export interface FiltroLancamentos { categoria?: string; status?: string; page?: number }
/** `null` limpa o filtro; `undefined` mantém o atual. */
export function lancamentosUrl(obraId: string, atual: FiltroLancamentos, next: {...}): string
```

Regra que corrige o bug: `next.categoria === undefined ? atual.categoria : next.categoria` (presença explícita da chave), no lugar de `??`. Os links de "Todas as categorias"/"Todos" passam `null`.

Novo `tests/unit/lancamentos-url.test.ts` — cobre: limpar categoria com filtro ativo; manter status ao trocar categoria; `page` omitido quando `1`.

**Visual (pills, dois grupos rotulados).** Reaproveitar `buttonVariants` de `src/components/ui/button.tsx` + `cn()` — nenhum componente novo, os links continuam `<Link>` server-rendered (sem JS, sem client component):

```
Categoria:  (Todas) ( Material ) ( Mão de Obra ) ( Taxas ) ( Mobília )
Status:     (Todos)  ( Pago )     ( Pendente )
```

Ativo → `buttonVariants({ size: "sm" })` (sólido); inativo → `buttonVariants({ variant: "outline", size: "sm" })`. Rótulo do grupo em `text-xs text-muted-foreground` à esquerda, `flex-wrap` para caber no mobile.

**Na mesma tela:** `Paginacao` usa `<Button asChild disabled>`, que renderiza um `Slot` → o `disabled` cai num `<span>` e não faz nada (React ainda avisa sobre prop não-booleana). Trocar por `aria-disabled` + classe muted em `src/components/app/paginacao.tsx`. Uma linha, corrige visual e acessibilidade.

## 3 + 4. Sidebar global com seção da obra

O shadcn `src/components/ui/sidebar.tsx` **já está instalado e não é usado** — nada de dependência nova.

- **Novo `src/components/app/app-sidebar.tsx`** (`"use client"`): recebe `obras: {id, nome}[]` do layout, lê `usePathname()` para marcar o item ativo e para extrair o `obraId` de `/app/obras/<id>`; acha o nome na lista recebida. Estrutura:
  - `SidebarHeader`: `LogoMark` + "Reforma Maestro" → `/app`
  - Grupo **Obras**: Obras (`/app`), Nova obra, Arquivadas
  - Grupo contextual (só quando há `obraId`), rotulado com o nome da obra: **Dashboard** (primeiro item, `/app/obras/[id]`), Lançamentos, Relatório, Editar, Exportar CSV (`<a>` para a rota de API)
  - `SidebarFooter`: Minha conta + `<form action={signOutAction}>` (server action importável em client component, como já é feito hoje no layout)

```
┌──────────────────┬────────────────────┐
│ 🏠 Reforma       │                    │
│                  │   Dashboard        │
│ Obras            │   [cards]          │
│ + Nova obra      │   [gráficos]       │
│ Arquivadas       │                    │
│                  │                    │
│ ── CASA VILA ──  │                    │
│ ▸ Dashboard      │                    │
│   Lançamentos    │                    │
│   Relatório      │                    │
│   Editar         │                    │
│                  │                    │
│ Minha conta      │                    │
│ Sair             │                    │
└──────────────────┴────────────────────┘
```

- **`src/app/(app)/layout.tsx`**: envolver em `SidebarProvider` + `AppSidebar` + `SidebarInset`; manter `BannerAcesso` e o `<main>`. O header vira uma barra fina só com `SidebarTrigger` (mobile) — "Minha conta"/"Sair" migram para o rodapé da sidebar. Buscar `listObras(session.user.id)` (`src/db/queries/obras.ts`) para alimentar a sidebar. `print:hidden` na sidebar e no trigger — o relatório imprime sem a navegação.
- **`src/app/(app)/app/obras/[id]/page.tsx`**: título vira `Dashboard — {obra.nome}`. A fileira de botões some (Editar / Lançamentos / Relatório / Exportar agora vivem na sidebar), sobrando só **Novo lançamento** (ação primária) e `ObraArchiveButton`.
- Item 4 fica atendido por construção: a rota já entra no dashboard, e agora ele é nomeado e alcançável de qualquer subpágina.

> Custo aceito: `listObras` passa a rodar em toda página do `/app` (hoje roda em `/app` e `/app/conta`). Query pequena e indexada por `user_id`. Se pesar, cachear com `unstable_cache` por usuário.

## 5. Relatório vira documento imprimível

Diferenciação: **Dashboard = tela viva (cards + gráficos + evolução). Relatório = documento (tabelas + período + impressão).**

```
RELATÓRIO — Casa Vila Mariana
Período: 01/01/2026 – 12/08/2026   [Imprimir]

RESUMO POR CATEGORIA
 Categoria     Previsto     Pago    Difer.   % teto
 Material      6.000,00  1.100,00  -4.900     12%
 Mão de Obra   3.000,00  3.000,00       0      6%
 ---------------------------------------------
 TOTAL         9.000,00  4.100,00  -4.900     18%

LANÇAMENTOS (2)
 12/09  Material  Teste   600,00     0,00  Pendente
 12/08  Material  Teste   600,00  1.100,00 Pago
```

- **`src/app/(app)/app/obras/[id]/relatorio/page.tsx`** — remover `PainelCards` e `GraficoCategorias`. Passa a ser:
  1. Cabeçalho: nome da obra, período aplicado, data de geração, orçamento teto, e o `PrintButton` (`print:hidden`). `AlertaEstouro` fica.
  2. **Filtro de período**: `<form method="get">` com dois `<input type="date" name="de|ate">` nativos e um submit. Sem client component, sem lib de calendário.
  3. **Resumo por categoria** (tabela, o diferencial vs. dashboard): Categoria | Previsto | Pago | Diferença | % do teto, com linha TOTAL. Todos os números derivam de `porCategoria` + `obra.orcamentoTetoCents` — nenhuma agregação nova.
  4. **Lançamentos**: tabela atual + coluna **Status** (reusar `statusLancamento` de `src/lib/calc.ts`), mantendo a densidade `py-1` e o alinhamento à direita do dinheiro.
- **Novo `src/components/app/print-button.tsx`** (`"use client"`): `<Button onClick={() => window.print()}>Imprimir / PDF</Button>`.
- **Período nas queries** — parâmetro opcional `{ de?: string; ate?: string }` (datas ISO), aplicado como `and(gte(data, de), lte(data, ate))`:
  - `src/db/queries/painel.ts` → `getPainelTotais`, `getPainelPorCategoria`
  - `src/db/queries/lancamentos.ts` → `listLancamentosParaExport`
  - `src/db/queries/obras.ts` → `dadosRelatorio(userId, obraId, periodo?)` repassa aos três
  - Parâmetro opcional ⇒ os chamadores existentes (dashboard, `/api/obras/[id]/export`) não mudam. Datas inválidas/malformadas são ignoradas (tratadas como ausentes) antes de chegar ao SQL.
- Manter o comentário que documenta a ausência de `requireFullAccess()` (FR-030/031: direito sobre o próprio dado vale em `readonly`).

---

## Arquivos tocados

**Novos**
- `src/components/app/app-sidebar.tsx`
- `src/components/app/print-button.tsx`
- `src/lib/lancamentos-url.ts`
- `tests/unit/lancamentos-url.test.ts`

**Modificados**
- `src/app/(app)/layout.tsx`
- `src/app/(app)/app/conta/page.tsx`
- `src/app/(app)/app/assinar/page.tsx`
- `src/app/(app)/app/obras/[id]/page.tsx`
- `src/app/(app)/app/obras/[id]/lancamentos/page.tsx`
- `src/app/(app)/app/obras/[id]/relatorio/page.tsx`
- `src/components/app/paginacao.tsx`
- `src/lib/access.ts`
- `src/db/queries/painel.ts`
- `src/db/queries/lancamentos.ts`
- `src/db/queries/obras.ts`
- `tests/unit/access.test.ts`

**Sem migração de banco.**

---

## Verificação

```bash
cd frontend-next
npm run test        # unit + integration (vitest)
npm run lint
npm run build       # pega erro de RSC/client boundary da sidebar
npm run dev
```

Manualmente em `localhost:3000`:

1. **CTA**: entrar com a conta de acesso vitalício (`access_until` 2099, sem `stripe_customer_id`) → `/app/conta` mostra "Assinatura: Ativa" e **nenhum** botão de assinar. Com uma conta em `trialing` → "Assinar agora" aparece. Com `stripe_customer_id` preenchido → "Gerenciar assinatura" abre o portal.
2. **Filtros**: em `/app/obras/<id>/lancamentos`, clicar "Material" → voltar em "Todas as categorias" e conferir que a lista volta ao completo e a URL perde `categoria`. Clicar "Pago" com categoria ativa → mantém a categoria. Paginação: com 1 página só, "Anterior"/"Próxima" devem aparecer apagados e não navegar.
3. **Sidebar**: navegar Dashboard → Lançamentos → Relatório sem usar o botão voltar do browser; item ativo destacado; a seção da obra some em `/app` e `/app/conta`; testar recolher/expandir e o modo mobile (`SidebarTrigger`).
4. **Dashboard**: entrar por um card em `/app` → cai no dashboard com título "Dashboard — <obra>".
5. **Relatório**: aplicar um período que exclua um lançamento e conferir que ele sai da tabela **e** dos totais por categoria; conferir que a linha TOTAL bate com a soma das categorias; Ctrl+P (ou o botão) mostra o preview sem sidebar, sem header e sem o formulário de período.
