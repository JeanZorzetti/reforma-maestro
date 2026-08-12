# Feature Specification: Endurecimento, Conversão e Profundidade do App de Obras

**Feature Branch**: `002-melhorias-v11`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Transforme P0, P1 e P2 em spec" — os 14 achados da
auditoria da v1.0 já em produção, agrupados em três frentes: risco operacional
(P0), conversão do teste em assinatura (P1) e profundidade de produto (P2).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operar sem falhar em silêncio (Priority: P1)

O produto já está em produção cobrando cartão de verdade. Hoje, se o aviso de
pagamento vindo do provedor de cobrança se perder, ninguém fica sabendo: o
assinante pagou e continua sem acesso até reclamar. Se alguém resolver martelar
a tela de login, não há nada segurando — e cada tentativa de recuperação de
senha ainda dispara um e-mail. Se o app receber várias pessoas ao mesmo tempo,
o banco pode recusar conexões e a tela cair para todo mundo. E a pessoa que
quiser ir embora não encontra como apagar a conta, embora a política de
privacidade prometa esse direito.

Nesta história o fornecedor passa a ser avisado de qualquer falha no caminho do
dinheiro em minutos, a autenticação para de ser um alvo livre, o app aguenta uso
concorrente sem derrubar o banco, e o direito de exclusão sai do papel — com a
cobrança recorrente cessando no mesmo ato.

**Why this priority**: É a única frente que trata risco já materializado, não
oportunidade. Um pagamento não liberado é receita perdida com o cliente
frustrado; uma cobrança que continua depois de o cliente pedir para sair é
problema legal e de reputação; um banco sem conexões derruba o produto inteiro.
Nada aqui é feature nova — é fechar buraco no que já está no ar.

**Independent Test**: Pode ser testada sozinha, sem nenhuma tela nova de
produto: forçar uma falha no processamento de um aviso de cobrança e confirmar
que o alerta chega ao fornecedor; disparar tentativas repetidas de login e
confirmar que passam a ser recusadas; simular acessos concorrentes e confirmar
que nenhum falha por indisponibilidade de banco; excluir uma conta de teste
com assinatura ativa e confirmar que os dados somem e a cobrança para. Entrega
confiabilidade operacional mesmo que nenhuma das outras histórias exista.

**Acceptance Scenarios**:

1. **Given** um aviso de pagamento confirmado que falha ao ser processado,
   **When** a falha ocorre, **Then** o fornecedor é notificado com identificação
   do evento e do cliente afetado, e o evento fica registrado para reprocessamento
   — sem depender de o cliente reclamar.
2. **Given** a rotina diária de avisos de fim de teste, **When** ela falha ou
   não executa, **Then** o fornecedor é notificado, em vez de a falha passar
   despercebida até alguém notar que ninguém recebeu aviso.
3. **Given** um erro não tratado em qualquer tela autenticada, **When** ele
   acontece, **Then** o erro é registrado com contexto suficiente para
   diagnóstico e a pessoa vê uma mensagem compreensível, não uma tela quebrada.
4. **Given** tentativas repetidas de login para o mesmo e-mail com senha errada,
   **When** o número de tentativas ultrapassa o limite em uma janela curta,
   **Then** novas tentativas são recusadas temporariamente com mensagem clara de
   quando tentar de novo, e a recusa fica registrada.
5. **Given** pedidos repetidos de recuperação de senha para o mesmo e-mail,
   **When** o limite da janela é atingido, **Then** novos pedidos param de
   disparar e-mail, sem revelar se o e-mail existe na base.
6. **Given** uma pessoa legítima que errou a senha e esperou a janela passar,
   **When** ela tenta de novo com a senha correta, **Then** entra normalmente —
   o limite protege sem punir quem esqueceu a senha.
7. **Given** várias pessoas usando o app ao mesmo tempo, **When** a concorrência
   sobe até o pico previsto, **Then** nenhuma requisição falha por esgotamento
   de conexões de banco.
8. **Given** uma pessoa autenticada na página da própria conta, **When** ela
   escolhe excluir a conta e confirma com a própria senha, **Then** a conta,
   as obras e os lançamentos são apagados, a assinatura recorrente é cancelada
   junto no provedor de cobrança, e ela é desconectada e informada do que foi
   apagado.
