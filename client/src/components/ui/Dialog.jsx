import React, { useEffect } from 'react';

const Dialog = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      {/* Content Container */}
      <div className="relative z-50 w-full max-w-lg p-6 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {children}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const DialogHeader = ({ className = '', ...props }) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left mb-4 ${className}`} {...props} />
);

const DialogTitle = ({ className = '', ...props }) => (
  <h2 className={`text-lg font-semibold leading-none tracking-tight text-zinc-900 ${className}`} {...props} />
);

const DialogDescription = ({ className = '', ...props }) => (
  <p className={`text-sm text-zinc-500 ${className}`} {...props} />
);

const DialogFooter = ({ className = '', ...props }) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 ${className}`} {...props} />
);

export { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
