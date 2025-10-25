import React, { useEffect } from 'react';

export interface ToastMessage { 
    id: number; 
    message: string; 
    type: 'success' | 'error' | 'info'; 
}

const icons = {
    success: (
        <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/></svg>
    ),
    error: (
         <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"/></svg>
    ),
    info: (
        <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/></svg>
    )
};

const typeClasses = {
    success: "text-green-400 bg-green-900/50",
    error: "text-red-400 bg-red-900/50",
    info: "text-blue-400 bg-blue-900/50"
};

export const Toast = ({ message, type, onDismiss }: { message: string, type: 'success' | 'error' | 'info', onDismiss: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 8000); // Increased duration for info toasts
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const baseClasses = "flex items-center w-full max-w-xs p-4 mb-4 text-zinc-200 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 animate-fade-in-up";
    
    return (
        <div className={baseClasses} role="alert">
            <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${typeClasses[type]} rounded-lg`}>
                {icons[type]}
            </div>
            <div className="ms-3 text-sm font-normal">{message}</div>
            <button type="button" onClick={onDismiss} className="ms-auto -mx-1.5 -my-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg focus:ring-2 focus:ring-zinc-600 p-1.5 hover:bg-zinc-700 inline-flex items-center justify-center h-8 w-8" aria-label="Close">
                <span className="sr-only">Close</span>
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
            </button>
        </div>
    );
};