9. **Given** uma pessoa prestes a excluir a conta, **When** a tela de exclusão é
   apresentada, **Then** ela é avisada de que a exportação dos dados é
   irreversivelmente perdida depois e recebe o caminho para exportar antes.
10. **Given** uma conta excluída, **When** o registro de auditoria é consultado,
    **Then** consta o evento de exclusão sem nenhum dado pessoal identificável
    da conta apagada.

---

### User Story 2 - Transformar o teste gratuito em assinatura (Priority: P2)

Quem se cadastra hoje cai direto em um formulário em branco de cadastro de obra
e precisa descobrir sozinho o que fazer. O uso real acontece no celular, em pé
no canteiro, com a nota fiscal na mão — e ali a pessoa esbarra em um campo de
data que exige digitar `12/08/2026` no teclado e em campos de dinheiro sem
máscara, onde `1.200,00` é fácil de errar. Se o pagamento foi parcelado em seis
vezes, ela precisa preencher o mesmo formulário seis vezes. E a nota fiscal, que
é a prova do gasto, não tem onde ser guardada.

Nesta história a pessoa entende o produto nos primeiros minutos, lança um gasto
no celular sem lutar contra o teclado, registra um parcelamento de uma vez só e
consegue guardar o comprovante junto do lançamento.

**Why this priority**: São 14 dias de teste para provar valor. Cada atrito no
primeiro lançamento é uma pessoa que não volta — e sem conversão do teste a
infraestrutura de US1 vira custo puro. Depende de US1 apenas no sentido de que
não faz sentido trazer mais gente para uma operação que falha em silêncio.

**Independent Test**: Pode ser testada com uma conta nova de teste, sem tocar em
nada de US1: cronometrar do cadastro até o primeiro gasto salvo em um celular
real, registrar um parcelamento em seis vezes e conferir que as seis parcelas
aparecem, e anexar um comprovante e recuperá-lo depois. Entrega ativação e
retenção mesmo sem as outras histórias.

**Acceptance Scenarios**:

1. **Given** uma pessoa que acabou de confirmar o cadastro, **When** ela entra no
   app pela primeira vez, **Then** ela é levada por um caminho guiado que
   explica o que o produto faz e termina com a primeira obra criada — em vez de
   um formulário em branco sem contexto.
2. **Given** uma pessoa no caminho guiado inicial, **When** ela quer entender o
   produto antes de digitar os próprios números, **Then** ela pode ver uma obra
   de exemplo já preenchida com painel funcionando, claramente identificada como
   exemplo e removível a qualquer momento.
3. **Given** uma pessoa preenchendo um lançamento no celular, **When** ela toca
   no campo de data, **Then** o seletor de data do próprio aparelho abre com a
   data de hoje pré-selecionada, sem exigir digitação de dígitos e barras.
4. **Given** uma pessoa preenchendo um valor, **When** ela digita os números,
   **Then** o campo formata o valor em reais conforme ela digita e recusa
   entradas impossíveis, sem que ela precise digitar ponto, vírgula ou "R$".
5. **Given** um gasto que será pago em parcelas, **When** a pessoa registra o
   lançamento informando o número de parcelas e a periodicidade, **Then** todas
   as parcelas são criadas de uma vez, com datas e valores distribuídos, e o
   painel passa a refleti-las.
6. **Given** um lançamento parcelado já criado, **When** a pessoa edita ou
   exclui uma parcela específica, **Then** apenas aquela parcela muda e as
   demais seguem intactas.
7. **Given** um lançamento parcelado já criado, **When** a pessoa opta por
   excluir a série inteira, **Then** ela é avisada de quantas parcelas serão
   removidas antes de confirmar.
8. **Given** uma pessoa com a nota fiscal em mãos, **When** ela anexa o
   comprovante ao lançamento pela câmera ou pela galeria do celular, **Then** o
   comprovante fica associado àquele lançamento e pode ser visualizado depois a
   partir da lista de lançamentos.
9. **Given** uma conta em acesso somente leitura, **When** ela abre um
   lançamento com comprovante, **Then** ainda consegue ver e baixar o
   comprovante — perder acesso de escrita não pode bloquear a leitura dos
   próprios dados.

---

### User Story 3 - Enxergar o rumo da obra e mostrar isso a alguém (Priority: P3)

O painel hoje responde "quanto já gastei" e "em quê", mas não responde a pergunta
que tira o sono de quem está reformando: "no ritmo em que estou indo, o dinheiro
acaba antes da obra?". Além disso, obras terminadas ficam para sempre na lista
principal, a navegação entre páginas de lançamentos vira uma parede de números
quando a obra cresce, e a única forma de mostrar a situação para o cônjuge, o
contador ou o empreiteiro é mandar um arquivo de planilha cru.

Nesta história a pessoa vê o consumo do orçamento evoluindo ao longo do tempo
contra o teto, tira a obra concluída da frente sem apagá-la, navega uma obra
grande sem incômodo e gera um relatório apresentável.

**Why this priority**: É aprofundamento do valor para quem já assinou — melhora
retenção e dá material de indicação boca a boca, mas não destrava receita nova
sozinho. Depende de haver lançamentos suficientes acumulados, o que só acontece
depois que US2 reduz o atrito de lançar.

**Independent Test**: Pode ser testada com uma obra populada de lançamentos ao
longo de vários meses, sem depender de US1 ou US2: conferir que a evolução do
consumo aparece corretamente, arquivar e desarquivar a obra, navegar uma obra
com centenas de lançamentos e gerar o relatório. Entrega clareza e
apresentabilidade por si só.

**Acceptance Scenarios**:

1. **Given** uma obra com lançamentos distribuídos ao longo de vários meses,
   **When** a pessoa abre o painel, **Then** ela vê o consumo do orçamento
   acumulado ao longo do tempo comparado ao teto, identificando visualmente se a
   curva está se aproximando do limite.
2. **Given** uma obra cujos lançamentos incluem datas futuras, **When** a
   evolução é exibida, **Then** o trecho já realizado é distinguível do que
   ainda está previsto, sem misturar o que já saiu do bolso com o que está
   programado.
3. **Given** uma obra sem lançamentos suficientes para formar uma evolução,
   **When** a pessoa abre o painel, **Then** ela vê uma mensagem explicando o
   que falta, em vez de um gráfico vazio ou quebrado.
4. **Given** uma obra concluída, **When** a pessoa a arquiva, **Then** ela sai da
   lista principal de obras, continua acessível em uma listagem de arquivadas,
   e seus dados e exportação permanecem intactos.
5. **Given** uma obra arquivada, **When** a pessoa a desarquiva, **Then** ela
   volta à lista principal exatamente como estava.
6. **Given** uma obra com centenas de lançamentos, **When** a pessoa navega a
   lista, **Then** ela avança e volta entre páginas e enxerga em que ponto do
   total está, sem receber uma lista de todos os números de página.
7. **Given** uma obra com lançamentos, **When** a pessoa gera o relatório da
   obra, **Then** ela recebe um documento apresentável, legível sem software de
   planilha, contendo os indicadores do painel, a quebra por categoria e os
   lançamentos.
8. **Given** uma conta em acesso somente leitura, **When** ela gera o relatório,
   **Then** o relatório é entregue normalmente — assim como a exportação, ele é
   um direito sobre os próprios dados.
9. **Given** o funil completo de cadastro, teste, assinatura e liberação de
   acesso, **When** qualquer mudança é publicada, **Then** o funil é verificado
   automaticamente de ponta a ponta antes de chegar ao cliente, em vez de por
   conferência manual.

---

### Edge Cases

- **Provedor de alerta indisponível**: se o canal de notificação de falha estiver
  fora do ar, o incidente ainda precisa ficar registrado localmente para ser
  recuperado depois — o alerta não pode ser a única cópia da informação.
- **Alerta em cascata**: uma falha sistêmica que afete muitos clientes não pode
  gerar uma notificação por cliente e afogar o fornecedor.
- **Rede compartilhada**: várias pessoas legítimas atrás do mesmo endereço de
  rede (Wi-Fi de obra, rede móvel compartilhada) não podem se bloquear
  mutuamente no limite de tentativas de login.
- **Exclusão de conta com pagamento em trânsito**: se um pagamento estiver sendo
  processado no momento da exclusão, o sistema precisa evitar deixar assinatura
  órfã cobrando um cliente que não existe mais.
- **Obra de exemplo**: se a pessoa nunca apagar a obra de exemplo, ela não pode
  poluir indicadores nem ser confundida com obra real na exportação.
