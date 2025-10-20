import React, { useEffect, useRef, useCallback } from 'react';

const ITEM_HEIGHT = 48; // Corresponds to h-12 in Tailwind
const VISIBLE_ITEMS = 5; // Total visible items in the wheel

interface PickerColumnProps {
  options: (string | number)[];
  value: string | number;
  onChange: (newValue: string | number) => void;
  id: string;
}

const PickerColumn: React.FC<PickerColumnProps> = ({ options, value, onChange, id }) => {
  const columnRef = useRef<HTMLUListElement>(null);
  const isInteracting = useRef(false);
  const interactionTimeout = useRef<number | null>(null);

  const selectedIndex = options.findIndex(opt => opt === value);

  const snapToValue = useCallback((targetValue: string | number, behavior: 'smooth' | 'auto' = 'smooth') => {
    const element = columnRef.current;
    if (!element) return;

    const index = options.findIndex(opt => opt === targetValue);
    if (index !== -1) {
      element.scrollTo({ top: index * ITEM_HEIGHT, behavior });
    }
  }, [options]);

  useEffect(() => {
    const element = columnRef.current;
    if (element && !isInteracting.current) {
        snapToValue(value, 'auto');
    }
  }, [options, value, snapToValue]);

  const handleScroll = () => {
    const element = columnRef.current;
    if (!element) return;

    isInteracting.current = true;
    if (interactionTimeout.current) {
      clearTimeout(interactionTimeout.current);
    }

    interactionTimeout.current = window.setTimeout(() => {
      isInteracting.current = false;
      const { scrollTop } = element;
      const newSelectedIndex = Math.round(scrollTop / ITEM_HEIGHT);
      const newValue = options[newSelectedIndex];
      
      if (newValue !== undefined) {
          snapToValue(newValue); // Snap to the final position
          if(newValue !== value) {
              onChange(newValue);
          }
      }
    }, 150);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
      e.preventDefault();
      let newIndex = selectedIndex;

      if (e.key === 'ArrowDown') {
          newIndex = Math.min(options.length - 1, selectedIndex + 1);
      } else if (e.key === 'ArrowUp') {
          newIndex = Math.max(0, selectedIndex - 1);
      }

      if (newIndex !== selectedIndex) {
          const newValue = options[newIndex];
          onChange(newValue);
      }
  };

  return (
    <div className="h-full flex-1 overflow-hidden">
      <ul
        ref={columnRef}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="h-full w-full overflow-y-scroll scroll-snap-y-mandatory hide-scrollbar focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-md"
        style={{
          scrollPaddingTop: `${(VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT}px`,
        }}
        role="listbox"
        tabIndex={0}
        aria-labelledby={id}
        aria-activedescendant={`${id}-${selectedIndex}`}
      >
        {/* Top padding to allow first item to be centered */}
        <li style={{ height: `${(VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT}px` }} className="scroll-snap-align-start"></li>

        {options.map((option, index) => (
          <li
            key={option}
            id={`${id}-${index}`}
            role="option"
            aria-selected={value === option}
            className="h-12 flex items-center justify-center text-xl scroll-snap-align-start transition-colors"
            style={{ color: value === option ? 'white' : 'rgb(107 114 128)' }}
          >
            {option}
          </li>
        ))}
        
        {/* Bottom padding */}
        <li style={{ height: `${(VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT}px` }}></li>
      </ul>
      <style>{`.hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; } .hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};


interface WheelPickerProps {
  options: (string | number)[][];
  value: (string | number)[];
  onChange: (newValue: (string | number)[]) => void;
}

const WheelPicker: React.FC<WheelPickerProps> = ({ options, value, onChange }) => {
  return (
    <>
      <div className="sr-only" id="year-label">Year</div>
      <div className="sr-only" id="month-label">Month</div>
      <div className="sr-only" id="day-label">Day</div>
      <main 
          className="relative flex justify-center"
          style={{ height: `${VISIBLE_ITEMS * ITEM_HEIGHT}px` }}
      >
          {/* Selection Indicator */}
          <div 
              className="absolute top-1/2 left-0 right-0 h-12 bg-white/5 border-y border-white/20 -translate-y-1/2 pointer-events-none"
              style={{ height: `${ITEM_HEIGHT}px` }}
              aria-hidden="true"
          ></div>
          
          {/* Fading Gradients */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#1f1f1f]/90 to-transparent pointer-events-none" style={{height: `${ITEM_HEIGHT * 2}px`}} aria-hidden="true"></div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#1f1f1f]/90 to-transparent pointer-events-none" style={{height: `${ITEM_HEIGHT * 2}px`}} aria-hidden="true"></div>

          {options.map((colOpts, i) => {
              const ids = ["year-label", "month-label", "day-label"];
              return (
                  <PickerColumn
                      key={i}
                      id={ids[i]}
                      options={colOpts}
                      value={value[i]}
                      onChange={(newColValue) => {
                          const newValue = [...value];
                          newValue[i] = newColValue;
                          onChange(newValue);
                      }}
                  />
              )
          })}
      </main>
    </>
  );
};

export default WheelPicker;