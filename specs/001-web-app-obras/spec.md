# Feature Specification: Web App de Controle Financeiro de Obras

**Feature Branch**: `001-web-app-obras`

**Created**: 2026-08-11

**Status**: Draft

**Input**: User description: "Substituir o entregável principal do produto: a planilha Google Sheets 'Gestor Financeiro de Obras 1.0' dá lugar a um web app autenticado de controle financeiro de obras, com backend próprio e modelo de assinatura recorrente."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Controlar o orçamento da obra (Priority: P1)

Uma pessoa física que está reformando ou construindo sua casa cria uma conta,
cadastra sua obra informando o orçamento teto e o percentual de fundo de
reserva, e passa a registrar cada gasto conforme ele acontece: a data, em qual
categoria se encaixa (Material, Mão de Obra, Taxas ou Mobília), o que foi
comprado, de qual fornecedor, quanto esperava gastar e quanto de fato já pagou.
A qualquer momento ela abre o painel e vê, sem fazer conta nenhuma, quanto já
comprometeu do orçamento, quanto ainda sobra, onde o dinheiro está indo por
categoria e quais itens estouraram o previsto.

**Why this priority**: É a razão de o produto existir e a substituição direta do
valor que a planilha entregava. Sem isso não há produto — nem para vender, nem
para cobrar assinatura.

**Independent Test**: Com uma conta provisionada manualmente, é possível
cadastrar uma obra, lançar uma série de gastos e conferir que os totais, o saldo
restante, o percentual consumido e a quebra por categoria refletem exatamente os
lançamentos — entregando controle de orçamento mesmo antes de existir cobrança.

**Acceptance Scenarios**:

1. **Given** uma pessoa sem conta no sistema, **When** ela se cadastra com
   e-mail e senha e confirma o acesso, **Then** ela entra autenticada e é levada
   a cadastrar sua primeira obra.
2. **Given** uma conta autenticada sem obras, **When** a pessoa cadastra uma obra
   com nome, orçamento teto e percentual de fundo de reserva, **Then** a obra é
   criada e o painel exibe orçamento total, fundo de reserva calculado e saldo
   integral disponível.
3. **Given** uma obra cadastrada, **When** a pessoa registra um lançamento com
   data, categoria, item, fornecedor, valor previsto e valor pago, **Then** o
   lançamento aparece na lista com status derivado (Pago quando o valor pago
   cobre o previsto, Pendente caso contrário) e a diferença entre previsto e pago.
4. **Given** uma obra com lançamentos registrados, **When** a pessoa abre o
   painel, **Then** ela vê total previsto, total pago, saldo restante, percentual
   do orçamento consumido e a distribuição de gastos por categoria.
5. **Given** uma obra cujos gastos ultrapassaram o orçamento teto, **When** a
   pessoa abre o painel, **Then** o estouro é sinalizado visualmente de forma
   inequívoca, indicando o valor excedido.
6. **Given** duas pessoas com contas distintas e obras cadastradas, **When**
   qualquer uma delas acessa o sistema, **Then** ela vê exclusivamente as obras e
   lançamentos da própria conta, sem qualquer via de acesso aos dados da outra.
7. **Given** um lançamento registrado com erro, **When** a pessoa o edita ou
   exclui, **Then** todos os totais e indicadores do painel se atualizam
   imediatamente para refletir a correção.
8. **Given** uma conta com mais de uma obra cadastrada, **When** a pessoa
   seleciona uma delas, **Then** o painel e a lista de lançamentos passam a
   refletir exclusivamente a obra selecionada, sem misturar dados entre obras.

---

### User Story 2 - Testar, assinar e manter o acesso (Priority: P2)

Um visitante convencido pela página de vendas cria conta e usa o produto por um
período de teste gratuito, sem precisar informar cartão. Antes do teste acabar
ele é avisado; ao assinar e pagar, o acesso continua sem interrupção e sem
depender de nenhuma ação manual do fornecedor. Se o teste expirar sem assinatura,
ou se ele cancelar ou deixar de pagar depois, o acesso é reduzido de forma
previsível — mas os dados da obra continuam lá e exportáveis.

**Why this priority**: É o que torna o produto sustentável — sem cobrança
recorrente funcionando, a infraestrutura passa a ser custo puro. Depende de
US1 existir para ter o que liberar.

