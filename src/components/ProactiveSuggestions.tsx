import React, { useMemo } from 'react';
import { useSuggestionEngine, Suggestion } from '@/hooks/useSuggestionEngine';
import { useNavigate } from 'react-router-dom';

const ProactiveSuggestions: React.FC<{ setActiveModule?: (m: string) => void }> = ({ setActiveModule }) => {
  const { suggestions, dismissSuggestion, snoozeSuggestion } = useSuggestionEngine();
  const navigate = useNavigate();

  const memoizedSuggestionEngine = useMemo(() => ({ suggestions, dismissSuggestion, snoozeSuggestion }), [suggestions, dismissSuggestion, snoozeSuggestion]);

  if (!suggestions || suggestions.length === 0) {
    return null; // render nothing when there are no suggestions
  }

  return (
    <div className="p-4 space-y-3">
      {suggestions.map((s: Suggestion) => (
        <div key={s.id} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">{s.title}</h3>
              <p className="text-xs text-slate-300 mt-1">{s.description}</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              {s.action?.label ? (
                <button
                  className="px-3 py-1 text-sm rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => {
                    if (s.action?.callback) {
                      s.action.callback();
                    } else {
                      if (s.type === 'mood') {
                        if (setActiveModule) setActiveModule('MINDFUL_MOMENTS');
                        navigate('/mindful-moments');
                      }
                      if (s.type === 'task') {
                        if (setActiveModule) setActiveModule('TASKS');
                        navigate('/tasks');
                      }
                      if (s.type === 'habit') {
                        if (setActiveModule) setActiveModule('HABITS');
                        navigate('/habits');
                      }
                    }
                  }}
                >
                  {s.action.label}
                </button>
              ) : null}
              <button
                className="ml-2 px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-800 text-slate-300"
                onClick={() => dismissSuggestion(s.id)}
                aria-label="Dismiss suggestion"
              >Dismiss</button>
              <button
                className="ml-2 px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-800 text-slate-300"
                onClick={() => snoozeSuggestion(s.id, 120)}
                aria-label="Snooze suggestion"
              >Snooze 2h</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProactiveSuggestions;