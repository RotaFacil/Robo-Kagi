export type AIStrategy = 
  'AI_AUTO_SELECT' | 
  'SMART_MONEY' | 
  'ELLIOTT_WAVE_3' | 
  'TOPS_BOTTOMS_REVERSAL' | 
  'PULLBACK_REVERSAL' | 
  'SUPPLY_DEMAND' | 
  'BREAKOUT_RETEST' | 
  'KAGI_REVERSAL';

export const aiStrategyOptions: { value: AIStrategy; label: string }[] = [
    { value: 'AI_AUTO_SELECT', label: 'Seleção Automática da IA (Recomendado)' },
    { value: 'SMART_MONEY', label: 'Smart Money (Order Block + FVG)' },
    { value: 'ELLIOTT_WAVE_3', label: 'Onda 3 de Elliott' },
    { value: 'TOPS_BOTTOMS_REVERSAL', label: 'Reversão de Topos e Fundos' },
    { value: 'PULLBACK_REVERSAL', label: 'Reversão em Pullback' },
    { value: 'SUPPLY_DEMAND', label: 'Zonas de Oferta e Demanda' },
    { value: 'BREAKOUT_RETEST', label: 'Rompimento e Reteste' },
    { value: 'KAGI_REVERSAL', label: 'Reversão Kagi (Legacy)' },
];

export const aiStrategyDescriptions: Record<AIStrategy, { title: string; framework: string[] }> = {
  'AI_AUTO_SELECT': {
    title: 'Deixa a IA analisar o contexto do mercado e escolher a tática mais adequada.',
    framework: [
      'Análise de Contexto: Determina se o mercado está em tendência, consolidação ou volátil.',
      'Seleção de Estratégia: Escolhe a melhor tática (Pullback, Reversão, Rompimento, etc.) para o contexto atual.',
      'Execução: Aplica a estratégia escolhida para encontrar o trade de maior probabilidade.'
    ]
  },
  'SMART_MONEY': {
    title: 'Identifica setups baseados em conceitos de Smart Money (SMC/ICT).',
    framework: [
      'Identificar Zonas de Interesse: Procura por Order Blocks (OB) ou Fair Value Gaps (FVG) claros.',
      'Gatilho de Entrada: A entrada é acionada quando o preço retorna e testa a zona identificada.',
      'Stop Loss: Posicionado com segurança além da borda da zona.'
    ]
  },
  'ELLIOTT_WAVE_3': {
    title: 'Procura por setups de Onda 3 de Elliott, que representam o impulso mais forte de uma tendência.',
    framework: [
      'Identificar Estrutura: Procura por um impulso inicial claro (Onda 1) e uma correção (Onda 2).',
      'Gatilho de Entrada: A entrada para a Onda 3 é no rompimento do topo da Onda 1.',
      'Stop Loss: Posicionado abaixo do início da Onda 1 (pivô 0).'
    ]
  },
  'TOPS_BOTTOMS_REVERSAL': {
    title: 'Foca em operações de reversão em topos e fundos significativos do preço.',
    framework: [
      'Identificar Níveis Chave: Encontra um topo ou fundo relevante no gráfico.',
      'Procurar por Sinais de Fraqueza: Busca por Falsos Rompimentos ou Padrões de Candlestick de reversão no nível chave.',
      'Gatilho e Ordens: A entrada é na confirmação da reversão.'
    ]
  },
  'PULLBACK_REVERSAL': {
    title: 'Opera a favor da tendência, buscando entradas de baixo risco durante as correções (pullbacks).',
    framework: [
      'Identificar a Tendência Principal: Confirma se o mercado está em tendência de alta ou baixa.',
      'Aguardar o Pullback: Espera um movimento corretivo em direção a uma área de valor (ex: média móvel).',
      'Gatilho de Entrada: Procura por um sinal de retomada da tendência no final do pullback.'
    ]
  },
  'SUPPLY_DEMAND': {
    title: 'Identifica setups baseados em Zonas de Oferta (venda) e Demanda (compra).',
    framework: [
      'Identificar Zonas Válidas: Encontra uma zona "fresca" criada por um movimento de preço explosivo.',
      'Gatilho de Entrada: A entrada é acionada quando o preço retorna e toca a zona.',
      'Stop Loss: Posicionado com segurança além da borda oposta da zona.'
    ]
  },
  'BREAKOUT_RETEST': {
    title: 'Foca em operar o reteste de um nível de suporte ou resistência após um rompimento.',
    framework: [
      'Identificar a Consolidação: Encontra um range com suporte e resistência bem definidos.',
      'Aguardar o Rompimento: Procura por um fechamento de vela decisivo fora do range.',
      'Gatilho de Entrada: A entrada é acionada quando o preço retorna e "retesta" o nível rompido.'
    ]
  },
  'KAGI_REVERSAL': {
    title: 'Estratégia legada que usa a reversão do gráfico Kagi como principal gatilho de entrada.',
    framework: [
      'Análise de Contexto: Usa a estrutura do gráfico Kagi para identificar a tendência.',
      'Gatilho de Entrada: A entrada é acionada quando uma nova linha de ombro (compra) ou cintura (venda) é formada.',
      'Stop Loss: Baseado na linha Kagi anterior.'
    ]
  }
};