**Independent Test**: Simulando um teste em andamento, um teste expirado, uma
assinatura confirmada, uma cancelada e uma inadimplente, verifica-se que o
acesso concedido a cada estado corresponde ao documentado — sem precisar de
intervenção manual entre pagamento e liberação.

**Acceptance Scenarios**:

1. **Given** um visitante que acabou de criar conta, **When** ele acessa o app,
   **Then** o período de teste gratuito começa sem exigir cartão e o app exibe
   quantos dias restam.
2. **Given** um teste gratuito em andamento, **When** ele se aproxima do fim,
   **Then** a pessoa é avisada com antecedência e recebe um caminho direto para
   assinar.
3. **Given** um teste gratuito expirado sem assinatura, **When** a pessoa acessa
   o app, **Then** o acesso passa ao estado reduzido documentado, com os dados da
   obra preservados e a exportação disponível.
4. **Given** um visitante na página de vendas ou uma conta em teste, **When** a
   assinatura é concluída e o pagamento confirmado, **Then** a conta é liberada
   automaticamente para as funcionalidades pagas, sem intervenção manual do
   fornecedor.
5. **Given** uma pessoa autenticada sem teste válido nem assinatura ativa,
   **When** ela tenta usar uma funcionalidade paga, **Then** o acesso é negado
   com uma mensagem clara e um caminho direto para assinar.
6. **Given** uma assinatura ativa, **When** ela é cancelada pelo assinante,
   **Then** o acesso pago permanece até o fim do período já pago e, encerrado
   esse prazo, a conta passa ao estado de acesso reduzido documentado.
7. **Given** uma assinatura com pagamento recusado, **When** o período de
   tolerância se esgota sem regularização, **Then** o acesso pago é suspenso e a
   pessoa é notificada com instruções de como regularizar.
8. **Given** uma conta com acesso reduzido, **When** a pessoa assina ou
   regulariza a assinatura, **Then** o acesso pago é restabelecido com todos os
   dados da obra preservados e intactos.
9. **Given** qualquer estado de acesso, **When** o sistema decide se libera uma
   funcionalidade paga, **Then** a decisão é tomada com base no estado persistido
   verificado no servidor, nunca em informação enviada pelo navegador.

---

### User Story 3 - Levar os dados embora (Priority: P3)

A pessoa exporta os lançamentos da obra em formato de planilha a qualquer
momento — para guardar, para mandar ao contador, para conferir offline ou
simplesmente porque quer ter os próprios dados na mão. Isso continua funcionando
depois de cancelar a assinatura.

**Why this priority**: É a promessa que substitui o "acesso vitalício" da
planilha e remove o principal medo de quem troca compra única por assinatura:
perder os dados. Também é exigência da constitution do projeto (Princípio VI).

**Independent Test**: Com uma obra populada, aciona-se a exportação e confere-se
que o arquivo gerado contém todos os lançamentos com seus campos, abrindo
corretamente em um editor de planilhas comum — e que a mesma exportação continua
disponível para uma conta com assinatura cancelada.

**Acceptance Scenarios**:

1. **Given** uma obra com lançamentos, **When** a pessoa solicita a exportação,
   **Then** ela recebe um arquivo de planilha contendo todos os lançamentos com
   data, categoria, item, fornecedor, valor previsto, valor pago e status.
2. **Given** uma conta cuja assinatura foi cancelada, **When** a pessoa acessa o
   sistema, **Then** a exportação dos seus dados permanece disponível.
3. **Given** um arquivo exportado, **When** ele é aberto em um editor de
   planilhas comum, **Then** os valores monetários e datas aparecem legíveis e no
   formato brasileiro, sem corrupção de acentuação.

---

### User Story 4 - Encontrar e entender o produto (Priority: P4)

Uma pessoa buscando no Google como controlar gastos de reforma encontra um
artigo do blog, entende o problema, chega à página de vendas e compreende que o
produto é um app de controle de obra por assinatura — não mais uma planilha.

**Why this priority**: Busca orgânica é o canal principal de aquisição e o
tráfego já conquistado não pode ser perdido na virada. Porém, a página só tem o
que vender depois que US1 e US2 existirem.

**Independent Test**: Percorre-se as rotas públicas verificando que continuam
acessíveis e indexáveis, que nenhuma URL previamente indexada quebrou, e que a
comunicação descreve o app e o modelo de assinatura sem prometer planilha.

