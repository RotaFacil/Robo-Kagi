import type { MarketType } from '../App';

const API_BASE_URL = 'http://localhost:8000';

// This will hold the initialized AI client instance.
// Using `any` because the type is from a dynamically imported module.
let ai: any = null;

/**
 * Dynamically imports the Google AI module and initializes the client.
 * This function is designed to be called only when an AI feature is used,
 * preventing the AI SDK from blocking the initial app load.
 */
async function getAiClient() {
  // Return the existing client if already initialized.
  if (ai) {
    return ai;
  }

  try {
    // Dynamically import the GoogleGenAI class from the module.
    const { GoogleGenAI } = await import('@google/genai');

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY for Gemini is not set in environment variables.");
      throw new Error("A chave da API Gemini não está configurada. Não é possível usar os recursos de IA.");
    }
    
    // Create and cache the client instance.
    ai = new GoogleGenAI({ apiKey });
    return ai;

  } catch (error) {
    console.error("Failed to dynamically import or initialize @google/genai:", error);
    throw new Error("Não foi possível carregar o módulo de IA. Verifique sua conexão com a internet.");
  }
}


async function fetchAPI(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    const responseData = await response.json().catch(() => ({ msg: 'Resposta não é um JSON válido' }));
    if (!response.ok) {
        throw new Error(responseData.msg || `Falha na requisição com status: ${response.status}`);
    }
    return responseData;
  } catch (error) {
    console.error(`API Error on ${url}:`, error);
    if (error instanceof Error) {
        // Re-throw custom error messages from the backend or a generic one
        throw new Error(error.message || 'Erro de conexão com o backend.');
    }
    throw new Error('Ocorreu um erro desconhecido.');
  }
}

// Config
export const fetchConfig = () => fetchAPI('/config');
export const saveConfig = (config: any) => fetchAPI('/config', { method: 'POST', body: JSON.stringify(config) });

// Kagi Bot Control
export const startBot = (mode: string, live: boolean) => fetchAPI(`/start_kagi_bot?mode=${mode}&live=${live}`);
export const stopBot = () => fetchAPI('/stop_kagi_bot');

// AI Bot Control
export const startAIBot = () => fetchAPI('/start_ai_bot');
export const stopAIBot = () => fetchAPI('/stop_ai_bot');
export const fetchAIMonitorList = () => fetchAPI('/ai_monitor_list');
export const setAIMonitorList = (symbols: string[]) => fetchAPI('/ai_monitor_list', { method: 'POST', body: JSON.stringify({ symbols }) });


// Orders
export const sendManualOrder = (order: any) => fetchAPI('/order', { method: 'POST', body: JSON.stringify(order) });
export const sendMarketOrder = (order: { symbol: string; side: 'buy' | 'sell'; size: number; tp?: number; sl?: number }) => fetchAPI('/market_order', { method: 'POST', body: JSON.stringify(order) });

// Chart Data
export const fetchSymbols = (market: MarketType = 'futures') => fetchAPI(`/symbols?market=${market}`);
export const fetchOhlcv = (symbol: string) => fetchAPI(`/ohlcv?symbol=${encodeURIComponent(symbol)}`);
export const fetchKagi = (symbol: string) => fetchAPI(`/kagi?symbol=${encodeURIComponent(symbol)}`);

// Account Data
export const fetchAccountInfo = () => fetchAPI('/account');