- **Parcelamento com valor não divisível**: distribuir um valor que não divide
  exatamente pelo número de parcelas não pode gerar diferença de centavos entre
  a soma das parcelas e o total informado.
- **Parcelamento longo**: um número de parcelas absurdo não pode gerar milhares
  de lançamentos de uma vez.
- **Comprovante grande ou inválido**: arquivo acima do limite ou de tipo não
  suportado precisa ser recusado com mensagem clara, sem perder o lançamento
  que a pessoa já preencheu.
- **Comprovantes e exclusão**: ao excluir um lançamento, uma obra ou a conta
  inteira, os comprovantes associados precisam ser apagados junto — não podem
  sobreviver ao dado que os originou.
- **Relatório de obra muito grande**: gerar o documento de uma obra com centenas
  de lançamentos não pode estourar tempo de resposta nem entregar arquivo
  truncado.
- **Arquivar obra e assinatura**: arquivar não pode ser usado para burlar
  limites de plano nem alterar o estado de acesso da conta.

## Requirements *(mandatory)*

### Functional Requirements

**Confiabilidade e conformidade (US1)**

- **FR-001**: O sistema MUST registrar todo erro não tratado do servidor com
  contexto suficiente para diagnóstico (rota, identificador do usuário quando
  houver, e o erro original), sem gravar senha, dado de cartão ou conteúdo
  financeiro do cliente.
- **FR-002**: O sistema MUST notificar o fornecedor quando um aviso de cobrança
  recebido do provedor de pagamento não puder ser aplicado, identificando o
  evento e a conta afetada.
- **FR-003**: O sistema MUST notificar o fornecedor quando a rotina agendada de
  avisos de fim de teste falhar ou deixar de executar na janela esperada.
- **FR-004**: O sistema MUST agrupar notificações de uma mesma falha recorrente
  em vez de emitir uma notificação por ocorrência.
- **FR-005**: O sistema MUST limitar a quantidade de tentativas de autenticação
  malsucedidas por conta e por origem em uma janela de tempo, recusando as
  excedentes com indicação de quando tentar novamente.
- **FR-006**: O sistema MUST limitar a quantidade de pedidos de recuperação de
  senha por endereço de e-mail em uma janela de tempo, sem revelar se o endereço
  está cadastrado.
- **FR-007**: O sistema MUST registrar toda recusa por excesso de tentativas no
  registro de auditoria.
- **FR-008**: O sistema MUST atender ao pico de uso concorrente previsto sem que
  nenhuma requisição falhe por esgotamento de conexões ao banco de dados.
- **FR-009**: Usuários MUST ser capazes de excluir a própria conta a partir da
  página da conta, confirmando com a própria senha.
- **FR-010**: O sistema MUST cancelar a assinatura recorrente no provedor de
  cobrança como parte da exclusão da conta, garantindo que nenhuma cobrança
  posterior ocorra.
- **FR-011**: O sistema MUST avisar, antes de confirmar a exclusão, que os dados
  e a exportação são perdidos de forma irreversível, oferecendo o caminho para
  exportar antes.
- **FR-012**: O sistema MUST apagar, junto com a conta, todas as obras,
  lançamentos e comprovantes associados, mantendo no registro de auditoria
  apenas o evento de exclusão sem dado pessoal identificável.

**Ativação e conversão (US2)**

- **FR-013**: O sistema MUST conduzir a pessoa recém-cadastrada por um caminho
  guiado que explique o produto e termine com a primeira obra criada.
- **FR-014**: Usuários MUST ser capazes de visualizar uma obra de exemplo
  pré-preenchida, identificada como exemplo, e removê-la a qualquer momento.
- **FR-015**: O sistema MUST NOT incluir a obra de exemplo em indicadores de uso
  nem apresentá-la como obra real na exportação.
- **FR-016**: O sistema MUST oferecer seleção de data pelo seletor nativo do
  aparelho, com a data corrente pré-selecionada, sem exigir digitação de
  dígitos e separadores.
- **FR-017**: O sistema MUST formatar valores monetários conforme a pessoa
  digita, aceitando apenas entradas válidas em reais.
- **FR-018**: Usuários MUST ser capazes de registrar um gasto parcelado
  informando número de parcelas e periodicidade, gerando todas as parcelas em um
  único preenchimento.
