# Reescrita da página /sobre + correções globais das páginas públicas

> Plano de implementação — criado em 12/08/2026. Escopo: reescrever `/sobre` sobre fatos verificáveis e corrigir dois bugs que afetam todas as páginas públicas.

## Contexto

A `/sobre` existe por um motivo de negócio específico: **E-E-A-T**, o sinal de autoridade que sustenta o SEO como canal primário de aquisição (Princípio II da constitution, §7 do `VISAO-GERAL-DO-PROJETO.md`). Hoje ela faz o oposto disso.

O que a investigação encontrou:

1. **O conteúdo é ficção.** A seção "A História Real" narra Maria Eduarda reformando o próprio apartamento, o Excel que desmoronou, o pedreiro pedindo adiantamento, as notas perdidas no WhatsApp. Confirmado com o usuário: **essa história não aconteceu.** Uma página de autoridade construída sobre um relato inventado é o pior resultado possível — se o leitor desconfia, perde-se mais do que se a página não existisse.
2. **Schema.org com dado fabricado.** `page.tsx:23` publica um `sameAs` de LinkedIn com o comentário `// Placeholder, good for SEO even if generic`. É uma URL inventada num `ProfilePage` de pessoa real. O mesmo padrão se repete no schema global (`schema-markup.tsx`): Instagram placeholder e dois caminhos de imagem que não existem em `public/`.
3. **Prova social inventada e autocontraditória.** A `/sobre` diz "centenas de proprietários"; a home (`Reviews.tsx:32`) diz "mais de 120". Nenhum dos dois é verificável.
4. **Sem `<h1>`.** A página abre em `<h2>A História Real`. Todas as outras públicas (`/privacidade`, `/blog`, `/blog/[slug]`, home via `Hero`) têm h1. Falha de SEO e de acessibilidade, justamente na página cuja função é ranquear.
5. **Sem rodapé — em todas as públicas.** `<Footer />` está dentro de `(public)/page.tsx`, não num layout. Logo `/sobre`, `/privacidade` e `/blog` terminam no vazio. Não existe `(public)/layout.tsx`.
6. **Canonical global errado.** `src/app/layout.tsx:23` declara `alternates: { canonical: '/' }` no root. Metadata do App Router é herdada por toda rota que não sobrescreva — e **nenhuma sobrescreve** (o grep por `canonical` retorna só essa linha). Resultado: `/sobre`, `/privacidade`, `/blog` e todos os artigos dizem ao Google que são duplicatas da home. É o bug mais caro da lista.

**Decisões confirmadas com o usuário:** reescrever o conteúdo do zero (não há história a preservar); remover o claim numérico em vez de inventar outro; remover o LinkedIn falso; **sem pessoa em destaque** — a página fala do produto e da ROI Labs; **contar a evolução real** (planilha Google Sheets → web app); corrigir rodapé e canonical globalmente.

**Resultado esperado:** uma `/sobre` cuja autoridade vem de precisão, não de narrativa — incluindo o que o produto explicitamente *não* faz — e as quatro páginas públicas com rodapé e canonical corretos.

---

## Fonte da verdade do conteúdo

Todo texto novo sai de `docs/VISAO-GERAL-DO-PROJETO.md`. **Nada além disso pode ser afirmado na página.** Os fatos disponíveis:

| Tema | Fato (§ do doc) |
|---|---|
| Recorte | "A dor não é gerenciar uma obra — isso é problema do engenheiro/construtora — é fluxo de caixa pessoal durante um projeto de gasto imprevisível e prolongado" (§2) |
| ICP | Pessoa física, dona do imóvel, reforma/construção residencial. Não é construtora nem profissional de engenharia. Uso majoritário no celular durante a obra (§3) |
| Funções | Obras com orçamento teto e % de fundo de reserva; lançamentos por categoria (Material/Mão de Obra/Taxas/Mobília) com previsto, pago e status; painel com saldo, % consumido, alerta de estouro e gráfico; exportação CSV (§4) |
| Não faz | Sem integração SINAPI, sem ERP de obra, sem multiusuário, sem fluxo de aprovação (§3) |
| Origem | Era uma planilha Google Sheets provisionada manualmente por script; virou web app com Postgres, conta, múltiplas obras e assinatura (§1, §6) |
| Compromissos | Cálculo financeiro sempre no servidor (§4); CSV disponível mesmo com assinatura cancelada ou vencida (§4); expiração degrada para leitura + exportação, nunca perda de dados (§5); trial de 14 dias sem cartão (§1) |
| Comercial | R$ 47,90/mês via Stripe (§1) |
| Responsável | ROI Labs — `suporte@roilabs.com.br` (`schema-markup.tsx:13`) |

