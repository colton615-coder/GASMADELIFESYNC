// ...existing code...


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

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      dragStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current !== null && e.touches.length === 1) {
      const deltaY = e.touches[0].clientY - dragStartY.current;
      currentY.current = Math.max(0, deltaY);
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${currentY.current}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (sheetRef.current && dragStartY.current !== null) {
      sheetRef.current.style.transition = 'transform 0.3s ease-out';
      const sheetHeight = sheetRef.current.clientHeight;
      if (currentY.current > sheetHeight / 3) {
        handleClose();
      } else {
        sheetRef.current.style.transform = 'translateY(0)';
      }
    }
    dragStartY.current = null;
    currentY.current = 0;
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartY.current = e.clientY;
    document.addEventListener('mousemove', handleMouseMove as any);
    document.addEventListener('mouseup', handleMouseUp as any);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragStartY.current !== null) {
      const deltaY = e.clientY - dragStartY.current;
      currentY.current = Math.max(0, deltaY);
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${currentY.current}px)`;
      }
    }
  };

  const handleMouseUp = () => {
    if (sheetRef.current && dragStartY.current !== null) {
      sheetRef.current.style.transition = 'transform 0.3s ease-out';
      const sheetHeight = sheetRef.current.clientHeight;
      if (currentY.current > sheetHeight / 3) {
        handleClose();
      } else {
        sheetRef.current.style.transform = 'translateY(0)';
      }
    }
    dragStartY.current = null;
    currentY.current = 0;
    document.removeEventListener('mousemove', handleMouseMove as any);
    document.removeEventListener('mouseup', handleMouseUp as any);
  };

  // Focus trapping effect
  useEffect(() => {
    if (!isOpen) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const focusableElements = sheet.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    firstElement?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    sheet.addEventListener('keydown', handleKeyDown);
    return () => {
      sheet.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

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
        onMouseDown={handleMouseDown}
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
    rootElement as Element
  );
};

export default BottomSheet;