- **FR-019**: O sistema MUST distribuir o valor total entre as parcelas sem
  gerar diferença de centavos entre a soma das parcelas e o total informado.
- **FR-020**: Usuários MUST ser capazes de editar ou excluir uma parcela
  isoladamente, sem afetar as demais.
- **FR-021**: Usuários MUST ser capazes de excluir a série inteira de parcelas,
  sendo informados de quantos lançamentos serão removidos antes de confirmar.
- **FR-022**: O sistema MUST limitar o número de parcelas geradas em uma única
  operação a um teto documentado.
- **FR-023**: Usuários MUST ser capazes de associar um comprovante a um
  lançamento a partir da câmera ou da galeria do aparelho.
  [NEEDS CLARIFICATION: guardar arquivos é uma capacidade que o produto ainda
  não tem e que a constitution não prevê nas integrações externas permitidas.
  O comprovante deve ser (a) arquivo hospedado pelo próprio produto, (b) apenas
  um link para arquivo que o cliente já hospeda em outro serviço, ou (c) fora do
  escopo desta entrega?]
- **FR-024**: O sistema MUST recusar comprovantes acima do limite de tamanho ou
  de tipo não suportado com mensagem clara, preservando o lançamento em
  preenchimento.
- **FR-025**: O sistema MUST permitir visualizar e baixar comprovantes mesmo em
  contas com acesso somente leitura.
- **FR-026**: O sistema MUST apagar os comprovantes associados quando o
  lançamento, a obra ou a conta correspondente for excluído.

**Profundidade e apresentação (US3)**

- **FR-027**: O sistema MUST apresentar a evolução do consumo do orçamento ao
  longo do tempo comparada ao teto, na tela do painel da obra.
- **FR-028**: O sistema MUST distinguir visualmente, nessa evolução, o que já foi
  pago do que está apenas previsto em data futura.
- **FR-029**: O sistema MUST exibir uma mensagem explicativa quando não houver
  lançamentos suficientes para formar a evolução.
- **FR-030**: Usuários MUST ser capazes de arquivar e desarquivar uma obra,
  removendo-a da listagem principal sem perder dados nem exportação.
- **FR-031**: O sistema MUST oferecer acesso às obras arquivadas em listagem
  própria.
- **FR-032**: O sistema MUST NOT alterar o estado de acesso da conta em função de
  obras arquivadas.
- **FR-033**: O sistema MUST navegar listas longas de lançamentos por avanço e
  retorno, indicando a posição no total, sem enumerar todas as páginas.
- **FR-034**: Usuários MUST ser capazes de gerar um relatório da obra em formato
  apresentável, legível sem software de planilha, contendo os indicadores do
  painel, a quebra por categoria e os lançamentos.
- **FR-035**: O sistema MUST disponibilizar o relatório também para contas em
  acesso somente leitura, pelo mesmo princípio da exportação.
- **FR-036**: O sistema MUST verificar automaticamente, a cada publicação, o
  percurso completo de cadastro, teste, assinatura e liberação de acesso.

### Key Entities *(include if feature involves data)*

- **Comprovante**: evidência de um gasto, associada a exatamente um lançamento.
  Guarda referência ao arquivo, tipo, tamanho e momento do anexo. Vive e morre
  com o lançamento que o originou.
- **Série de parcelas**: agrupamento que liga lançamentos gerados em um único
  preenchimento parcelado. Guarda o total original, a quantidade de parcelas e a
  periodicidade, permitindo tratar a série como unidade sem impedir a edição
  individual de cada parcela.
- **Tentativa de autenticação**: contagem de tentativas malsucedidas por conta e
  por origem dentro de uma janela de tempo, usada para decidir recusa. Não
  guarda a credencial tentada.
- **Incidente operacional**: falha relevante detectada pelo sistema (aviso de
  cobrança não aplicado, rotina agendada não executada, erro não tratado), com
  tipo, momento, contexto e se já foi notificada — permite agrupar repetições e
  reprocessar depois.
- **Obra**: ganha o estado de arquivada como atributo consultável e reversível,
  distinto de exclusão.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Toda falha na liberação de acesso após pagamento confirmado é
  detectada e comunicada ao fornecedor em até 15 minutos, sem depender de
  reclamação do cliente — hoje o tempo é indeterminado.
