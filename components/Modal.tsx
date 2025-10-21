import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
    >
      <div className="bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl border border-zinc-700 m-4 animate-fade-in-up">
        <div className="flex justify-between items-center p-4 border-b border-zinc-800">
          <h3 id="modal-title" className="text-xl font-semibold text-amber-300">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-white transition-colors text-3xl leading-none p-1"
            aria-label="Fechar modal"
          >
            &times;
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
