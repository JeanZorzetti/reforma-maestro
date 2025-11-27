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
      <h2>O perigo do "caderninho"</h2>
      <p>Você decidiu reformar. Comprou o primeiro saco de cimento, contratou o pedreiro e anotou tudo num caderno ou no bloco de notas do celular. Parece controle, certo? <strong>Errado.</strong></p>
      <p>O problema do caderno é que ele não soma, não projeta e não avisa quando o dinheiro vai acabar. Ele é apenas um cemitério de números mortos.</p>

      <h2>Previsto vs. Realizado: O segredo das construtoras</h2>
      <p>Grandes construtoras não quebram porque elas usam um conceito simples: <strong>Previsto vs. Realizado</strong>.</p>
      <ul>
        <li><strong>Previsto:</strong> Quanto você PLANEJA gastar (ex: R$ 500,00 em tinta).</li>
        <li><strong>Realizado:</strong> Quanto você REALMENTE gastou (ex: R$ 580,00 porque a tinta subiu).</li>
      </ul>
      <p>Se você não monitora essa diferença item a item, no final da obra o rombo pode chegar a 30% ou 40% do valor total.</p>

      <h2>Planilha Grátis vs. Sistema Especializado</h2>
      <p>Existem milhares de planilhas grátis na internet. Elas quebram um galho, mas geralmente:</p>
      <ul>
        <li>São complexas demais (feitas para engenheiros).</li>
        <li>Ou simples demais (não têm relatórios).</li>
        <li>Exigem que você saiba fórmulas de Excel.</li>
      </ul>

      <h3>A Solução Definitiva</h3>
      <p>Você não precisa fazer um curso de Excel para reformar seu banheiro. Você precisa de uma ferramenta pronta, pensada para quem não é da área.</p>

      <p><strong>Pare de tentar reinventar a roda no Excel. Baixe nosso Sistema Pronto por R$ 47,90 e comece a controlar sua obra em 5 minutos.</strong></p>
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
      <h2>O mistério do dinheiro que some</h2>
      <p>Você orçou o piso, a tinta e a mão de obra. A conta fechou. Mas no meio da obra, o dinheiro acabou. O que aconteceu?</p>
      <p>Você foi vítima dos <strong>Custos Invisíveis</strong>.</p>

      <h2>Os 5 Vilões do Orçamento</h2>
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

      <h2>Como evitar?</h2>
      <p>A única forma é registrar TUDO. Até o parafuso de R$ 0,50.</p>

      <p><strong>Nosso Gestor Financeiro tem categorias de alerta para esses gastos invisíveis. Não deixe o dinheiro vazar pelo ralo.</strong></p>
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
      <h2>Softwares de Engenharia vs. Realidade</h2>
      <p>Se você pesquisar "gestão de obras", vai encontrar softwares incríveis como Sienge ou Obra Prima. Eles são ótimos... para construtoras que gerenciam prédios inteiros.</p>
      <p>Para quem está reformando um apartamento, eles são:</p>
      <ul>
        <li>Caros (mensalidades altas).</li>
        <li>Difíceis de configurar.</li>
        <li>Cheios de funções inúteis para você.</li>
      </ul>

      <h2>O bom e velho Caderno?</h2>
      <p>Já falamos dele. É arriscado, não faz backup e não calcula nada. Perdeu o caderno, perdeu o controle.</p>

      <h2>Por que o Google Sheets é o Campeão?</h2>
      <p>O Google Sheets (planilhas do Google) é a ferramenta perfeita para o dono de obra moderna:</p>
      <ul>
        <li><strong>Nuvem:</strong> Acesse do celular na loja de material ou no computador em casa.</li>
        <li><strong>Gratuito:</strong> Você não paga mensalidade pelo uso da plataforma.</li>
        <li><strong>Flexível:</strong> Pode ser adaptado exatamente para o que você precisa.</li>
        <li><strong>Compartilhável:</strong> Mande para seu cônjuge ou arquiteto em tempo real.</li>
      </ul>

      <h3>Mas começar do zero é difícil...</h3>
      <p>Criar uma planilha inteligente no Sheets dá trabalho. Fórmulas, gráficos, validação de dados...</p>
      <p>É por isso que criamos o Gestor Financeiro de Obras 1.0. Ele pega toda a potência do Google Sheets e entrega pronta para uso.</p>

      <p><strong>Tenha a potência de um software com a simplicidade de uma planilha. Conheça o Gestor 1.0.</strong></p>
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
      <h2>Informação é Poder</h2>
      <p>Imagine chegar na loja de materiais e o vendedor te oferecer um "desconto imperdível" se você levar o piso da marca X. Você aceita?</p>
      <p>Se você não sabe quanto tem no orçamento para piso, você está negociando no escuro. Pode estar gastando o dinheiro da tinta sem saber.</p>

      <h2>Como negociar com Pedreiros</h2>
      <p>Pedreiros experientes sabem quando o cliente está perdido. Se você demonstra controle, o jogo muda.</p>
      <p>Ao fechar etapas (ex: "Pagamento de R$ 2.000,00 ao terminar o reboco"), registre isso. Se ele pedir adiantamento, mostre no sistema: "Olha, pelo nosso cronograma financeiro, o pagamento é só dia X".</p>
      <p>Isso tira o lado pessoal e coloca a "culpa" no sistema.</p>

      <h2>Como negociar com Lojas</h2>
      <p>Com o Gestor Financeiro, você sabe exatamente quanto pode gastar em cada categoria. Se a torneira custa R$ 500,00 e seu saldo para metais é R$ 400,00, você tem um argumento sólido:</p>
      <p><em>"Amigo, meu teto para essa torneira é R$ 400,00. Se fizer por esse preço eu levo, senão estouro meu caixa."</em></p>
      <p>Vendedores respeitam limites claros.</p>

      <p><strong>Chegue na loja com o orçamento na palma da mão. Baixe o Gestor Financeiro no seu celular agora.</strong></p>
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