> **Ponto de atenção:** dizer "não integra com SINAPI" na `/sobre` entra em tensão com o blog, que ainda usa SINAPI como isca (`public/images/tabela-sinapi-excel.png`). O próprio doc já classifica isso como débito de conteúdo (§9) e chama a menção de "apenas ilustrativa". A recomendação é assumir a honestidade na `/sobre`; se preferir evitar a tensão agora, corte só essa linha da seção "O que não é" — o resto se sustenta.

---

## 1. Nova `/sobre`

Arquivo: `src/app/(public)/sobre/page.tsx` — **substituição integral**.

Reaproveita o que já existe: `Card`/`CardContent` (`components/ui/card.tsx`), `Button` com `variant="cta"` e `size="xl"` (ambos existem em `button.tsx:18,25`), ícones `lucide-react`, e as classes de layout já usadas nas públicas (`container mx-auto px-4`, `py-16`/`py-20`, `prose prose-lg dark:prose-invert`, `bg-muted/30`). **Nenhum componente novo, nenhuma dependência nova, nenhum asset novo.**

Sequência de seções:

1. **Hero da página (`<h1>`)** — corrige o furo estrutural. Fundo `bg-gradient-to-br from-primary/5 via-background to-accent/5` (o mesmo de `Pricing.tsx:8` — não repete a imagem pesada do hero da home).
   - h1: *"Controle do dinheiro da sua obra — não do cronograma dela"*
   - lead: o recorte do §2, em uma frase.

2. **O recorte** (`prose`, fundo neutro) — dois a três parágrafos: por que o problema é fluxo de caixa pessoal e não gestão de obra; por que Previsto vs. Realizado por categoria é o que antecipa o estouro; para quem é (§3, incluindo o uso no celular durante a obra).

3. **O que o app faz** — grid `md:grid-cols-2` de 4 `Card`s, um por linha da tabela do §4 (Obras / Lançamentos / Painel / Exportação), ícones `Building2`, `Receipt`, `PieChart`, `Download`. Texto descritivo, sem adjetivo de venda.

4. **O que o Reforma Maestro não é** — a seção que mais gera confiança, e a que substitui funcionalmente a história inventada. Lista com `X` em `text-muted-foreground`: não é ERP de construção; não faz quantitativo nem orçamento de engenharia; não integra com tabela SINAPI; não tem multiusuário nem fluxo de aprovação; não substitui engenheiro ou arquiteto.

5. **De planilha a aplicativo** (`prose`) — a origem verdadeira, curta: começou como planilha Google Sheets entregue manualmente; a planilha não persistia dados entre obras, não tinha conta e dependia de provisionamento manual; virou web app com banco, login e assinatura. Fecha explicando por que o produto é focado em dinheiro — é o que a planilha já fazia bem e o que o dono da obra realmente precisa.

6. **Compromissos** — 5 itens com `CheckCircle2` (já importado hoje), todos verificáveis: cálculo financeiro no servidor; CSV a qualquer momento, inclusive com assinatura vencida; expiração vira somente leitura, nunca perda de dados; 14 dias sem cartão; exclusão de conta a pedido — com link para `/privacidade`, que já documenta isso em detalhe.

7. **Quem mantém** — bloco curto: ROI Labs, contato `suporte@roilabs.com.br`. Substitui o card de bio com as iniciais "MZ".

8. **CTA** — **sem claim numérico**. "Teste grátis por 14 dias. Sem cartão de crédito." → `<Link href="/#pricing">`, mantendo o destino que Header e Hero já usam (`Pricing.tsx:8` tem o `id="pricing"`).

**Metadata da página:**
```ts
export const metadata: Metadata = {
  title: "Sobre o Reforma Maestro | O que é, para quem é e o que não faz",
  description: "Controle financeiro de obras e reformas residenciais para pessoa física...",
  alternates: { canonical: "/sobre" },   // ← canonical próprio (ver §3)
};
```

**Schema:** o `ProfilePage`/`Person` deixa de fazer sentido sem pessoa na página. Vira `AboutPage` cujo `mainEntity` referencia a Organization já emitida globalmente, via `@id` — sem duplicar a entidade e **sem nenhum `sameAs` inventado**:
```ts
{ "@type": "AboutPage", "mainEntity": { "@id": "https://orcaobra.roilabs.com.br/#organization" } }
```

## 2. Rodapé nas páginas públicas

Causa raiz: o `<Footer />` mora na home, não num layout. Um arquivo resolve as quatro páginas — menor que adicionar o import em cada uma.