**Acceptance Scenarios**:

1. **Given** as páginas públicas existentes (home, blog, artigos, /sobre),
   **When** o app autenticado é introduzido, **Then** todas continuam acessíveis
   sem login e indexáveis por buscadores.
2. **Given** uma URL que já estava indexada, **When** ela deixa de existir ou
   muda de endereço, **Then** ela redireciona permanentemente para o conteúdo
   equivalente, sem retornar erro.
3. **Given** a página de vendas, **When** um visitante a lê, **Then** a promessa
   descreve o app e a cobrança recorrente, sem oferecer planilha como entregável.
4. **Given** as áreas autenticadas do app, **When** um buscador as rastreia,
   **Then** elas não são indexadas.

---

### Edge Cases

- Pessoa cadastra obra com orçamento teto zero ou negativo, ou fundo de reserva
  fora da faixa de 0% a 100%.
- Lançamento com valor pago maior que o valor previsto (estouro no item) ou com
  data futura.
- Pagamento é confirmado pelo provedor de cobrança para um e-mail que ainda não
  possui conta no sistema.
- Teste gratuito expira enquanto a pessoa está com o app aberto.
- Pessoa assina antes de o teste acabar — os dias restantes não podem ser
  perdidos nem duplicados.
- Pessoa exclui a conta e cria outra com o mesmo e-mail tentando renovar o teste.
- Pessoa exclui uma obra que ainda tem lançamentos.
- Notificação de pagamento chega duplicada ou fora de ordem — o mesmo pagamento
  não pode liberar acesso duas vezes nem um evento antigo reverter um estado mais
  recente.
- Pessoa cancela e volta a assinar depois — os dados da obra anterior precisam
  continuar lá.
- Sessão expira no meio do preenchimento de um lançamento.
- Obra com centenas de lançamentos — listagem e painel precisam continuar
  utilizáveis.
- Duas abas do navegador abertas na mesma obra editando lançamentos diferentes.

## Requirements *(mandatory)*

### Functional Requirements

**Conta e identidade**

- **FR-001**: O sistema MUST permitir que uma pessoa crie uma conta com e-mail e
  senha e autentique-se posteriormente com essas credenciais.
- **FR-002**: O sistema MUST oferecer recuperação de senha por e-mail.
- **FR-003**: O sistema MUST encerrar sessões inativas e permitir logout
  explícito.

**Obra e orçamento**

- **FR-004**: Usuários MUST conseguir cadastrar uma obra informando nome,
  orçamento teto e percentual de fundo de reserva.
- **FR-005**: O sistema MUST rejeitar orçamento teto não positivo e percentual de
  fundo de reserva fora da faixa de 0% a 100%, com mensagem explicativa.
- **FR-006**: Usuários MUST conseguir editar os dados da obra, com os indicadores
  recalculados a partir dos novos valores.
- **FR-007**: O sistema MUST permitir que cada conta mantenha várias obras
  simultâneas, com navegação explícita entre elas e nenhum dado compartilhado ou
  somado entre obras distintas.
- **FR-007a**: Usuários MUST conseguir arquivar ou excluir uma obra concluída sem
  perder o histórico das demais.

**Lançamentos**

- **FR-008**: Usuários MUST conseguir registrar um lançamento com data,
  categoria, item, fornecedor, valor previsto e valor pago.
- **FR-009**: O sistema MUST restringir a categoria às opções Material, Mão de
  Obra, Taxas e Mobília.
- **FR-010**: O sistema MUST derivar automaticamente o status do lançamento
  (Pago quando o valor pago cobre o previsto, Pendente caso contrário) e a
  diferença entre previsto e pago, sem que o usuário precise informá-los.
- **FR-011**: Usuários MUST conseguir editar e excluir lançamentos, com todos os
  indicadores atualizados imediatamente.
- **FR-012**: Usuários MUST conseguir listar os lançamentos da obra ordenados por
  data e filtrá-los por categoria e por status.
- **FR-013**: O sistema MUST aceitar valores monetários em reais e datas no
  formato brasileiro, exibindo-os no mesmo formato.

**Painel**

- **FR-014**: O sistema MUST exibir, para a obra selecionada: total previsto,
  total pago, saldo restante do orçamento teto e percentual do orçamento
  consumido.
