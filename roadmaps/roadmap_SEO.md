# Roadmap SEO 2025: Guia Prático Atualizado
**Data de Atualização:** 26/11/2025

Este roadmap foi desenhado com base nas últimas atualizações do Google (Late 2025), focando em **AI Overviews (SGE)**, **E-E-A-T** (com foco em Experiência) e **Core Web Vitals (INP)**.

---

## 🚀 Fase 1: Fundação Técnica (Obrigatório)
*Sem isso, o conteúdo não rankeia, não importa quão bom seja.*

### 1. Core Web Vitals & INP (Interaction to Next Paint)
O Google substituiu o FID pelo INP. A responsividade visual é crítica.
- [ ] **Meta:** INP < 200ms.
- [x] **Ação:** Otimizar scripts JS pesados (Third-party scripts).
- [x] **Ação:** Usar `next/script` com estratégia `afterInteractive` ou `lazyOnload` (já iniciado com GTM).
- [ ] **Ferramenta:** Validar no PageSpeed Insights e Search Console.

### 2. Sitemap & Robots.txt (Indexação Básica)
Essencial para o Google descobrir suas páginas.
- [x] **Sitemap:** Criado dinamicamente em `/sitemap.xml`.
## 🧠 Fase 2: Estratégia de Conteúdo (Otimização para IA)
*Como ser citado pelo Google Gemini e ChatGPT.*

### 1. Otimização para AI Overviews (SGE)
A IA busca respostas diretas e confiáveis.
- [x] **Respostas Diretas:** O primeiro parágrafo de cada H2 deve responder à pergunta do título em 2-3 frases (estilo "Definição de Dicionário").
- [x] **Estrutura de Perguntas:** Usar H2 e H3 como perguntas reais dos usuários (ex: "Quanto custa reformar um banheiro?" em vez de "Custos de Banheiro").
- [x] **Listas e Tabelas:** A IA adora dados estruturados. Use bullet points e tabelas comparativas sempre que possível.

### 2. E-E-A-T: O Fator "Experiência"
O "E" extra de Experiência é o diferencial contra conteúdo gerado por IA genérica.
- [x] **Autoridade do Autor:** Criar páginas de perfil para os autores (Maria Eduarda) com biografia, foto real e links para LinkedIn/Redes Sociais.
- [x] **"Eu fiz isso":** Usar primeira pessoa. Relatar casos reais, erros cometidos e lições aprendidas na obra.
- [ ] **Mídia Original:** Usar fotos reais da planilha em uso, prints de negociações (anonimizados), vídeos curtos de uso. Evitar banco de imagens genérico.

### 3. Topic Clusters (Autoridade Tópica)
Não escreva posts aleatórios. Domine um tópico.
### 1. Backlinks de Qualidade (Menos é Mais)
- [ ] **Parcerias:** Trocar guest posts com arquitetos, engenheiros ou lojas de material de construção locais.
- [ ] **Imprensa/Mídia:** Tentar citações em portais de notícias sobre construção/reforma.

### 2. Prova Social Verificável
- [x] **Depoimentos:** Adicionar prints reais de conversas (WhatsApp/Email) elogiando a planilha (com permissão).
- [x] **Reviews:** Se possível, implementar sistema de estrelas/avaliações na página de produto (Schema de Review).

---

## 🔮 Fase 4: Futuro (2026+)
- **Busca por Vídeo:** Criar vídeos curtos (Shorts/Reels) respondendo às dúvidas do blog e embedar nos artigos. O Google indexa falas de vídeos.
- **Busca Visual:** Otimizar Alt-Text não só para acessibilidade, mas descrevendo o contexto da imagem para o Google Lens.

---

### Resumo do Plano de Ação Imediato:
1.  [x] Instalar GA4/GTM (Feito).
2.  [x] Adicionar Blog com Schema FAQ (Feito).
3.  [x] Linkagem Interna agressiva (Feito).
4.  [ ] **Próximo:** Criar página de Autor (Sobre) para fortalecer E-E-A-T.
5.  [ ] **Próximo:** Adicionar Schema de Produto na Home.
