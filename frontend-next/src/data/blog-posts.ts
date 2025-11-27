export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  category: string;
  faqSchema?: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "como-fazer-fluxo-caixa-reforma",
    title: "Como fazer o Fluxo de Caixa de uma pequena reforma sem surtar (Planilha Grátis vs. Sistema Pago)",
    excerpt: "Aprenda a controlar o dinheiro da sua obra e entenda por que anotar no caderno é um erro perigoso.",
    date: "2024-11-26",
    author: "Reforma Maestro",
    category: "Tutorial",
    content: `
      <h2>Por que anotar gastos no caderno é perigoso?</h2>
      <p>Anotar gastos no caderno é perigoso porque ele não soma automaticamente, não projeta gastos futuros e não avisa quando o orçamento vai estourar. É um método passivo que apenas registra o prejuízo depois que ele já aconteceu.</p>
      
      <p>Para entender melhor onde o dinheiro some, leia nosso artigo sobre <a href="/blog/custos-invisiveis-obra">custos invisíveis na obra</a>.</p>

      <h2>Qual a diferença entre Orçamento Previsto e Realizado?</h2>
      <p>A diferença é simples: <strong>Previsto</strong> é quanto você planeja gastar antes de comprar, e <strong>Realizado</strong> é quanto efetivamente saiu do seu bolso. O segredo das construtoras é monitorar essa variação item a item para evitar surpresas.</p>
      
      <img src="/images/tabela-sinapi-excel.png" alt="Planilha de Orçamento de Obras aberta no Excel mostrando colunas de Previsto vs Realizado e tabela SINAPI" class="w-full rounded-lg my-6 shadow-md" />

      <ul>
        <li><strong>Previsto:</strong> Estimativa inicial (ex: R$ 500,00 em tinta).</li>
        <li><strong>Realizado:</strong> Custo final com nota fiscal (ex: R$ 580,00).</li>
      </ul>
      <p>Se você não monitora essa diferença, no final da obra o rombo pode chegar a 30% ou 40% do valor total.</p>

      <h2>Planilha grátis ou sistema pago: qual o melhor?</h2>
      <p>Depende do seu conhecimento. Planilhas grátis geralmente exigem conhecimento avançado em Excel para não quebrar fórmulas. Sistemas pagos ou planilhas profissionais (como o Reforma Maestro) já vêm prontos, com relatórios automáticos e focados na usabilidade.</p>
      <ul>
        <li><strong>Planilhas Grátis:</strong> Complexas ou simplistas demais.</li>
        <li><strong>Sistemas Profissionais:</strong> Prontos para uso e seguros.</li>
      </ul>
      
      <p>Veja nosso comparativo completo entre <a href="/blog/melhores-apps-gestao-obra-2024">Apps de Gestão vs Google Sheets</a>.</p>

      <h3>A Solução Definitiva</h3>
      <p>Você não precisa fazer um curso de Excel para reformar seu banheiro. Você precisa de uma ferramenta pronta, pensada para quem não é da área.</p>

      <p><strong>Pare de tentar reinventar a roda no Excel. Conheça nossa <a href="/#pricing">Planilha de Orçamento de Obra</a> e comece a controlar sua obra em 5 minutos.</strong></p>
    `,
    faqSchema: `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [{
          "@type": "Question",
          "name": "Qual a diferença entre fluxo de caixa e orçamento?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Orçamento é a previsão de gastos totais. Fluxo de caixa é o registro de quando o dinheiro efetivamente entra e sai, permitindo saber se haverá saldo para pagar as contas na data certa."
          }
        }, {
          "@type": "Question",
          "name": "Preciso ser contador para fazer fluxo de caixa?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Não. Com a ferramenta certa, basta lançar as despesas e receitas que o sistema calcula tudo automaticamente."
          }
        }]
      }
      </script>
    `
  },
  {
    slug: "custos-invisiveis-obra",
    title: "5 custos invisíveis que fazem sua obra custar o dobro do planejado",
    excerpt: "Descubra os ralos por onde seu dinheiro está escapando e como estancá-los antes que seja tarde.",
    date: "2024-11-26",
    author: "Reforma Maestro",
    category: "Alerta",
    content: `
      <h2>Por que o dinheiro da obra acaba antes do fim?</h2>
      <p>O dinheiro acaba antes do fim principalmente por causa dos <strong>Custos Invisíveis</strong>: pequenos gastos não planejados (fretes, lanches, desperdício) que, somados, podem representar até 20% do valor total da obra e não estavam no orçamento inicial.</p>
      
      <p>Isso destrói qualquer <a href="/blog/como-fazer-fluxo-caixa-reforma">fluxo de caixa de reforma</a> bem planejado.</p>

      <h2>Quais são os principais custos invisíveis de uma obra?</h2>
      <p>Os 5 principais vilões são: Fretes, Caçambas, Alimentação da equipe, Desperdício de material e Pequenas ferramentas (miudezas).</p>
      
      <img src="/images/custos-invisiveis-obra.png" alt="Gráfico de pizza mostrando a porcentagem de custos invisíveis como fretes e desperdícios em uma obra" class="w-full rounded-lg my-6 shadow-md" />

      <h3>1. Fretes e Carretos</h3>
      <p>Você orça o piso, mas esquece os R$ 150,00 de entrega. Multiplique isso por 10 entregas e lá se vão R$ 1.500,00.</p>

      <h3>2. Caçambas de Entulho</h3>
      <p>A retirada de entulho é cara. Muitas vezes subestimamos a quantidade de lixo que uma demolição gera.</p>

      <h3>3. Alimentação e Transporte da Equipe</h3>
      <p>Se o combinado incluir almoço ou passagem, isso deve estar na ponta do lápis. Café da manhã e lanches "por fora" também somam.</p>

      <h3>4. Desperdício de Material</h3>
      <p>Sacos de cimento que endurecem na chuva, pisos que quebram no corte. O desperdício médio no Brasil é de 8% a 20%!</p>

      <h3>5. Pequenos Materiais (A "Miudeza")</h3>
      <p>Lixas, pregos, fitas, discos de corte. Parecem baratos, mas juntos formam uma bola de neve.</p>

      <h2>Como evitar custos extras na obra?</h2>
      <p>A única forma é registrar TUDO. Até o parafuso de R$ 0,50. Tenha uma categoria de "Imprevistos" ou "Outros" no seu orçamento.</p>
      
      <p>Aprenda também <a href="/blog/guia-dono-obra-negociacao">como negociar com lojas</a> para reduzir esses impactos.</p>

      <p><strong>Nosso Gestor Financeiro tem categorias de alerta para esses gastos invisíveis. Conheça a <a href="/#pricing">Planilha de Orçamento de Obra</a> e não deixe o dinheiro vazar pelo ralo.</strong></p>
    `,
    faqSchema: `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [{
          "@type": "Question",
          "name": "O que são custos invisíveis em uma obra?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "São gastos pequenos ou não planejados que não aparecem no orçamento inicial, como fretes, alimentação, pequenas ferramentas e desperdícios."
          }
        }, {
          "@type": "Question",
          "name": "Como calcular a margem de erro para custos invisíveis?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Recomenda-se adicionar uma margem de segurança (Fundo de Reserva) de 10% a 20% sobre o valor total do orçamento."
          }
        }]
      }
      </script>
    `
  },
  {
    slug: "melhores-apps-gestao-obra-2024",
    title: "Os melhores Apps para gestão de obra em 2024 (E por que o Google Sheets vence)",
    excerpt: "Comparativo entre softwares caros e a eficiência do Google Sheets para quem não é construtora.",
    date: "2024-11-26",
    author: "Reforma Maestro",
    category: "Ferramentas",
    content: `
      <h2>Softwares de engenharia servem para pequenas reformas?</h2>
      <p>Geralmente não. Softwares como Sienge ou Obra Prima são focados em grandes construtoras, sendo caros e complexos demais para quem vai reformar apenas um apartamento ou casa.</p>
      <ul>
        <li>Caros (mensalidades altas).</li>
        <li>Difíceis de configurar.</li>
        <li>Cheios de funções inúteis para o proprietário comum.</li>
      </ul>

      <h2>Vale a pena usar caderno para gerenciar obra?</h2>
      <p>Não vale a pena. O caderno é arriscado (pode ser perdido), não faz backup, não calcula totais automaticamente e dificulta a visualização do saldo disponível.</p>
      <p>Veja como fazer um <a href="/blog/como-fazer-fluxo-caixa-reforma">fluxo de caixa simples</a> sem depender de papel.</p>

      <h2>Por que o Google Sheets é o Campeão?</h2>
      <p>O Google Sheets é a melhor ferramenta para donos de obra porque une a flexibilidade do Excel com a mobilidade da nuvem, sendo gratuito e acessível pelo celular.</p>
      
      <img src="/images/google-sheets-obra.png" alt="Pessoa usando Google Sheets no celular em uma obra para controlar gastos" class="w-full rounded-lg my-6 shadow-md" />

      <ul>
        <li><strong>Nuvem:</strong> Acesse do celular na loja de material ou no computador em casa.</li>
        <li><strong>Gratuito:</strong> Você não paga mensalidade pelo uso da plataforma.</li>
        <li><strong>Flexível:</strong> Pode ser adaptado exatamente para o que você precisa.</li>
        <li><strong>Compartilhável:</strong> Mande para seu cônjuge ou arquiteto em tempo real.</li>
      </ul>
      
      <p>Isso ajuda muito a evitar os <a href="/blog/custos-invisiveis-obra">custos invisíveis</a> que mencionamos em outro artigo.</p>

      <h3>Mas começar do zero é difícil...</h3>
      <p>Criar uma planilha inteligente no Sheets dá trabalho. Fórmulas, gráficos, validação de dados...</p>
      <p>É por isso que criamos o Gestor Financeiro de Obras 1.0. Ele pega toda a potência do Google Sheets e entrega pronta para uso.</p>

      <p><strong>Tenha a potência de um software com a simplicidade de uma planilha. Conheça a <a href="/#pricing">Planilha de Orçamento de Obra</a>.</strong></p>
    `,
    faqSchema: `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [{
          "@type": "Question",
          "name": "O Google Sheets funciona offline?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sim, é possível configurar o Google Sheets para acesso offline, permitindo consultar e editar dados mesmo sem internet na obra."
          }
        }, {
          "@type": "Question",
          "name": "É seguro usar planilhas na nuvem?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sim, o Google oferece alta segurança e backup automático. O risco de perder dados é muito menor do que em anotações físicas."
          }
        }]
      }
      </script>
    `
  },
  {
    slug: "guia-dono-obra-negociacao",
    title: "O Guia do Dono de Obra: Como negociar com pedreiros e lojas usando dados",
    excerpt: "Não negocie no escuro. Saiba como usar seus números para conseguir os melhores descontos.",
    date: "2024-11-26",
    author: "Reforma Maestro",
    category: "Guia",
    content: `
      <h2>Por que ter dados ajuda na negociação?</h2>
      <p>Ter dados ajuda na negociação porque transforma "achismos" em fatos. Quando você sabe exatamente quanto tem no orçamento para cada item, você negocia com segurança e evita gastar o dinheiro da tinta comprando um piso mais caro.</p>
      
      <p>Ter os dados na mão é melhor que qualquer <a href="/blog/melhores-apps-gestao-obra-2024">app de gestão</a> complicado.</p>

      <h2>Como negociar com Pedreiros?</h2>
      <p>Para negociar com pedreiros, demonstre organização. Estabeleça pagamentos atrelados a entregas (ex: "Pagamento X ao terminar o reboco") e registre tudo. Isso mostra profissionalismo e evita pedidos de adiantamento sem justificativa.</p>
      
      <img src="/images/negociacao-obra.png" alt="Mãos apertando em acordo de negociação com calculadora e planilha ao fundo" class="w-full rounded-lg my-6 shadow-md" />

      <p>Ao fechar etapas, registre isso. Se ele pedir adiantamento, mostre no sistema: "Olha, pelo nosso cronograma financeiro, o pagamento é só dia X".</p>
      <p>Isso tira o lado pessoal e coloca a "culpa" no sistema.</p>
      
      <p>Evite cair na armadilha dos <a href="/blog/custos-invisiveis-obra">custos extras não planejados</a>.</p>

      <h2>Como negociar com Lojas de Material?</h2>
      <p>Use o teto de gastos da categoria como argumento. Se a torneira custa R$ 500,00 e seu saldo é R$ 400,00, seja transparente: "Meu limite é R$ 400,00. Se chegar nesse preço, levo agora". Vendedores respeitam limites claros.</p>

      <p><strong>Chegue na loja com o orçamento na palma da mão. Baixe a <a href="/#pricing">Planilha de Orçamento de Obra</a> no seu celular agora.</strong></p>
    `,
    faqSchema: `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [{
          "@type": "Question",
          "name": "Como saber se o orçamento do pedreiro está justo?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Compare com pelo menos 3 orçamentos detalhados. Desconfie de preços muito abaixo da média, pois geralmente escondem custos extras ou baixa qualidade."
          }
        }, {
          "@type": "Question",
          "name": "Vale a pena comprar todo o material de uma vez?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Depende do fluxo de caixa e espaço para armazenamento. Comprar tudo pode garantir descontos, mas exige capital imediato e local seguro para guardar."
          }
        }]
      }
      </script>
    `
  }
];