- **FR-015**: O sistema MUST exibir a distribuição dos gastos por categoria.
- **FR-016**: O sistema MUST sinalizar visualmente quando os gastos ultrapassarem
  o orçamento teto, indicando o valor excedido.
- **FR-017**: O sistema MUST refletir o fundo de reserva no cálculo do saldo
  disponível, deixando explícito quanto do orçamento está reservado.

**Assinatura e acesso**

- **FR-018**: O sistema MUST liberar o acesso às funcionalidades pagas
  automaticamente após a confirmação do pagamento, sem intervenção manual.
- **FR-019**: O sistema MUST derivar toda decisão de acesso pago do estado de
  assinatura persistido e verificado no servidor, nunca de estado informado pelo
  cliente.
- **FR-020**: O sistema MUST tratar notificações de cobrança duplicadas ou fora
  de ordem sem conceder acesso indevido nem regredir um estado mais recente.
- **FR-021**: O sistema MUST manter o acesso pago até o fim do período já pago
  quando o assinante cancela.
- **FR-022**: O sistema MUST reduzir o acesso de forma documentada quando a
  assinatura termina ou fica inadimplente, preservando os dados da obra e
  mantendo a exportação disponível.
- **FR-023**: O sistema MUST notificar o assinante sobre falha de pagamento e
  sobre suspensão iminente, com instruções de regularização.
- **FR-024**: Usuários MUST conseguir consultar o estado da própria assinatura e
  iniciar o cancelamento sem precisar falar com o suporte.
- **FR-025**: O sistema MUST conceder a toda conta recém-criada um período de
  teste gratuito com acesso às funcionalidades pagas, sem exigir cartão ou
  qualquer dado de pagamento no cadastro.
- **FR-025a**: O sistema MUST exibir à pessoa em teste quanto tempo resta e
  avisá-la antes da expiração, com um caminho direto para assinar.
- **FR-025b**: O sistema MUST tratar teste expirado sem assinatura da mesma forma
  que assinatura encerrada: acesso reduzido, dados preservados e exportação
  disponível.
- **FR-025c**: O sistema MUST conceder o teste gratuito uma única vez por conta,
  impedindo que a criação de contas sucessivas renove o período indefinidamente.

**Portabilidade de dados**

- **FR-026**: Usuários MUST conseguir exportar todos os lançamentos da obra em
  formato de planilha a qualquer momento.
- **FR-027**: O sistema MUST manter a exportação disponível mesmo para contas com
  assinatura cancelada ou inadimplente.
- **FR-028**: O sistema MUST declarar por quanto tempo os dados de contas
  inativas são retidos e permitir que o usuário solicite a exclusão dos próprios
  dados.

**Isolamento e segurança**

- **FR-029**: O sistema MUST escopar toda leitura e escrita de dados de obra ao
  usuário autenticado, verificado no servidor a cada requisição.
- **FR-030**: O sistema MUST registrar eventos relevantes de acesso e de
  alteração de estado de assinatura para permitir auditoria de problemas de
  cobrança.

**Continuidade do canal público**

- **FR-031**: As páginas públicas existentes (home, blog, artigos, /sobre)
  MUST permanecer acessíveis sem autenticação e indexáveis por buscadores.
- **FR-032**: URLs previamente indexadas que deixem de existir ou mudem de
  endereço MUST redirecionar permanentemente para o conteúdo equivalente.
- **FR-033**: As áreas autenticadas do app MUST NOT ser indexadas por buscadores.
- **FR-034**: A comunicação pública MUST descrever o app e o modelo de assinatura
  como entregável, sem prometer planilha como produto.

**Descontinuação do produto anterior**

- **FR-035**: O frontend legado (protótipo Lovable) e os scripts de
  provisionamento manual da planilha MUST ser removidos do projeto ao fim da
  migração.
- **FR-036**: Nenhuma migração de compradores é necessária — o produto anterior
  não registrou vendas. Não há promessa de "acesso vitalício" a honrar nem base
  instalada a transicionar.

### Key Entities

- **Usuário**: pessoa física titular da conta. Identificado por e-mail, possui
  credencial de acesso e é o dono exclusivo de suas obras e lançamentos.
