import type { MarketType, AccountState } from '../App';
import type { AIStrategy } from './aiStrategies';
import type { GroundingChunk } from '@google/genai';
import type { BacktestResult } from '../components/BacktestPanel';

// --- API HELPER ---

const API_BASE = '/api'; // Assuming backend is served under /api path relative to the frontend.

async function handleApiResponse(response: Response) {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error || errorMessage;
    } catch (e) {
      // Not a JSON response, maybe plain text
      const textError = await response.text();
      if (textError) {
        errorMessage = `Resposta não é um JSON válido: "${textError}".`;
      }
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

async function get(endpoint: string) {
  return handleApiResponse(await fetch(`${API_BASE}${endpoint}`));
}

async function post(endpoint: string, body: object) {
  return handleApiResponse(await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

// --- REAL API FUNCTIONS ---

// Config
export const fetchConfig = () => get('/config');
export const saveConfig = (config: any) => post('/config', config);

// Bot Control
export const startBot = (mode: string, live: boolean) => post('/start_bot', { mode, live });
export const stopBot = () => post('/stop_bot', {});
export const startAIBot = (mode: string) => post('/start_ai_bot', { mode });
export const stopAIBot = () => post('/stop_ai_bot', {});

// AI Monitor List
export const fetchAIMonitorList = (): Promise<{ symbols: string[] }> => get('/ai_monitor_list');
export const setAIMonitorList = (symbols: string[]) => post('/ai_monitor_list', { symbols });

// Orders
export const sendManualOrder = (order: any) => post('/order', order);
export const sendMarketOrder = (order: { symbol: string; side: 'buy' | 'sell'; size: number; tp?: number; sl?: number }) => post('/market_order', order);
export const sendLimitOrder = (order: { symbol: string; side: 'buy' | 'sell'; size: number; price: number; tp?: number; sl?: number }) => post('/limit_order', order);

// Chart Data
export const fetchSymbols = (market: MarketType = 'futures'): Promise<{ symbols: string[] }> => get(`/symbols?market=${market}`);
export const fetchOhlcv = (symbol: string, timeframe: string): Promise<{ candles: [number, number, number, number, number][] }> => get(`/ohlcv?symbol=${symbol}&timeframe=${timeframe}`);
export const fetchKagi = (symbol: string, timeframe: string): Promise<{ kagi: [number, number][] }> => get(`/kagi?symbol=${symbol}&timeframe=${timeframe}`);
export const fetchMarketOverview = (): Promise<{ overview: { symbol: string; change: number }[] }> => get('/market_overview');

// Account Data
export const fetchAccountInfo = (): Promise<AccountState> => get('/account');
export const verifyBinanceAccount = (apiKey: string, userDoc: string): Promise<{ isValid: boolean; reason?: string }> => post('/verify_binance', { apiKey, userDoc });

// Backtesting
export const runBacktest = (symbol: string, strategy: AIStrategy, startDate: string, endDate: string): Promise<BacktestResult> => {
    return post('/backtest', { symbol, strategy, start_date: startDate, end_date: endDate });
};

// --- AI FUNCTIONS (Unchanged, they were already real) ---

// This will hold the initialized AI client instance.
let ai: any = null;

async function getAiClient() {
  if (ai) return ai;
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("A chave da API Gemini não está configurada. Não é possível usar os recursos de IA.");
    }
    ai = new GoogleGenAI({ apiKey });
    return ai;
  } catch (error) {
    console.error("Failed to dynamically import or initialize @google/genai:", error);
    throw new Error("Não foi possível carregar o módulo de IA. Verifique sua conexão com a internet.");
  }
}

export const askAI = async (prompt: string): Promise<{ text: string, citations: GroundingChunk[] }> => {
    try {
        const client = await getAiClient();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}]
            }
        });
        return {
            text: response.text,
            citations: response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
        };
    } catch(e) {
        console.error("Gemini API Error (askAI):", e);
        if (e instanceof Error) throw new Error(`Falha na comunicação com a IA: ${e.message}`);
        throw new Error("Ocorreu um erro desconhecido ao contatar a IA.");
    }
}