// AI Functions
export const askAI = async (prompt: string) => {
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

export const analyzeChartAI = async (symbol: string, forBot: boolean = false, strategy: string = 'KAGI_REVERSAL') => {
    try {
        const ohlcv = await fetchOhlcv(symbol);
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
      "reason": "Descrição concisa do padrão identificado (ex: Falso rompimento de H4, Engolfo de alta no suporte)."
    }
    \`\`\`
2.  Se NENHUMA oportunidade de alta confiança for encontrada, responda **APENAS** com o JSON:
    \`\`\`json
    { "signal": "none" }
    \`\`\``;
        
        const humanMarkdownInstructions = `**Saída Esperada:** Forneça um resumo conciso em markdown da sua análise. Organize por padrão encontrado. Se nenhum padrão for encontrado, declare isso claramente.`;

        let strategyPrompt;

        switch(strategy) {
            case 'ELLIOTT_WAVE_3':
                strategyPrompt = `Você é um analista técnico de elite, especialista em Ondas de Elliott. Sua única tarefa é identificar setups de Onda 3 de alta probabilidade para o ativo ${symbol}.

**Framework Operacional Estrito:**
1.  **Identifique a Estrutura:** Procure por um claro movimento de impulso inicial (Onda 1), seguido por uma correção (Onda 2) que não ultrapasse o início da Onda 1.
2.  **Gatilho de Entrada:** A entrada para a Onda 3 é acionada no rompimento do topo da Onda 1 (para uma compra) ou na perda do fundo da Onda 1 (para uma venda).
3.  **Stop Loss:** O stop loss deve ser posicionado abaixo do início da Onda 1 (para uma compra) ou acima do início da Onda 1 (para uma venda).
4.  **Alvo de Lucro:** Calcule o alvo de lucro principal usando a extensão de Fibonacci de 1.618 do tamanho da Onda 1, projetado a partir do final da Onda 2.

${forBot ? botJsonInstructions : humanMarkdownInstructions}`;
                break;
            
            case 'SMART_MONEY':
                strategyPrompt = `Você é um trader especialista em Smart Money Concepts (SMC/ICT). Sua tarefa é identificar setups de alta probabilidade para o ativo ${symbol} baseados em Order Blocks (OB) e Fair Value Gaps (FVG).

**Framework Operacional Estrito:**
1.  **Identifique Zonas de Interesse:**
    *   **Order Block (OB):** Encontre a última vela de baixa antes de um forte movimento de alta (OB de alta), ou a última vela de alta antes de um forte movimento de baixa (OB de baixa).
    *   **Fair Value Gap (FVG) / Imbalance:** Identifique um "gap" entre três velas, onde há um desequilíbrio entre compradores e vendedores.
2.  **Gatilho de Entrada:** A entrada é acionada quando o preço retorna e testa uma dessas zonas. A entrada deve ser na abertura da zona (ex: no topo de um FVG de baixa, ou na abertura de um OB de alta).
3.  **Stop Loss:** O stop loss deve ser posicionado com segurança além da zona (ex: acima do pavio da vela que criou o FVG, ou abaixo do pavio do OB de alta).
4.  **Alvo de Lucro:** O alvo inicial é a próxima zona de liquidez óbvia (ex: um topo ou fundo anterior).

${forBot ? botJsonInstructions : humanMarkdownInstructions}`;
                break;

            case 'KAGI_REVERSAL':
            default:
                 strategyPrompt = `Você é um analista técnico de trading de elite. Sua tarefa é analisar os dados de candlestick fornecidos para o símbolo ${symbol} e identificar padrões de reversão ou continuação com foco em um framework operacional (swing trade).

**Padrões de Análise:**
1.  **Ranges de Negociação (Consolidações):** Marque as zonas de suporte e resistência que definem um range.
2.  **Falsos Rompimentos:** Procure por rompimentos de um range que falham e retornam para dentro da consolidação.
3.  **Padrões de Candlestick Relevantes:** Aponte padrões como Engolfo, Martelo, Doji em níveis de preço significativos (suporte, resistência, etc.).

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
    try {
        const response = await fetch(`${API_BASE_URL}/focus?symbol=${encodeURIComponent(symbol)}`);
        if (!response.ok) {
            throw new Error('Falha ao definir o símbolo de foco.');
        }
    } catch(e) {
        console.error("Failed to set focus symbol", e);
        if (e instanceof Error) throw e;
    }
};