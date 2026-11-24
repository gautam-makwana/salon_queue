// src/components/ui/Modal.jsx
import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-softblack/50 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-float border border-softblack-border/80 w-full max-w-lg relative animate-in fade-in zoom-in-95 duration-200">
        {title && (
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-softblack-border/60">
            <h2 className="text-lg font-bold text-softblack tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="text-softblack-muted hover:text-softblack hover:bg-offwhite rounded-xl p-1.5 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