- **Obra**: projeto de reforma ou construção pertencente a um usuário, que pode
  ter várias. Guarda nome, orçamento teto e percentual de fundo de reserva.
  Agrega lançamentos.
- **Lançamento**: um gasto registrado dentro de uma obra. Guarda data, categoria,
  item, fornecedor, valor previsto e valor pago; status e diferença são derivados
  desses valores, nunca informados diretamente.
- **Categoria**: classificação fechada de um lançamento — Material, Mão de Obra,
  Taxas ou Mobília.
- **Assinatura**: vínculo entre um usuário e seu direito de acesso pago. Guarda o
  estado corrente (em teste gratuito, ativa, cancelada com acesso até certa data,
  inadimplente, encerrada), a data de término do acesso e a referência à cobrança
  externa. Toda conta nasce em teste gratuito.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa que nunca usou o produto consegue criar conta, cadastrar
  a obra e registrar o primeiro gasto em menos de 5 minutos, sem consultar ajuda.
- **SC-002**: Registrar um gasto adicional leva menos de 30 segundos.
- **SC-003**: 90% das pessoas que cadastram uma obra registram ao menos três
  lançamentos na primeira semana — indicando que o app substituiu de fato o
  hábito da planilha.
- **SC-004**: O painel comunica a situação do orçamento de forma que 90% dos
  usuários testados identifiquem corretamente, em menos de 15 segundos, se a obra
  está dentro ou fora do orçamento.
- **SC-005**: 100% dos pagamentos confirmados resultam em acesso liberado sem
  qualquer ação manual do fornecedor.
- **SC-006**: Nenhum usuário consegue visualizar dados de obra de outro usuário
  em qualquer cenário testado.
- **SC-007**: A exportação de dados permanece disponível para 100% das contas com
  assinatura encerrada.
- **SC-008**: O tráfego orgânico das páginas públicas não cai mais de 10% nos 30
  dias seguintes à virada, e nenhuma URL previamente indexada retorna erro.
- **SC-009**: O painel permanece utilizável — carregando e respondendo sem espera
  perceptível — em uma obra com 500 lançamentos.
- **SC-010**: Zero incidentes de acesso pago concedido a conta sem teste válido
  nem assinatura válida, ou negado a conta com direito de acesso válido.
- **SC-011**: Ao menos 15% das contas que registram três ou mais lançamentos
  durante o teste gratuito convertem em assinatura paga.
- **SC-012**: Nenhuma conta consegue obter um segundo período de teste gratuito.

## Assumptions

- O público-alvo permanece o mesmo do produto anterior: pessoa física leiga
  executando reforma ou construção residencial, usuária básica de planilhas, sem
  conhecimento técnico de construção civil.
- O app é de uso individual: não há times, convite de colaboradores, papéis ou
  fluxo de aprovação. Compartilhar a obra com terceiros está fora de escopo.
- O produto atende um único mercado (Brasil): moeda em reais, datas no formato
  brasileiro, interface em português. Internacionalização está fora de escopo.
- Uso majoritário em navegador de celular durante a obra e em desktop para
  conferência — a interface precisa funcionar bem em ambos, mas aplicativo nativo
  está fora de escopo.
- As categorias permanecem as quatro fixas herdadas da planilha; categorias
  personalizadas pelo usuário estão fora de escopo nesta versão.
- Anexar comprovantes ou fotos aos lançamentos está fora de escopo nesta versão.
- A cobrança recorrente é operada por um provedor externo que notifica o sistema
  sobre pagamentos e mudanças de estado; o sistema não processa cartão
  diretamente nem armazena dados de pagamento.
- O tratamento de dados pessoais e financeiros segue a LGPD, incluindo o direito
  de exclusão previsto em FR-028.
- O produto anterior (planilha) não registrou nenhuma venda, portanto não existe
  base instalada, promessa de "acesso vitalício" em vigor, nem migração de
  clientes a fazer. A virada é limpa.
- O período de teste gratuito assumido é de 14 dias sem cartão. O prazo é um
  padrão de mercado e pode ser ajustado sem alterar o restante do spec —
  o requisito é que exista teste, seja avisado antes de expirar e não seja
  renovável.
- No estado de acesso reduzido (teste expirado, assinatura cancelada ou
  inadimplente) assume-se que o usuário mantém leitura dos próprios dados e a
  exportação, perdendo a criação e edição de obras e lançamentos.
