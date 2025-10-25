import React from 'react';
import useSuggestionEngine, { Suggestion } from '@/hooks/useSuggestionEngine';
import { useNavigate } from 'react-router-dom';

export default function ProactiveSuggestions({ setActiveModule }: { setActiveModule?: (m: string) => void }) {
  const { suggestions, dismissSuggestion, snoozeSuggestion } = useSuggestionEngine();
  const navigate = useNavigate();

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
}
import React from 'react';
import { SparklesIcon } from '@/components/icons';

const ProactiveSuggestions: React.FC<{ setActiveModule: (module: string) => void }> = ({ setActiveModule }) => {
  const handleRequestAnalysis = () => {
    // This functionality will be expanded later. For now, it logs the action.
    console.log('User requested analysis.');
    // A potential future action could be: setActiveModule('WEEKLY_REVIEW');
  };

  return (
    <button
      onClick={handleRequestAnalysis}
      className="w-full flex items-center justify-center gap-4 p-6 bg-white/5 rounded-2xl border border-indigo-500/30 hover:bg-white/10 transition-colors group"
      aria-label="Get Your Weekly Insight"
    >
      <SparklesIcon className="w-6 h-6 text-indigo-300 transition-transform group-hover:scale-110" />
      <span className="text-body-emphasis font-semibold text-indigo-200">Get Your Weekly Insight</span>
    </button>
  );
};

export default ProactiveSuggestions;