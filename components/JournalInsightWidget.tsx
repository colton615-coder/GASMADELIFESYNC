import React, { useState, useEffect, useCallback } from 'react';
import usePersistentState from '../hooks/usePersistentState';
import { BookOpenIcon, SparklesIcon, LoaderIcon, ChevronRightIcon } from './icons';
import { format, subDays, parseISO, isAfter } from 'date-fns';

// Types from JournalModule
interface JournalEntry {
  promptText: string;
  entryText: string;
}

interface JournalInsightWidgetProps {
    setActiveModule: (module: string) => void;
    setJournalLink: (dateKey: string | null) => void;
}

const JournalInsightWidget: React.FC<JournalInsightWidgetProps> = ({ setActiveModule, setJournalLink }) => {
    const [entries] = usePersistentState<Record<string, JournalEntry>>('journalEntries', {});
    const [summaryCache, setSummaryCache] = usePersistentState<Record<string, string>>('journalSummaryCache', {});
    
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mostRecentEntry, setMostRecentEntry] = useState<{ key: string, entry: JournalEntry } | null>(null);

    const generateSummary = useCallback(async (dateKey: string, entryText: string) => {
        if (summaryCache[dateKey]) {
            setSummary(summaryCache[dateKey]);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/.netlify/functions/journal-insight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entryText: entryText.replace(/<[^>]*>?/gm, '') // Sanitize HTML before sending
                }),
            });

            if (!response.ok) {
                // Don't try to parse JSON on a 404 or other non-JSON error.
                const errorText = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            const newSummary = data.summary.trim();

            setSummary(newSummary);
            setSummaryCache(prev => ({ ...prev, [dateKey]: newSummary }));
        } catch (err) {
            console.error("Failed to generate journal summary:", err);
            setError("Could not generate insight at this time.");
        } finally {
            setIsLoading(false);
        }
    }, [summaryCache, setSummaryCache]);
    
    useEffect(() => {
        const twoDaysAgo = subDays(new Date(), 2);
        const sortedEntries = Object.entries(entries)
            .sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
        
        const recentEntry = sortedEntries.find(([dateKey]) => isAfter(parseISO(dateKey), twoDaysAgo));

        if (recentEntry) {
            const [key, entry] = recentEntry;
            setMostRecentEntry({ key, entry });
            generateSummary(key, entry.entryText);
        } else {
            setMostRecentEntry(null);
            setIsLoading(false);
        }
    }, [entries, generateSummary]);

    const handleNavigate = () => {
        if (mostRecentEntry) {
            setJournalLink(mostRecentEntry.key);
        }
        setActiveModule('JOURNAL');
    };

    if (isLoading) {
        return (
            <div className="border border-white/10 rounded-2xl p-6 flex items-center gap-4 bg-[#252525]">
                <div className="w-10 h-10 flex-shrink-0 bg-white/5 rounded-full flex items-center justify-center">
                    <LoaderIcon className="w-5 h-5 text-indigo-300" />
                </div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-white/5 rounded w-1/2 animate-pulse"></div>
                </div>
            </div>
        );
    }

    if (!mostRecentEntry) {
        return (
            <div className="border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center bg-[#252525]">
                <BookOpenIcon className="w-8 h-8 text-indigo-300 mb-2" />
                <h3 className="text-body-emphasis mb-2">Ready for your daily insight?</h3>
                <p className="text-caption mb-4">Begin today's reflection to unlock AI-powered summaries.</p>
                <button
                    onClick={() => setActiveModule('JOURNAL')}
                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition text-sm"
                >
                    Start Journal
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleNavigate}
            className="w-full text-left border border-white/10 rounded-2xl p-6 flex flex-col justify-between h-full bg-[#252525] transition-all duration-300 ease-in-out hover:border-indigo-400/50 hover:-translate-y-1 group"
        >
            <div>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <SparklesIcon className="w-6 h-6 text-indigo-300" />
                        <h2 className="text-body-emphasis">Journal Insight</h2>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-indigo-300 transition-colors" />
                </div>
                {error ? (
                     <p className="text-body text-yellow-400">{error}</p>
                ) : (
                    <p className="text-body text-gray-200">"{summary}"</p>
                )}
            </div>
            <p className="text-caption text-xs text-gray-400 mt-4 text-right">
                Based on your entry from {format(parseISO(mostRecentEntry.key), "MMMM d")}
            </p>
        </button>
    );
};

export default JournalInsightWidget;
