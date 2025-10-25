import React, { useState, useEffect } from 'react';

const LOCAL_STORAGE_KEY = 'robo-kagi-notes';

const NotesPanel: React.FC = () => {
    const [notes, setNotes] = useState<string>('');
    const [isSaved, setIsSaved] = useState(true);

    useEffect(() => {
        const savedNotes = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedNotes) {
            setNotes(savedNotes);
        }
    }, []);

    useEffect(() => {
        setIsSaved(false);
        const timer = setTimeout(() => {
            localStorage.setItem(LOCAL_STORAGE_KEY, notes);
            setIsSaved(true);
        }, 1000); // Debounce saving

        return () => clearTimeout(timer);
    }, [notes]);

    return (
        <div className="flex flex-col h-full">
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Escreva aqui seu checklist de melhorias, análises e próximas ações..."
                className="w-full h-full flex-grow bg-zinc-800 border border-zinc-700 rounded-md p-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none min-h-[350px]"
                aria-label="Painel de Anotações"
            />
            <div className="text-right text-xs text-zinc-500 mt-2 h-4">
                {isSaved ? 'Salvo' : 'Salvando...'}
            </div>
        </div>
    );
};

export default NotesPanel;