- **Novo `src/app/(public)/layout.tsx`**: renderiza `{children}` + `<Footer />`. Não toca no `Header`, que já vem do root layout e se auto-oculta em `/app` (`Header.tsx:16`).
- **`src/app/(public)/page.tsx`**: remover `<Footer />` e o import — senão a home renderiza dois.
- O grupo `(app)` não é afetado: layouts de route group são isolados.

## 3. Canonical

Causa raiz: **uma linha errada no root**, não canonical faltando em quatro páginas.

- **`src/app/layout.tsx:23`**: **remover** `alternates: { canonical: '/' }`. Sem essa herança, cada rota se auto-canonicaliza — comportamento correto por padrão do Google.
- **`src/app/(public)/sobre/page.tsx`**: declarar `alternates: { canonical: "/sobre" }` (§1).
- `metadataBase` continua no root e segue resolvendo os caminhos relativos.

> `/privacidade` e `/blog` param de apontar para a home só com a remoção, sem edição. `blog/[slug]` **não tem `generateMetadata`** — herda até o `title` do root. Corrigir isso é uma tarefa própria (título e description por artigo), fora deste escopo; anotar como próximo item.

## 4. Imagem OG da `/sobre`

`src/app/(public)/sobre/opengraph-image.tsx` anuncia a história fictícia ("Como Maria Eduarda Zorzetti criou o Reforma Maestro"). Reescrever `alt`, `title` e `description` na mesma chamada `ogImage({ eyebrow, title, description })` já usada, alinhados à nova página.

## 5. Placeholders fabricados no schema global *(opcional — mesma classe de bug)*

`src/components/schema-markup.tsx` repete o padrão que originou o LinkedIn falso, e afeta **todas** as páginas:

- `sameAs: ["https://www.instagram.com/reforma.maestro"]` marcado `// Placeholder` → remover (ou substituir por perfis reais, se existirem).
- `logo: ".../images/logo.png"` e `image: [".../images/hero-dashboard.png"]` → **nenhum dos dois existe**; `public/images/` tem só quatro PNGs de artigos. Apontar para `/og.png`, que existe.
- Adicionar `"@id": "https://orcaobra.roilabs.com.br/#organization"` na Organization, para o `AboutPage` do §1 referenciar.

Corta-se esta seção inteira sem afetar as anteriores, exceto pelo `@id` (necessário para o schema da `/sobre`).

---

## Arquivos tocados

**Novos**
- `src/app/(public)/layout.tsx`

**Modificados**
- `src/app/(public)/sobre/page.tsx` *(reescrita integral)*
- `src/app/(public)/sobre/opengraph-image.tsx`
- `src/app/(public)/page.tsx` *(remove o Footer duplicado)*
- `src/app/layout.tsx` *(remove o canonical global)*
- `src/components/schema-markup.tsx` *(§5, opcional)*

**Sem migração de banco. Sem dependência nova. Sem asset novo.**

---

## Fora de escopo (anotado para depois)

- `Reviews.tsx:32` — "mais de 120 proprietários" e os três depoimentos nominais na home têm o mesmo problema de verificabilidade que acabamos de remover da `/sobre`.
- `blog/[slug]` sem `generateMetadata` — todos os artigos herdam título e description da home.
- CTA do artigo citando "Gestor Financeiro de Obras 1.0" e os artigos que ainda vendem "planilha" (débito já registrado no §9 do doc).

---

## Verificação

```bash
cd frontend-next
npm run build      # pega erro de metadata/RSC e valida o novo layout do route group
npm run lint
npm test           # 55 testes existentes devem seguir verdes (nenhum cobre páginas públicas)
npm run dev
```

Em `localhost:3000`:

1. **h1**: `/sobre` tem exatamente um `<h1>` (DevTools → `document.querySelectorAll('h1').length === 1`).
2. **Rodapé**: aparece em `/`, `/sobre`, `/privacidade` e `/blog` — e **uma vez só** na home (`document.querySelectorAll('footer').length === 1`).
3. **Canonical**: `document.querySelector('link[rel=canonical]')` → `/sobre` aponta para `https://orcaobra.roilabs.com.br/sobre`; `/blog` e `/privacidade` não apontam mais para a home.
4. **Schema**: colar o HTML de `/sobre` no [Rich Results Test](https://search.google.com/test/rich-results) — `AboutPage` válido, Organization sem `sameAs` inventado, e **zero** ocorrência de `linkedin` no fonte (`view-source` + Ctrl+F).
5. **Conteúdo**: `grep -ri "centenas\|Maria Eduarda\|apartamento\|pedreiro" src/app/\(public\)/sobre/` deve voltar vazio.
6. **Responsivo**: a 375px de largura, os cards do §1.3 empilham e o CTA não estoura a viewport.
7. **CTA**: clicar "Teste grátis por 14 dias" rola até a seção de preços da home.