- **SC-002**: Um ataque automatizado de tentativa de senha é barrado após no
  máximo 10 tentativas, e usuários legítimos bloqueados por engano ficam abaixo
  de 1 caso por mês.
- **SC-003**: O app sustenta 50 sessões simultâneas sem nenhuma falha por
  indisponibilidade de banco de dados.
- **SC-004**: Uma pessoa exclui a própria conta em no máximo 3 interações a
  partir da página da conta, e nenhuma cobrança ocorre após a exclusão.
- **SC-005**: Uma pessoa recém-cadastrada salva o primeiro gasto em menos de 3
  minutos, usando um celular, sem consultar ajuda externa.
- **SC-006**: A taxa de formulários de lançamento abertos que terminam em
  lançamento salvo no celular atinge 90% ou mais.
- **SC-007**: Registrar um gasto em 6 parcelas passa a exigir um preenchimento em
  vez de seis.
- **SC-008**: Ao abrir o painel de uma obra em andamento, a pessoa consegue dizer
  se está no caminho de estourar o orçamento sem exportar dados nem fazer
  cálculo próprio.
- **SC-009**: Uma obra com 500 lançamentos é navegada e tem relatório gerado em
  menos de 2 segundos por operação.
- **SC-010**: O percurso de cadastro até acesso liberado após pagamento passa a
  ser verificado automaticamente em 100% das publicações, contra 0% hoje.
- **SC-011**: Chamados de suporte relativos a "paguei e não liberou" caem a zero
  casos não detectados previamente pelo próprio sistema.

## Assumptions

- O produto está em produção em `orcaobra.roilabs.com.br` com cobrança real
  ativa; toda mudança desta spec incide sobre base de clientes viva, não sobre
  ambiente vazio.
- O pico de concorrência relevante para SC-003 é de dezenas, não milhares, de
  sessões — o produto é de nicho e vendido por busca orgânica. Dimensionamento
  para volume maior é prematuro e fica fora de escopo (Princípio I da
  constitution).
- O canal de notificação de incidente para o fornecedor é e-mail, reaproveitando
  o provedor de e-mail transacional já integrado; não se introduz canal novo.
- O limite de tentativas de login e de recuperação de senha é contado no próprio
  banco de dados já existente. Introduzir cache distribuído para isso seria
  desproporcional ao volume (Princípio I).
- A exclusão de conta permanece imediata e definitiva, confirmada por senha, sem
  período de arrependimento — o comportamento já implementado é mantido e apenas
  ganha interface e cancelamento de cobrança.
- O parcelamento gera lançamentos independentes e concretos ligados por uma
  série, e não um lançamento recorrente virtual: mantém o painel, a exportação e
  os filtros existentes funcionando sem alteração de semântica.
- A periodicidade de parcelamento suportada é mensal, semanal e quinzenal — as
  formas usadas em obra (material parcelado no cartão, mão de obra semanal).
- A evolução de consumo não inclui projeção de estouro futuro: a obra não tem
  data de término cadastrada, e criar essa projeção exigiria um dado que o
  produto não coleta. Fica registrado como candidato a spec futura.
- O relatório apresentável é gerado sob demanda, não agendado nem enviado por
  e-mail automaticamente.
- As quatro categorias fixas herdadas da planilha permanecem; categorias
  personalizadas seguem fora de escopo, como na spec 001.
- A cobertura automatizada de FR-036 roda contra ambiente de teste do provedor de
  cobrança, nunca contra cobrança real.
- Nenhuma mudança desta spec pode degradar as rotas públicas indexadas nem o
  structured data (Princípio II).
- Toda leitura e escrita introduzida aqui segue escopada ao usuário autenticado
  no servidor (Princípio V), e o relatório e os comprovantes seguem o direito de
  portabilidade do Princípio VI.

## Dependencies

- Provedor de cobrança recorrente já integrado (necessário para FR-010 e FR-036).
- Provedor de e-mail transacional já integrado (necessário para FR-002 e FR-003).
- Serviço de captura de erro de servidor — capacidade nova, a definir em
  `/speckit-plan`; é a única dependência externa nova exigida por US1.
- Capacidade de armazenamento de arquivos — dependência nova condicionada à
  resolução do [NEEDS CLARIFICATION] em FR-023. Se a resposta for arquivo
  hospedado pelo produto, a seção Technology & Integration Constraints da
  constitution precisa de emenda antes do plano.
