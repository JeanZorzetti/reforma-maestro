# Reforma Maestro — Visão Geral do Projeto

**Documento técnico e executivo** · Última atualização: 11/08/2026

---

## 1. Sumário executivo

O **Reforma Maestro** não é um SaaS com backend próprio — é o **site de vendas (landing page)** de um produto digital chamado **"Gestor Financeiro de Obras 1.0"**: uma planilha Google Sheets pronta para uso, vendida por **R$ 47,90** em pagamento único ("acesso vitalício"), com checkout processado 100% pela **Kiwify**.

O produto ajuda uma pessoa física leiga — sem conhecimento técnico de construção civil ou de planilhas — a não perder o controle do orçamento durante uma reforma ou obra residencial. O código deste repositório existe para **converter visitante em comprador**: página institucional, blog de SEO e scripts administrativos que geram a planilha entregue ao cliente.

Projeto jovem: histórico de git com apenas 5 commits, todos entre 29 e 31/07/2026, focados em ajustes de SEO/domínio. O código da landing page em si já nasceu pronto (provavelmente gerado via Lovable) e só passou a ser versionado nesta fase final de lançamento.

---

## 2. A dor que resolve

Reformas residenciais estouram orçamento com frequência porque o controle financeiro de quem contrata é informal: anotações soltas, WhatsApp com fornecedores, memória. Sem comparar **Previsto vs. Realizado** por categoria (Material, Mão de Obra, Taxas, Mobília), o dono da obra só percebe o estouro quando já é tarde — e não tem visibilidade de quanto do orçamento já foi consumido nem de para onde o dinheiro está indo.

A dor não é "gerenciar uma obra" (isso é problema do engenheiro/construtora) — é **fluxo de caixa pessoal durante um projeto de gasto imprevisível e prolongado**, para alguém que não usaria (ou não sabe montar) uma ferramenta de gestão de projetos ou um ERP de construção.

## 3. A quem se destina

**Perfil do cliente (ICP):** pessoa física, dona de imóvel, executando reforma ou construção residencial — não é construtora, não é profissional de engenharia/arquitetura. Já é usuária básica de planilhas (Excel/Google Sheets), mas não sabe construir uma do zero com fórmulas, validações e dashboard.

Não é um produto para o mercado B2B de construção civil (não há e nunca houve indício de integração com tabela SINAPI real, ERPs de obra, ou fluxos multiusuário/aprovação — a menção a SINAPI no marketing é apenas textual).

## 4. O que o produto faz

A entrega ao cliente é uma planilha com três abas:

| Aba | Função |
|---|---|
| `CONFIG` | Orçamento teto da obra e % de fundo de reserva |
| `DB_LANCAMENTOS` | Registro de gastos: Data, Categoria (validada: Material / Mão de Obra / Taxas / Mobília), Item, Fornecedor, Valor Previsto, Valor Pago — com cálculo automático de Status (Pago/Pendente) e Diferença |
| `DASHBOARD` | Totais, saldo restante, % do orçamento utilizado, gráfico de pizza por categoria, formatação condicional (vermelho ao estourar o previsto) |

Isso é descrito em detalhe no manual entregue ao comprador (`INSTRUCOES_RAPIDAS.md`).

## 5. Como funciona — jornada do cliente

1. Visitante chega ao site (orgânico via blog/SEO, ou tráfego pago/direto) em `orcaobra.roilabs.com.br`.
2. Landing page apresenta o problema (estouro de orçamento), a solução ("Metodologia Cash-First") e prova social (depoimentos, FAQ).
3. CTA leva a um link de checkout hospedado na **Kiwify** — não há integração de API/webhook no código; é um link direto configurado em `frontend-next/src/components/Pricing.tsx`.
4. Pagamento aprovado → entrega da planilha é responsabilidade da Kiwify (fora do escopo deste código).
5. A planilha-produto em si é provisionada **manualmente pelo desenvolvedor**, fora do runtime do site, via scripts Node que usam a Google Sheets API com uma Service Account (`frontend-next/scripts/create-spreadsheet.ts`, `populate-spreadsheet.ts`).

## 6. Como funciona — arquitetura técnica

Sem backend, sem banco de dados, sem autenticação. Dois frontends coexistem no repositório:

- **`frontend-next/`** — versão em produção. Next.js 16 (App Router) + React 19 + TypeScript, Tailwind + shadcn/ui, hospedado na Vercel. Contém:
  - `app/` — home, blog (`blog/[slug]`), `/sobre`, `sitemap.ts`/`robots.ts` dinâmicos
  - `components/` — seções da landing (Hero, Problem, Solution, Authority, Reviews, FAQ, Pricing, Header, Footer) + `schema-markup.tsx` (JSON-LD: Organization, Product com rating agregado)
  - `data/blog-posts.ts` — os 4 artigos do blog embutidos como array TypeScript (sem CMS)
  - `scripts/` — ferramentas administrativas offline (Google Sheets API) para gerar a planilha-produto
- **`frontend/`** — versão anterior gerada via Lovable (Vite + React 18 + bun), mesma landing sem blog nem rotas dinâmicas. Provavelmente o protótipo que precedeu a migração para Next.js.

Integrações externas: Kiwify (checkout), Google Sheets/Drive API (fulfillment manual do produto), Google Analytics 4, Google Search Console. Nenhuma integração SINAPI real, nenhum backend próprio.

## 7. Por que existe / racional de negócio

Modelo de **infoproduto de baixo ticket com alta escalabilidade**: custo marginal por venda é praticamente zero (planilha + link de pagamento), o que justifica o investimento pesado em SEO (blog com 4 artigos, schema markup, sitemap, `/sobre` para E-E-A-T) como canal de aquisição orgânica de longo prazo — visível em `roadmaps/roadmap_SEO.md` e nas regras de linkagem interna (`regras_SEO.md`).

## 8. Estado atual e maturidade

- Git: 5 commits (29–31/07/2026), todos de ajuste de SEO/domínio, working tree limpo, sincronizado com `origin/main`.
- **Ponto de atenção:** o domínio canônico mudou 3 vezes em menos de 3 dias (placeholder Lovable → `financeiro-obras.roilabs.com.br` → `orcaobra.roilabs.com.br`, o atual). Vale confirmar que todas as referências (Search Console, backlinks, Kiwify) apontam para o domínio final antes de investir mais em SEO.
- Não há testes automatizados, CI/CD documentado, monitoramento de erros ou analytics de conversão além do GA4 básico.
- Não há changelog nem documentação de arquitetura prévia — este documento é a primeira visão consolidada do projeto.

## 9. Riscos e lacunas conhecidas

- **Fulfillment manual**: a geração da planilha depende de um script rodado manualmente pelo desenvolvedor com uma Service Account local (chave `.json` fora do versionamento) — não escala sem intervenção humana por venda.
- **Sem webhook Kiwify**: não há automação entre pagamento confirmado e entrega; presumivelmente a Kiwify entrega um link/arquivo estático configurado na própria plataforma, fora deste repositório.
- **Dois frontends redundantes**: manter `frontend/` (legado Lovable) e `frontend-next/` (produção) no mesmo repo é fonte potencial de confusão; se `frontend/` não estiver mais em uso, é candidato a remoção.
- **Depoimentos e rating agregado (schema `Product`) parecem hardcoded**, não coletados dinamicamente — atenção a compliance de "reviews" no Schema.org/Google se não forem reais e verificáveis.
