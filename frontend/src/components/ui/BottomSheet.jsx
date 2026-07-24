// src/components/ui/BottomSheet.jsx — REDESIGNED (surface tokens, plain title, ghost close button)
import { X } from 'lucide-react';

export default function BottomSheet({ open, onClose, title, children, footer }) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] z-40 transition-opacity duration-200 md:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed left-0 right-0 bottom-0 z-50 bg-surface rounded-t-[var(--radius-xl)] shadow-xl md:hidden max-h-[85vh] flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-gray-200 shrink-0">
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          <button
            onClick={onClose}
            className="focus-ring press-scale p-1.5 -mr-1.5 rounded-[var(--radius-sm)] text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex-1">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-gray-200 shrink-0">{footer}</div>}
      </div>
    </>
  );
}