export const analyzeChartAI = async (symbol: string, forBot: boolean = false, strategy: string = 'AI_AUTO_SELECT') => {
    try {
        const ohlcv = await fetchOhlcv(symbol, '1h');
        if (!ohlcv || !ohlcv.candles || ohlcv.candles.length === 0) {
            throw new Error("Não foi possível obter dados do gráfico para análise.");
        }
        
        const recentCandles = ohlcv.candles.slice(-200);
        const ohlcvString = recentCandles.map((c: any[]) => `T: ${new Date(c[0]).toISOString()}, O: ${c[1]}, H: ${c[2]}, L: ${c[3]}, C: ${c[4]}`).join('\n');

        const botJsonInstructions = `**Regras de Saída:**
1.  Se uma oportunidade de trade de ALTA CONFIANÇA for identificada, responda **APENAS** com um objeto JSON. Não inclua texto explicativo fora do JSON. A estrutura deve ser:
    \`\`\`json
    {
      "signal": "buy" | "sell",
      "entry": number,
      "stop": number,
      "target": number,
      "reason": "Descrição concisa do padrão identificado (ex: Falso rompimento de H4, Engolfo de alta no suporte).",
      "drawings": [
        {
          "type": "RECTANGLE_ZONE" | "TREND_LINE" | "PIVOT_MARKER" | "HORIZONTAL_LINE",
          "...": "..."
        }
      ]
    }
    \`\`\`
2.  **Esquema de Desenho (Obrigatório):** O array \`drawings\` deve conter objetos que descrevem visualmente o setup. Use os timestamps e preços dos dados OHLCV.
    - **Zona Retangular (para FVG/OB):** \`{ "type": "RECTANGLE_ZONE", "startPrice": number, "endPrice": number, "label": "string", "color": "#RRGGBB" }\`
    - **Linha de Tendência (para Ondas):** \`{ "type": "TREND_LINE", "points": [ { "time": number_ms, "price": number }, { "time": number_ms, "price": number } ], "label": "string" }\`
    - **Marcador de Pivô (para Ondas):** \`{ "type": "PIVOT_MARKER", "time": number_ms, "price": number, "label": "string", "position": "aboveBar" | "belowBar" }\`
    - **Linha Horizontal (para Níveis):** \`{ "type": "HORIZONTAL_LINE", "price": number, "label": "string" }\`
3.  Se NENHUMA oportunidade de alta confiança for encontrada, responda **APENAS** com o JSON:
    \`\`\`json
    { "signal": "none" }
    \`\``;
        
        const humanMarkdownInstructions = `**Saída Esperada:** Forneça um resumo conciso em markdown da sua análise. Organize por padrão encontrado. Se nenhum padrão for encontrado, declare isso claramente.`;

        let strategyPrompt;
        const availableStrategiesForAuto = `"SMART_MONEY", "ELLIOTT_WAVE_3", "TOPS_BOTTOMS_REVERSAL", "PULLBACK_REVERSAL", "SUPPLY_DEMAND", "BREAKOUT_RETEST"`;

        switch(strategy) {
            case 'AI_AUTO_SELECT':
                strategyPrompt = `Você é um trader de elite e analista quantitativo. Sua tarefa é analisar o contexto do mercado para o ativo ${symbol} e, em seguida, selecionar a estratégia MAIS ADEQUADA para o momento atual e aplicá-la para encontrar um trade de alta probabilidade.

**Processo de Decisão em 2 Etapas:**
1.  **Análise de Contexto:** Primeiro, analise a estrutura de mercado dos dados OHLCV fornecidos. O mercado está em uma tendência clara (alta ou baixa)? Está consolidado em um range? Está volátil e sem direção?
2.  **Seleção de Estratégia:** Com base no contexto, escolha a melhor estratégia da seguinte lista: [${availableStrategiesForAuto}].
    *   Para mercados em **tendência**, use "PULLBACK_REVERSAL" ou "ELLIOTT_WAVE_3".
    *   Para mercados em **consolidação/range**, use "TOPS_BOTTOMS_REVERSAL" ou "SUPPLY_DEMAND".
    *   Após uma consolidação, se houver um **rompimento**, use "BREAKOUT_RETEST".
    *   Use "SMART_MONEY" se houver sinais claros de liquidez institucional (Order Blocks, FVGs) em qualquer contexto.
3.  **Execução da Análise:** Após escolher a estratégia, aplique seu framework operacional específico para encontrar um setup de trade, incluindo os desenhos no gráfico.

No campo "reason" do JSON de saída, especifique qual estratégia você escolheu e o padrão encontrado. Ex: "AI Choice (Smart Money): Teste de Order Block H1" ou "AI Choice (Pullback): Retração para a MME 20 em tendência de alta".

${forBot ? botJsonInstructions : humanMarkdownInstructions}`;
                break;

            case 'TOPS_BOTTOMS_REVERSAL':
                 strategyPrompt = `Você é um trader especialista em Price Action, focado em operações de reversão em topos e fundos. Sua tarefa é identificar setups de exaustão ou falsos rompimentos no ativo ${symbol}.

**Framework Operacional Estrito:**
1.  **Identifique Níveis Chave:** Encontre um topo ou fundo significativo. Para o trade, inclua um desenho \`{ "type": "HORIZONTAL_LINE", "price": <preço_do_nível>, "label": "Pivô Chave" }\`.
2.  **Procure por Sinais de Fraqueza:** No nível chave, procure por Falso Rompimento ou Padrões de Candlestick de reversão.
3.  **Gatilho e Ordens:** A entrada é na confirmação da reversão. O stop loss vai além do pavio do falso rompimento.

${forBot ? botJsonInstructions : humanMarkdownInstructions}`;
                break;

            case 'PULLBACK_REVERSAL':
                 strategyPrompt = `Você é um trader especialista em seguir tendências, operando reversões em pullbacks. Sua tarefa é identificar pontos de entrada de baixo risco a favor da tendência principal para o ativo ${symbol}.

**Framework Operacional Estrito:**
1.  **Identifique a Tendência Principal:** Confirme a tendência (topos/fundos ascendentes ou descendentes).
2.  **Aguarde o Pullback (Correção):** Espere um movimento corretivo saudável. Se identificar uma estrutura clara como um ABC, desenhe uma \`TREND_LINE\` para a correção.
3.  **Gatilho de Entrada:** Procure por um sinal de retomada da tendência (ex: Martelo, Engolfo de alta) em um nível de suporte.
4.  **Ordens:** O stop loss vai abaixo do fundo do pullback. O alvo é o rompimento do topo anterior da tendência.

${forBot ? botJsonInstructions : humanMarkdownInstructions}`;
                break;

            case 'SUPPLY_DEMAND':
                strategyPrompt = `Você é um trader de elite, especialista em Zonas de Oferta e Demanda. Sua tarefa é identificar setups de alta probabilidade para o ativo ${symbol} baseados nestes conceitos.

**Framework Operacional Estrito:**
1.  **Identifique Zonas Válidas:** Encontre uma Zona de Demanda (compra) ou Oferta (venda) "fresca", criada por um movimento explosivo. Para o trade, desenhe a zona usando \`{ "type": "RECTANGLE_ZONE", "startPrice": <topo_da_zona>, "endPrice": <fundo_da_zona>, "label": "Zona de Demanda/Oferta" }\`.
2.  **Gatilho de Entrada:** A entrada é acionada quando o preço retorna e toca a zona.
3.  **Stop Loss:** O stop loss deve ser posicionado com segurança além da borda distal da zona.

${forBot ? botJsonInstructions : humanMarkdownInstructions}`;
                break;
            
            case 'BREAKOUT_RETEST':
                strategyPrompt = `Você é um analista técnico especialista em Price Action, com foco em Rompimento e Reteste. Sua tarefa é identificar setups de alta probabilidade para o ativo ${symbol}.

**Framework Operacional Estrito:**
1.  **Identifique a Consolidação:** Encontre um range com suporte e resistência bem definidos.
2.  **Aguarde o Rompimento:** Procure por uma vela de momentum que feche decisivamente fora do range.
3.  **Gatilho de Entrada:** A entrada é acionada no reteste do nível rompido. Para o trade, desenhe o nível de S/R usando \`{ "type": "HORIZONTAL_LINE", "price": <preço_do_nível>, "label": "Nível de Rompimento" }\`.
4.  **Stop Loss:** O stop loss deve ser posicionado de volta para dentro do antigo range.

${forBot ? botJsonInstructions : humanMarkdownInstructions}`;
                break;

            case 'ELLIOTT_WAVE_3':
                strategyPrompt = `Você é um analista técnico de elite, especialista em Ondas de Elliott. Sua única tarefa é identificar setups de Onda 3 de alta probabilidade para o ativo ${symbol}.

**Framework Operacional Estrito:**
1.  **Identifique a Estrutura:** Procure por um claro impulso inicial (Onda 1) e uma correção (Onda 2).
2.  **Desenho Obrigatório:** Para validar o setup, você DEVE retornar no array \`drawings\`:
    a) Uma \`TREND_LINE\` para a Onda 1 (do pivô 0 ao 1).
    b) Uma \`TREND_LINE\` para a Onda 2 (do pivô 1 ao 2).
    c) Dois \`PIVOT_MARKER\`s para marcar o final das ondas 1 e 2 com os labels "1" e "2". Use os timestamps (em milissegundos) e preços exatos dos dados OHLCV para os pontos.
3.  **Gatilho de Entrada:** A entrada para a Onda 3 é no rompimento do topo da Onda 1.
4.  **Stop Loss:** Posicionado abaixo do início da Onda 1.
5.  **Alvo de Lucro:** Calcule usando a extensão de Fibonacci de 1.618 da Onda 1.

${forBot ? botJsonInstructions : humanMarkdownInstructions}`;
                break;
            
            case 'SMART_MONEY':
                strategyPrompt = `Você é um trader especialista em Smart Money Concepts (SMC/ICT). Sua tarefa é identificar setups de alta probabilidade para o ativo ${symbol} baseados em Order Blocks (OB) e Fair Value Gaps (FVG).

**Framework Operacional Estrito:**
1.  **Identifique Zonas de Interesse:** Encontre um Order Block (OB) ou Fair Value Gap (FVG) claro.
2.  **Desenho Obrigatório:** Para o trade, desenhe a zona identificada usando \`{ "type": "RECTANGLE_ZONE", "startPrice": <topo_da_zona>, "endPrice": <fundo_da_zona>, "label": "FVG" | "Order Block" }\`.
3.  **Gatilho de Entrada:** A entrada é acionada quando o preço retorna e testa a zona.
4.  **Stop Loss:** O stop loss deve ser posicionado com segurança além da zona.
5.  **Alvo de Lucro:** O alvo é a próxima zona de liquidez óbvia.

${forBot ? botJsonInstructions : humanMarkdownInstructions}`;
                break;

            case 'KAGI_REVERSAL':
            default:
                 strategyPrompt = `Você é um analista técnico de trading de elite. Sua tarefa é analisar os dados de candlestick fornecidos para o símbolo ${symbol} e identificar padrões de reversão ou continuação com foco em um framework operacional (swing trade).

**Padrões de Análise:**
1.  **Ranges de Negociação (Consolidações):** Marque as zonas de suporte e resistência que definem um range.
2.  **Falsos Rompimentos:** Procure por rompimentos de um range que falham e retornam para dentro da consolidação.
3.  **Padrões de Candlestick Relevantes:** Aponte padrões como Engolfo, Martelo, Doji em níveis de preço significativos.

${forBot ? botJsonInstructions : humanMarkdownInstructions}`;
                break;
        }


        const finalPrompt = `${strategyPrompt}\n\n**Dados do Gráfico (Últimas 200 Velas OHLCV para ${symbol}):**\n${ohlcvString}`;
        
        const client = await getAiClient();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: finalPrompt,
        });

        return response.text;
    } catch(e) {
        console.error("Gemini API Error (analyzeChartAI):", e);
        if (e instanceof Error) throw new Error(`Falha na análise da IA: ${e.message}`);
        throw new Error("Ocorreu um erro desconhecido ao analisar o gráfico com a IA.");
    }
}


// Other
export const setFocusSymbol = async (symbol: string) => {
    return post('/focus', { symbol });
};