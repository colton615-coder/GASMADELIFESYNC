import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface ActionButton {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
}
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  primaryAction?: ActionButton;
  secondaryAction?: ActionButton;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  primaryAction,
  secondaryAction,
}) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const currentY = useRef(0);
  const rootElement = document.getElementById('root');

  const handleClose = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(onClose, 300);
  }, [onClose]);

  // Focus trapping effect
  useEffect(() => {
    if (!isOpen) return;

    const sheet = sheetRef.current;
    if (!sheet) return;

    const focusableElements = sheet.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const previouslyFocusedElement = document.activeElement as HTMLElement;
    
    // Focus the first element when the modal opens
    firstElement?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
        return rootElement
          ? createPortal(
              <div
                ref={sheetRef}
                className={`fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm ${isOpen ? 'animate-in' : ''} ${isAnimatingOut ? 'animate-out' : ''}`}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
              >
                <div
                  className="w-full max-w-lg bg-surface-module rounded-t-2xl shadow-2xl p-6 relative"
                  role="document"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                    <button onClick={handleClose} className="p-2 rounded-full text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" aria-label="Close sheet">
                      <span className="sr-only">Close</span>
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  {children}
                  <div className="mt-6 flex gap-2 justify-end">
                    {secondaryAction && (
                      <button onClick={secondaryAction.onClick} disabled={secondaryAction.disabled} className={`px-4 py-2 rounded-md font-semibold ${secondaryAction.variant === 'primary' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white/10 text-indigo-300 hover:bg-white/20'} transition-colors`} aria-label={secondaryAction.label}>{secondaryAction.label}</button>
                    )}
                    {primaryAction && (
                      <button onClick={primaryAction.onClick} disabled={primaryAction.disabled} className={`px-4 py-2 rounded-md font-semibold ${primaryAction.variant === 'primary' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white/10 text-indigo-300 hover:bg-white/20'} transition-colors`} aria-label={primaryAction.label}>{primaryAction.label}</button>
                    )}
                  </div>
                </div>
              </div>,
              rootElement
            )
          : null;
      currentY.current = Math.max(0, deltaY); // Only allow dragging down
      
      if (sheetRef.current) {
          sheetRef.current.style.transform = `translateY(${currentY.current}px)`;
      }
  };
  
  const handleTouchEnd = () => {
      if (sheetRef.current && dragStartY.current !== null) {
          sheetRef.current.style.transition = 'transform 0.3s ease-out';
          const sheetHeight = sheetRef.current.clientHeight;

          if (currentY.current > sheetHeight / 3) { // If dragged more than a third of the way
              handleClose();
          } else {
              sheetRef.current.style.transform = 'translateY(0)';
          }
      }
      dragStartY.current = null;
      currentY.current = 0;
  };

  if (!isOpen || !rootElement) {
    return null;
  }

  return createPortal(
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center transition-opacity duration-300 ${isAnimatingOut ? 'opacity-0' : 'opacity-100'}`}
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="bottom-sheet-title"
    >
      <div
        ref={sheetRef}
        style={{ 
            backgroundColor: 'var(--color-surface-bottom-sheet)',
            transition: 'background-color 0.5s ease'
        }}
        className={`w-full max-w-lg rounded-t-2xl shadow-2xl flex flex-col ${isAnimatingOut ? 'bottom-sheet-anim-out' : 'bottom-sheet-anim-in'}`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <header className="flex-shrink-0 text-center p-4 border-b border-white/10 relative">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-600 rounded-full" aria-hidden="true"></div>
          <h2 id="bottom-sheet-title" className="font-semibold text-gray-200 mt-2">{title}</h2>
          
          <div className="absolute top-2 right-2 flex items-center gap-2">
            {secondaryAction && (
                <button 
                    onClick={secondaryAction.onClick} 
                    disabled={secondaryAction.disabled}
                    className="px-4 py-2 text-sm text-indigo-300 hover:bg-white/10 rounded-lg disabled:opacity-50"
                >
                    {secondaryAction.label}
                </button>
            )}
            {primaryAction && (
                <button 
                    onClick={primaryAction.onClick}
                    disabled={primaryAction.disabled} 
                    className="px-4 py-2 text-sm text-indigo-300 font-semibold hover:bg-white/10 rounded-lg disabled:opacity-50"
                >
                    {primaryAction.label}
                </button>
            )}
          </div>
        </header>
        
        <div className="overflow-y-auto">
            {children}
        </div>
      </div>
    </div>,
    rootElement
  );
};

export default BottomSheet;