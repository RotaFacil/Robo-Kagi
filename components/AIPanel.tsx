import React, { useState } from 'react';
import { askAI, analyzeChartAI } from '../lib/api';
import type { GroundingChunk } from '@google/genai';

interface AIPanelProps {
    focusSymbol: string;
    aiStrategy?: string;
}

type AITab = 'qa' | 'analysis';
type Message = { role: 'user' | 'model', text: string, citations?: GroundingChunk[] };

const LoadingSpinner = () => (
    <div className="flex justify-center items-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-400"></div>
        <span className="text-zinc-400">Analisando...</span>
    </div>
);

export default function AIPanel({ focusSymbol, aiStrategy }: AIPanelProps) {
    const [activeTab, setActiveTab] = useState<AITab>('analysis');
    const [qaPrompt, setQaPrompt] = useState('');
    const [qaHistory, setQaHistory] = useState<Message[]>([]);
    const [analysisResult, setAnalysisResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleQaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!qaPrompt.trim() || isLoading) return;
        
        const newHistory: Message[] = [...qaHistory, { role: 'user', text: qaPrompt }];
        setQaHistory(newHistory);
        setQaPrompt('');
        setIsLoading(true);
        setError(null);

        try {
            const result = await askAI(qaPrompt);
            setQaHistory([...newHistory, { role: 'model', text: result.text, citations: result.citations }]);
        } catch (err) {
            if (err instanceof Error) setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalysis = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setError(null);
        setAnalysisResult('');

        try {
            // forBot is false because this is for human consumption
            const result = await analyzeChartAI(focusSymbol, false, aiStrategy);
            setAnalysisResult(result);
        } catch (err) {
            if (err instanceof Error) setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-zinc-900 rounded-lg p-3 animate-fade-in-up">
            <div className="flex border-b border-zinc-700 text-sm font-semibold">
                <button
                    onClick={() => setActiveTab('analysis')}
                    className={`px-4 py-2 ${activeTab === 'analysis' ? 'text-amber-300 border-b-2 border-amber-300' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                    Análise Técnica IA
                </button>
                <button
                    onClick={() => setActiveTab('qa')}
                    className={`px-4 py-2 ${activeTab === 'qa' ? 'text-amber-300 border-b-2 border-amber-300' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                    Co-Piloto IA (P&R)
                </button>
            </div>
            <div className="pt-4 min-h-[200px]">
                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-200 px-3 py-2 rounded-lg text-sm my-2">
                        <p className="font-bold">Erro da IA</p>
                        <p>{error}</p>
                    </div>
                )}
                {activeTab === 'analysis' ? (
                    <div>
                        <button 
                            onClick={handleAnalysis}
                            disabled={isLoading}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded transition-colors w-full disabled:opacity-50 disabled:cursor-wait"
                        >
                           {isLoading ? 'Analisando...' : `Analisar Gráfico ${focusSymbol}`}
                        </button>
                        <div className="mt-4 text-zinc-300 whitespace-pre-wrap font-mono text-xs bg-zinc-950 p-3 rounded-md max-h-96 overflow-y-auto">
                            {isLoading && !analysisResult && <LoadingSpinner />}
                            {analysisResult || (!isLoading && 'Aguardando análise...')}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex-grow space-y-2 text-xs max-h-80 overflow-y-auto p-2">
                            {qaHistory.map((msg, idx) => (
                                <div key={idx} className={`p-2 rounded-lg ${msg.role === 'user' ? 'bg-zinc-800' : 'bg-zinc-700/50'}`}>
                                    <p className="font-bold text-amber-300 capitalize">{msg.role === 'model' ? 'Co-Piloto' : 'Você'}</p>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                    {msg.citations && msg.citations.length > 0 && (
                                        <div className="mt-2 text-xs border-t border-zinc-600 pt-1">
                                            <p className="font-semibold text-zinc-400">Fontes:</p>
                                            <ul className="list-disc list-inside">
                                                {msg.citations.map((cit: GroundingChunk, i) => (
                                                    <li key={i}><a href={cit.web?.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{cit.web?.title || cit.web?.uri}</a></li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && qaHistory.length > 0 && <LoadingSpinner />}
                        </div>
                        <form onSubmit={handleQaSubmit} className="flex gap-2 pt-2">
                            <input 
                                type="text"
                                value={qaPrompt}
                                onChange={(e) => setQaPrompt(e.target.value)}
                                placeholder="Pergunte sobre notícias, mercado, sentimentos..."
                                className="flex-grow bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                disabled={isLoading}
                            />
                            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded-md transition-colors disabled:opacity-50" disabled={isLoading || !qaPrompt.trim()}>Enviar</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}