import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Module from './Module';
import { BookOpenIcon, PencilIcon, ArchiveIcon, ChevronLeftIcon, CheckIcon, HeartIcon, PlusIcon, TrashIcon, ChevronRightIcon, SparklesIcon, QuoteIcon, TagIcon, BarChartIcon, LoaderIcon, RefreshCwIcon } from './icons';
import { format, parseISO, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import usePersistentState from '../hooks/usePersistentState';
import { GoogleGenAI, Type } from '@google/genai';
import BottomSheet from './BottomSheet';
import AffirmationFormModal, { Affirmation } from './AffirmationFormModal';
import { prompts as localPrompts } from '../services/prompts';
import { affirmations as defaultAffirmations } from '../services/affirmations';
import toast from 'react-hot-toast';
import { logToDailyLog } from '../services/logService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- DATA SCHEMAS ---
interface JournalEntry {
  promptText: string;
  entryText: string; // Can contain plain text or simple HTML for formatting
}

interface MoodLog {
  mood: string; // e.g., 'rad', 'good', 'meh', 'bad', 'awful'
  note: string;
}

interface JournalAnalysis {
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  tags: string[];
}

interface Task {
  id: number;
  text: string;
  completed: boolean;
  completedAt?: string | null;
}

// --- CONSTANTS ---
const MOOD_OPTIONS = [
  { name: 'rad', emoji: '🤩' },
  { name: 'good', emoji: '😊' },
  { name: 'meh', emoji: '😐' },
  { name: 'bad', emoji: '😕' },
  { name: 'awful', emoji: '😭' },
];

// --- RICH TEXT EDITOR COMPONENT ---
const RichTextEditor: React.FC<{
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  toolbarClassName?: string;
  ariaLabel: string;
}> = ({ value, onChange, placeholder, className = '', toolbarClassName = '', ariaLabel }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(false);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
    setIsPlaceholderVisible(!editorRef.current?.textContent && !value);
  }, [value]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML;
    onChange(html);
    setIsPlaceholderVisible(!e.currentTarget.textContent);
  };
  
  const handleFormat = (command: string) => {
    document.execCommand(command, false);
    if(editorRef.current) editorRef.current.focus();
  };

  return (
    <div className="relative">
      <div className={`flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg mb-2 w-min ${toolbarClassName}`}>
        <button type="button" onClick={() => handleFormat('bold')} className="px-4 py-2 text-sm font-bold rounded hover:bg-white/10" aria-label="Bold text">B</button>
        <button type="button" onClick={() => handleFormat('italic')} className="px-4 py-2 text-sm italic rounded hover:bg-white/10" aria-label="Italic text">I</button>
        <button type="button" onClick={() => handleFormat('insertUnorderedList')} className="px-4 py-2 text-sm rounded hover:bg-white/10" aria-label="Bulleted list">●</button>
      </div>
       {isPlaceholderVisible && (
        <div className="absolute top-12 left-4 text-gray-400 pointer-events-none">
          {placeholder}
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className={`w-full h-full min-h-[10rem] bg-black/50 p-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y overflow-auto prose prose-invert prose-sm prose-p:my-1 prose-ul:my-1 max-w-none text-body ${className}`}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
      />
    </div>
  );
};


// --- FOCUS MODE COMPONENT ---
const FocusMode: React.FC<{
  prompt: string;
  initialText: string;
  onSave: (text: string) => void;
  onClose: () => void;
  onAutoSave: (text: string) => void;
}> = ({ prompt, initialText, onSave, onClose, onAutoSave }) => {
  const [text, setText] = useState(initialText);
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    const intervalId = setInterval(() => {
      onAutoSave(textRef.current);
    }, 30000);

    return () => {
      clearInterval(intervalId);
      onAutoSave(textRef.current);
    };
  }, [onAutoSave]);

  const handleSaveAndClose = () => {
      onSave(text);
      onClose();
  }

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col p-4 sm:p-6 lg:p-8 animate-fade-in">
        <style>{`.animate-fade-in { animation: fadeIn 0.3s ease-in-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div className="flex-shrink-0 w-full max-w-4xl mx-auto flex justify-end items-center">
        <button 
          onClick={handleSaveAndClose}
          className="px-4 py-2 text-sm rounded-md bg-indigo-600 hover:bg-indigo-700 font-semibold transition text-white"
        >
          Save & Close
        </button>
      </div>
      <div className="flex-grow w-full max-w-3xl mx-auto mt-6 overflow-y-auto">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-300 mb-6 font-serif">{prompt}</h2>
        <RichTextEditor 
            value={text} 
            onChange={setText} 
            placeholder="Your thoughts..."
            className="text-lg sm:text-xl leading-relaxed font-serif !min-h-[50vh] !bg-transparent !p-0 !ring-0"
            toolbarClassName="bg-slate-900"
            ariaLabel={`Journal entry for prompt: ${prompt}`}
        />
      </div>
    </div>
  );
};


// --- JOURNAL ANALYSIS COMPONENTS ---
const SentimentHeatmap: React.FC<{ analysisCache: Record<string, JournalAnalysis> }> = ({ analysisCache }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number; visible: boolean }>({ content: '', x: 0, y: 0, visible: false });

    const endDate = new Date();
    const startDate = subDays(endDate, 90);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const getColor = (sentiment?: 'Positive' | 'Negative' | 'Neutral') => {
        switch (sentiment) {
            case 'Positive': return 'fill-green-500';
            case 'Negative': return 'fill-red-500';
            case 'Neutral': return 'fill-gray-600';
            default: return 'fill-gray-800/50';
        }
    };

    const handleMouseOver = (e: React.MouseEvent, day: Date, analysis?: JournalAnalysis) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            setTooltip({
                content: `${format(day, 'MMM d')}: ${analysis?.sentiment || 'No Entry'}`,
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top - 8,
                visible: true,
            });
        }
    };

    return (
        <div className="relative w-full overflow-x-auto p-4 bg-black/30 rounded-lg" ref={containerRef}>
            <svg viewBox={`0 0 ${14 * 16} 128`} className="min-w-[400px]">
                {days.map((day, i) => {
                    const weekIndex = Math.floor(i / 7);
                    const dayIndex = i % 7;
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const analysis = analysisCache[dateKey];
                    return (
                        <rect
                            key={dateKey}
                            x={weekIndex * 16}
                            y={dayIndex * 16}
                            width="14"
                            height="14"
                            rx="2"
                            ry="2"
                            className={`${getColor(analysis?.sentiment)} transition-colors`}
                            onMouseOver={(e) => handleMouseOver(e, day, analysis)}
                            onMouseOut={() => setTooltip(prev => ({...prev, visible: false}))}
                        />
                    );
                })}
            </svg>
            {tooltip.visible && (
                <div
                    className="absolute bg-black/80 text-white text-xs px-2 py-1 rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 transition-opacity z-10"
                    style={{ left: tooltip.x, top: tooltip.y, opacity: 1 }}
                >
                    {tooltip.content}
                </div>
            )}
        </div>
    );
};

// --- MAIN JOURNAL MODULE ---
const JournalModule: React.FC<{ 
  className?: string, 
  setIsFocusMode: (isFocused: boolean) => void,
  startInFocus?: boolean,
  journalLink?: string | null;
  setJournalLink?: (dateKey: string | null) => void;
}> = ({ className = '', setIsFocusMode, startInFocus = false, journalLink, setJournalLink }) => {
  type View = 'today' | 'archive' | 'focus';
  const [view, setView] = useState<View>(startInFocus ? 'focus' : 'today');
  
  const [archiveTab, setArchiveTab] = useState<'entries' | 'trends'>('entries');
  
  const [isReady, setIsReady] = useState(false);
  
  const [entries, setEntries] = usePersistentState<Record<string, JournalEntry>>('journalEntries', {});
  const [promptHistory, setPromptHistory] = usePersistentState<Record<string, string>>('journalPromptHistory', {});
  const [drafts, setDrafts] = usePersistentState<Record<string, string>>('journalDrafts', {});
  const [moods, setMoods] = usePersistentState<Record<string, MoodLog>>('moodLogs', {});
  const [analysisCache, setAnalysisCache] = usePersistentState<Record<string, JournalAnalysis>>('journalAnalysisCache', {});
  const [lastPromptIndex, setLastPromptIndex] = usePersistentState<number>('journalLastPromptIndex', -1);
  const [tasks] = usePersistentState<Task[]>('tasks', []);
  
  const [affirmations, setAffirmations] = usePersistentState<Affirmation[]>('dailyAffirmations', defaultAffirmations);
  const [isAffirmationModalOpen, setIsAffirmationModalOpen] = useState(false);
  const [editingAffirmation, setEditingAffirmation] = useState<Affirmation | null>(null);
  const [suggestedAffirmations, setSuggestedAffirmations] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);
  const [animationClass, setAnimationClass] = useState('');

  const [isWritingInline, setIsWritingInline] = useState(false);
  const [inlineText, setInlineText] = useState('');

  const [editingEntryKey, setEditingEntryKey] = useState<string | null>(null);
  const [editingEntryText, setEditingEntryText] = useState<string>('');
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<Record<string, boolean>>({});
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todaysPrompt = promptHistory[todayKey];
  const todaysMood = moods[todayKey];

  const getAnalysisForEntry = useCallback(async (dateKey: string, entryText: string) => {
    if (!entryText || analysisCache[dateKey] || isAnalyzing[dateKey]) return;

    setIsAnalyzing(prev => ({ ...prev, [dateKey]: true }));
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze the sentiment and extract up to 5 relevant keyword tags from the following journal entry. Sentiment must be one of: 'Positive', 'Negative', 'Neutral'. Tags should be single words or short phrases. Entry: "${entryText}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        sentiment: { type: Type.STRING, description: 'Must be one of: Positive, Negative, Neutral' },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['sentiment', 'tags']
                }
            }
        });
        const analysisResult = JSON.parse(response.text.trim());
        setAnalysisCache(prev => ({ ...prev, [dateKey]: analysisResult }));
    } catch (error) {
        console.error("Failed to analyze journal entry:", error);
    } finally {
        setIsAnalyzing(prev => ({ ...prev, [dateKey]: false }));
    }
  }, [analysisCache, isAnalyzing, setAnalysisCache]);

  const handleCyclePrompt = () => {
    const currentPromptText = promptHistory[todayKey] || '';
    const currentIndex = localPrompts.findIndex(p => p.text === currentPromptText);
    // Use a default index of -1 if not found, so the next is 0.
    const newIndex = (currentIndex === -1 ? localPrompts.length -1 : currentIndex + 1) % localPrompts.length;
    const newPrompt = localPrompts[newIndex];
    setPromptHistory(prev => ({ ...prev, [todayKey]: newPrompt.text }));
  };
  
  useEffect(() => {
    if (!promptHistory[todayKey]) {
        const newIndex = (lastPromptIndex + 1) % localPrompts.length;
        const newPrompt = localPrompts[newIndex];
        setPromptHistory(prev => ({ ...prev, [todayKey]: newPrompt.text }));
        setLastPromptIndex(newIndex);
    }
    setIsReady(true);
  }, [todayKey, promptHistory, lastPromptIndex, setPromptHistory, setLastPromptIndex]);


  useEffect(() => setIsFocusMode(view === 'focus'), [view, setIsFocusMode]);

  // Effect to handle deep-linking from dashboard widget
  useEffect(() => {
    if (journalLink && setJournalLink) {
        setView('archive'); // Switch to the archive view
        setArchiveTab('entries'); // Ensure the entries tab is active
        // A small delay allows the view to switch before we try to interact with it
        setTimeout(() => {
            handleStartEdit(journalLink); // Use the edit state to expand/highlight the entry
        }, 100);
        setJournalLink(null); // Clear the link state after use
    }
  }, [journalLink, setJournalLink]);

  const handleAutoSave = useCallback((text: string, dateKey: string) => {
    const savedEntryText = entries[dateKey]?.entryText || '';
    if (text.trim() && text.trim() !== savedEntryText.trim()) {
        setDrafts({ ...drafts, [dateKey]: text });
    } else if (!text.trim() && drafts[dateKey]) {
        const newDrafts = { ...drafts };
        delete newDrafts[dateKey];
        setDrafts(newDrafts);
    }
  }, [entries, drafts, setDrafts]);

  const handleSaveEntry = (text: string) => {
    if (todaysPrompt) {
      const trimmedText = text.trim();
      if (trimmedText) {
        const newEntry = { promptText: todaysPrompt, entryText: trimmedText };
        setEntries({ ...entries, [todayKey]: newEntry });
        toast.success('Entry Saved! 📖');
        // Task 3: Example Usage
        logToDailyLog('journal_entry_saved', { prompt: todaysPrompt, length: trimmedText.length });
        // Invalidate old analysis if entry changes
        if(analysisCache[todayKey]) {
            const newCache = {...analysisCache};
            delete newCache[todayKey];
            setAnalysisCache(newCache);
        }
      }
      if (drafts[todayKey]) {
        const newDrafts = { ...drafts };
        delete newDrafts[todayKey];
        setDrafts(newDrafts);
      }
    }
  };
  
  const generateMonthlySummary = async () => {
    setIsGeneratingSummary(true);
    setIsSummaryModalOpen(true);
    setMonthlySummary(null);

    try {
        const oneMonthAgo = subDays(new Date(), 30);
        const monthEntries = Object.entries(entries)
            .filter(([date]) => isWithinInterval(parseISO(date), { start: oneMonthAgo, end: new Date() }))
            .map(([date, entry]) => `Date: ${date}\nEntry: ${entry.entryText.replace(/<[^>]*>?/gm, '')}\nMood: ${moods[date]?.mood || 'Not logged'}\n`);

        if (monthEntries.length < 3) {
            setMonthlySummary("Not enough entries in the last month to generate a meaningful summary.");
            return;
        }

        const prompt = `You are a compassionate and insightful reflection assistant. Based on the following journal entries and mood logs from the past month, please generate a brief summary. Structure your response using Markdown with the following sections:

## Dominant Themes
Identify 2-3 major recurring themes or topics.

## Emotional Landscape
Briefly describe the overall mood trend based on the daily logs. Mention any particularly high or low points.

## Recurring Keywords
List up to 5 common keywords or concepts that appeared frequently.

Here is the data:\n${monthEntries.join('\n---\n')}`;

        const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
        setMonthlySummary(response.text);

    } catch (error) {
        console.error("Failed to generate monthly summary:", error);
        setMonthlySummary("Sorry, I couldn't generate a summary at this time. Please try again later.");
    } finally {
        setIsGeneratingSummary(false);
    }
  };
  
  const allTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    Object.values(analysisCache).forEach(analysis => {
        analysis.tags.forEach(tag => {
            const normalizedTag = tag.toLowerCase();
            tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
        });
    });
    return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
  }, [analysisCache]);

  const handleMoodSelect = (moodName: string) => { 
    setMoods({ ...moods, [todayKey]: { mood: moodName, note: moods[todayKey]?.note || '' } }); 
    logToDailyLog('mood_logged', { mood: moodName });
  };
  const handleMoodNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (moods[todayKey]) { setMoods({ ...moods, [todayKey]: { ...moods[todayKey], note: e.target.value } }); } };
  const handleBeginWriting = () => { setInlineText(drafts[todayKey] || ''); setIsWritingInline(true); };
  const handleSaveInlineEntry = () => { handleSaveEntry(inlineText); setIsWritingInline(false); setInlineText(''); };
  const handleCancelInlineWrite = () => { handleAutoSave(inlineText, todayKey); setIsWritingInline(false); setInlineText(''); };
  const handleEnterFocusMode = () => setView('focus');
  const handleCloseFocus = () => setView('today');
  const handleStartEdit = (dateKey: string) => { setEditingEntryKey(dateKey); setEditingEntryText(entries[dateKey]?.entryText || ''); };
  const handleCancelEdit = () => { setEditingEntryKey(null); setEditingEntryText(''); };
  const handleUpdateEntry = () => {
    if (editingEntryKey) {
        const newEntry = { ...entries[editingEntryKey], entryText: editingEntryText };
        setEntries({ ...entries, [editingEntryKey]: newEntry });
        toast.success('Entry Updated! 📖');
        logToDailyLog('journal_entry_updated', { date: editingEntryKey, length: editingEntryText.length });
        // Invalidate old analysis
        if(analysisCache[editingEntryKey]) {
            const newCache = {...analysisCache};
            delete newCache[editingEntryKey];
            setAnalysisCache(newCache);
        }
    }
    handleCancelEdit();
  };
  
  // Affirmation handlers remain the same
  const handleOpenAffirmationModal = (affirmation: Affirmation | null) => { setEditingAffirmation(affirmation); setIsAffirmationModalOpen(true); };
  const handleSaveAffirmation = (text: string) => {
    if (editingAffirmation) {
      setAffirmations(affirmations.map(a => a.id === editingAffirmation.id ? { ...a, text } : a));
    } else {
      const newAffirmation: Affirmation = { id: Date.now().toString(), text };
      const newAffirmations = [...affirmations, newAffirmation];
      setAffirmations(newAffirmations);
      setCurrentAffirmationIndex(newAffirmations.length - 1);
    }
  };
  const handleDeleteAffirmation = (id: string) => {
    const newAffirmations = affirmations.filter(a => a.id !== id);
    setAffirmations(newAffirmations);
    if (currentAffirmationIndex >= newAffirmations.length) {
        setCurrentAffirmationIndex(Math.max(0, newAffirmations.length - 1));
    }
  };
  const handleSuggestAffirmations = async () => {
    setIsSuggesting(true); setSuggestedAffirmations([]);
    try {
        const existingAffirmations = affirmations.map(a => `- "${a.text}"`).join('\n');
        const prompt = `Generate a JSON array of 5 unique, short, and empowering affirmations. Do not repeat any of the following existing affirmations:\n${existingAffirmations}\n\nReturn only the JSON array of strings.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
        setSuggestedAffirmations(JSON.parse(response.text.trim()));
    } catch (e) { console.error("Failed to suggest affirmations:", e); } 
    finally { setIsSuggesting(false); }
  };
  const handleAddSuggested = (text: string) => {
    const newAffirmation: Affirmation = { id: Date.now().toString(), text };
    const newAffirmations = [...affirmations, newAffirmation];
    setAffirmations(newAffirmations);
    setSuggestedAffirmations(prev => prev.filter(s => s !== text));
    setCurrentAffirmationIndex(newAffirmations.length - 1);
  };
  const handleNextAffirmation = () => {
    setAnimationClass('affirmation-slide-out-left');
    setTimeout(() => { setCurrentAffirmationIndex(prev => (prev + 1) % (affirmations.length || 1)); setAnimationClass('affirmation-slide-in-right'); }, 400);
  };
  const handlePrevAffirmation = () => {
    setAnimationClass('affirmation-slide-out-right');
    setTimeout(() => { setCurrentAffirmationIndex(prev => (prev - 1 + (affirmations.length || 1)) % (affirmations.length || 1)); setAnimationClass('affirmation-slide-in-left'); }, 400);
  };
  useEffect(() => { if (currentAffirmationIndex >= affirmations.length && affirmations.length > 0) { setCurrentAffirmationIndex(affirmations.length - 1); } }, [affirmations, currentAffirmationIndex]);


  if (view === 'focus' && todaysPrompt) {
    const initialText = drafts[todayKey] !== undefined ? drafts[todayKey] : (entries[todayKey]?.entryText || '');
    return <FocusMode prompt={todaysPrompt} initialText={initialText} onSave={handleSaveEntry} onClose={handleCloseFocus} onAutoSave={(text) => handleAutoSave(text, todayKey)} />;
  }
  
  const renderTodayView = () => {
    const currentAffirmation = affirmations.length > 0 ? affirmations[currentAffirmationIndex] : null;
    const isCompletedToday = !!entries[todayKey] && entries[todayKey].entryText.trim().length > 0;
    
    const completedTodayCount = useMemo(() => {
        return tasks.filter(task =>
            task.completed &&
            task.completedAt &&
            format(parseISO(task.completedAt), 'yyyy-MM-dd') === todayKey
        ).length;
    }, [tasks, todayKey]);

    return (
        <div className="space-y-6">
            {/* Mood Tracker */}
            <div>
              <h3 className="text-body-emphasis text-gray-200 mb-2">How are you feeling?</h3>
              <div className="bg-black/30 p-4 rounded-lg">
                <div className="flex justify-around mb-4">
                  {MOOD_OPTIONS.map(({ name, emoji }) => (
                    <button key={name} onClick={() => handleMoodSelect(name)} aria-label={`Select mood: ${name}`} aria-pressed={todaysMood?.mood === name} className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all w-16 ${todaysMood?.mood === name ? 'bg-indigo-500/30' : 'hover:bg-white/10'}`}>
                      <span className="text-3xl" aria-hidden="true">{emoji}</span>
                      <span className={`text-xs capitalize transition ${todaysMood?.mood === name ? 'text-indigo-200 font-semibold' : 'text-gray-400'}`}>{name}</span>
                    </button>
                  ))}
                </div>
                {todaysMood?.mood && (
                  <div className="animate-fade-in-fast">
                    <style>{`.animate-fade-in-fast { animation: fadeIn 0.3s ease-in-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
                    <label htmlFor="mood-note" className="sr-only">Note about your mood</label>
                    <input id="mood-note" type="text" value={todaysMood.note || ''} onChange={handleMoodNoteChange} placeholder="What's making you feel this way? (optional)" className="w-full bg-white/10 text-white placeholder-gray-400 border border-transparent rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" />
                  </div>
                )}
              </div>
            </div>

            {/* Journal Prompt */}
            <div>
              <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                  <h3 className="text-body-emphasis text-gray-200">Today's Reflection</h3>
                  <div className="flex gap-2">
                    <button onClick={generateMonthlySummary} disabled={isGeneratingSummary} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-300 bg-indigo-500/10 rounded-md hover:bg-indigo-500/20 hover:text-indigo-200 transition-colors disabled:opacity-50">
                        {isGeneratingSummary ? <LoaderIcon className="w-4 h-4"/> : <SparklesIcon className="w-4 h-4"/>} Monthly Reflection
                    </button>
                    <button onClick={() => setView('archive')} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-300 bg-indigo-500/10 rounded-md hover:bg-indigo-500/20 hover:text-indigo-200 transition-colors">
                        <ArchiveIcon className="w-4 h-4" /> View Archive
                    </button>
                  </div>
              </div>
              <div className="bg-black/30 p-4 rounded-lg flex flex-col justify-center">
                  {!isReady ? ( <div className="min-h-[12rem] flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div></div> ) : (
                      <div className="w-full">
                          {completedTodayCount > 0 && (
                            <div className="text-center mb-4 p-3 bg-green-500/10 text-green-300 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                                <CheckIcon className="w-5 h-5" />
                                <span>You've completed {completedTodayCount} {completedTodayCount === 1 ? 'task' : 'tasks'} today. Great work!</span>
                            </div>
                          )}
                          <div className="relative group min-h-[6rem] flex items-center justify-center">
                              <p className="text-lg font-serif text-gray-300 text-center px-10">{todaysPrompt}</p>
                              <button
                                  onClick={handleCyclePrompt}
                                  className="absolute top-1/2 right-0 -translate-y-1/2 p-2 rounded-full text-gray-500 hover:text-indigo-300 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  aria-label="Generate new prompt"
                              >
                                  <RefreshCwIcon className="w-5 h-5"/>
                              </button>
                          </div>
                          {isCompletedToday && !isWritingInline ? (
                              <div className="flex flex-col items-center gap-4 text-center mt-4">
                                  <div className="flex items-center gap-2 text-green-400"><CheckIcon className="w-5 h-5"/> <span className="font-semibold">Completed for Today</span></div>
                                  <button onClick={handleEnterFocusMode} className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-white/10 text-white hover:bg-white/20 transition font-semibold"><PencilIcon className="w-4 h-4"/> View / Edit Entry</button>
                              </div>
                          ) : isWritingInline ? (
                              <div className="w-full flex flex-col items-stretch gap-2 transition-all duration-300 animate-fade-in-fast">
                                  <RichTextEditor value={inlineText} onChange={setInlineText} placeholder="Your thoughts..." ariaLabel={`Journal entry for prompt: ${todaysPrompt}`} />
                                  <div className="flex justify-center gap-2 mt-2">
                                      <button onClick={handleCancelInlineWrite} className="px-4 py-2 text-sm rounded-md bg-white/10 text-white hover:bg-white/20 transition font-semibold">Cancel</button>
                                      <button onClick={handleSaveInlineEntry} className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition font-semibold">Save Entry</button>
                                  </div>
                              </div>
                          ) : (
                            <div className="text-center mt-4">
                              <button onClick={handleBeginWriting} className="flex items-center justify-center gap-2 px-6 py-4 text-base rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition font-semibold w-48 mx-auto"><PencilIcon className="w-5 h-5"/><span>Begin Writing</span></button>
                            </div>
                          )}
                      </div>
                  )}
              </div>
            </div>
            
            {/* Affirmations Section */}
            <div>
                <h3 className="text-body-emphasis text-gray-200 mb-2 flex items-center gap-2"><HeartIcon className="w-5 h-5 text-pink-400"/> My Affirmations</h3>
                <div className="bg-white/5 p-4 rounded-lg min-h-[10rem] flex flex-col items-center justify-between group">
                    {affirmations.length > 0 && currentAffirmation ? (
                        <>
                            <div className="w-full flex items-center justify-center flex-grow relative overflow-hidden">
                                <button onClick={handlePrevAffirmation} className="absolute left-0 p-2 text-gray-400 hover:text-white transition" aria-label="Previous affirmation"><ChevronLeftIcon/></button>
                                <div className={`flex flex-col items-center justify-center text-center px-8 ${animationClass}`} aria-live="polite">
                                    <QuoteIcon className="w-6 h-6 text-indigo-400/50 mb-2" aria-hidden="true"/>
                                    <p className="text-body-emphasis font-serif font-medium leading-relaxed">{currentAffirmation.text}</p>
                                </div>
                                <button onClick={handleNextAffirmation} className="absolute right-0 p-2 text-gray-400 hover:text-white transition" aria-label="Next affirmation"><ChevronRightIcon/></button>
                            </div>
                            <div className="flex-shrink-0 mt-4 flex items-center justify-between w-full">
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenAffirmationModal(currentAffirmation)} className="p-2 rounded-full text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/20" aria-label="Edit current affirmation"><PencilIcon className="w-4 h-4"/></button>
                                    <button onClick={() => handleDeleteAffirmation(currentAffirmation.id)} className="p-2 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/20" aria-label="Delete current affirmation"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                                <div className="flex gap-2" role="group" aria-label="Affirmation navigation">
                                    {affirmations.map((_, index) => (<button key={index} onClick={() => setCurrentAffirmationIndex(index)} className={`w-2 h-2 rounded-full transition ${index === currentAffirmationIndex ? 'bg-indigo-400' : 'bg-gray-600 hover:bg-gray-500'}`} aria-label={`Go to affirmation ${index + 1}`}></button>))}
                                </div>
                                <div className="w-14"></div>
                            </div>
                        </>
                    ) : ( <div className="text-center text-gray-400"><p>No affirmations yet.</p></div> )}
                </div>
                {suggestedAffirmations.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-semibold text-gray-300">Suggestions ✨</h4>
                        {suggestedAffirmations.map((text, i) => (<div key={i} className="flex items-center justify-between bg-white/5 p-2 rounded-lg text-sm"><span className="text-gray-300">{text}</span><button onClick={() => handleAddSuggested(text)} className="p-2 rounded-full bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 transition" aria-label={`Add suggested affirmation: ${text}`}><PlusIcon className="w-4 h-4"/></button></div>))}
                    </div>
                )}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button onClick={() => handleOpenAffirmationModal(null)} className="w-full flex items-center justify-center gap-2 p-2 bg-white/5 rounded-lg text-center transition hover:bg-white/10 text-indigo-300"><PlusIcon className="w-5 h-5"/><span className="font-semibold text-sm">Add Manually</span></button>
                  <button onClick={handleSuggestAffirmations} disabled={isSuggesting} className="w-full flex items-center justify-center gap-2 p-2 bg-white/5 rounded-lg text-center transition hover:bg-white/10 text-indigo-300 disabled:opacity-50">
                      {isSuggesting ? (<div className="w-5 h-5 border-2 border-indigo-300/50 border-t-indigo-300 rounded-full animate-spin"></div>) : (<SparklesIcon className="w-5 h-5"/>)}
                      <span className="font-semibold text-sm">{isSuggesting ? 'Thinking...' : 'Suggest with AI'}</span>
                  </button>
                </div>
            </div>
        </div>
    );
  };

  const renderArchiveView = () => {
    const sortedEntries = useMemo(() => Object.entries(entries).sort(([dateA], [dateB]) => dateB.localeCompare(dateA)), [entries]);
    
    useEffect(() => {
        sortedEntries.forEach(([dateKey, entry]) => {
            if (entry.entryText) {
                getAnalysisForEntry(dateKey, entry.entryText);
            }
        });
    }, [sortedEntries, getAnalysisForEntry]);

    const filteredEntries = useMemo(() => {
        if (!activeTagFilter) return sortedEntries;
        return sortedEntries.filter(([dateKey]) => analysisCache[dateKey]?.tags.includes(activeTagFilter));
    }, [sortedEntries, activeTagFilter, analysisCache]);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setView('today')} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition">
                    <ChevronLeftIcon className="w-5 h-5" /> Back to Journal
                </button>
            </div>
            <div role="tablist" aria-label="Archive views" className="flex border-b border-white/10 mb-4">
                <button role="tab" aria-selected={archiveTab === 'entries'} onClick={() => setArchiveTab('entries')} className={`px-4 py-2 text-sm font-semibold transition-colors ${archiveTab === 'entries' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>Entries</button>
                <button role="tab" aria-selected={archiveTab === 'trends'} onClick={() => setArchiveTab('trends')} className={`px-4 py-2 text-sm font-semibold transition-colors ${archiveTab === 'trends' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>Trends</button>
            </div>

            {archiveTab === 'entries' && (
                <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
                    {filteredEntries.length > 0 ? (
                        filteredEntries.map(([date, entry]) => {
                            const moodLog = moods[date];
                            const moodEmoji = moodLog ? MOOD_OPTIONS.find(m => m.name === moodLog.mood)?.emoji : null;
                            const analysis = analysisCache[date];

                            return (
                                <div key={date} className="bg-white/5 p-4 rounded-lg group transition-all">
                                    {editingEntryKey === date ? (
                                        <div className="flex flex-col gap-4">
                                            <p className="text-caption font-semibold text-indigo-300">Editing - {format(parseISO(date), 'MMMM d, yyyy')}</p>
                                            <RichTextEditor value={editingEntryText} onChange={setEditingEntryText} ariaLabel={`Edit journal entry for ${format(parseISO(date), 'MMMM d, yyyy')}`} />
                                            <div className="flex justify-end gap-2"><button onClick={handleCancelEdit} className="px-4 py-2 text-sm rounded-md bg-white/10 text-white hover:bg-white/20 transition font-semibold">Cancel</button><button onClick={handleUpdateEntry} className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition font-semibold">Save</button></div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-caption font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                                                        {format(parseISO(date), 'MMMM d, yyyy')}
                                                        {moodEmoji && <span className="text-lg" title={`Mood: ${moodLog?.mood}`}>{moodEmoji}</span>}
                                                    </p>
                                                    <p className="text-caption italic mb-4">"{entry.promptText}"</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isAnalyzing[date] && <LoaderIcon className="w-4 h-4"/>}
                                                    <button onClick={() => handleStartEdit(date)} className="p-2 rounded-full text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/20 transition-colors opacity-0 group-hover:opacity-100 focus-within:opacity-100" aria-label={`Edit entry for ${format(parseISO(date), 'MMMM d, yyyy')}`}><PencilIcon className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                            {moodLog?.note && <p className="text-xs text-gray-400 mb-4 border-l-2 border-white/10 pl-2">Feeling {moodLog.mood} because: "{moodLog.note}"</p>}
                                            <div className="text-body prose prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0 line-clamp-4" dangerouslySetInnerHTML={{ __html: entry.entryText }}/>
                                            {analysis && analysis.tags.length > 0 && (
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {analysis.tags.map(tag => (
                                                        <button key={tag} onClick={() => setActiveTagFilter(tag)} className={`px-2 py-1 text-xs rounded-full transition ${activeTagFilter === tag ? 'bg-indigo-500 text-white' : 'bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20'}`}>{tag}</button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )
                        })
                    ) : ( <div className="text-center py-8 text-gray-400">{activeTagFilter ? `No entries found for tag: #${activeTagFilter}` : 'No entries in your archive yet.'}</div> )}
                </div>
            )}
            {archiveTab === 'trends' && (
                <div>
                    <h3 className="text-body-emphasis mb-2">Sentiment Heatmap (Last 90 Days)</h3>
                    <SentimentHeatmap analysisCache={analysisCache} />

                    <h3 className="text-body-emphasis mt-6 mb-2">Filter by Tag</h3>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setActiveTagFilter(null)} className={`px-3 py-1 text-sm rounded-full transition ${!activeTagFilter ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>All</button>
                        {allTags.map(tag => (
                             <button key={tag} onClick={() => setActiveTagFilter(tag)} className={`px-3 py-1 text-sm rounded-full capitalize transition ${activeTagFilter === tag ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>{tag}</button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
  };
  
  const MonthlySummaryModal: React.FC = () => (
    <BottomSheet isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} title="Your Monthly Reflection">
      <div className="p-4 min-h-[20rem]">
        {isGeneratingSummary ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <LoaderIcon className="w-8 h-8 mb-4"/>
                <p className="text-body-emphasis">Generating your summary...</p>
                <p className="text-caption">This might take a moment.</p>
            </div>
        ) : monthlySummary && (
             <div className="prose prose-invert max-w-none">
                {monthlySummary.split('\n').map((paragraph, index) => {
                    const trimmed = paragraph.trim();
                    if (trimmed.startsWith('## ')) return <h2 key={index} className="text-module-header mt-4 mb-2 text-indigo-300">{trimmed.substring(3)}</h2>
                    if (trimmed.startsWith('* ')) return <li key={index} className="text-body ml-4 list-disc">{trimmed.substring(2)}</li>
                    if (trimmed === '') return null;
                    return <p key={index} className="text-body mb-2">{paragraph}</p>
                })}
             </div>
        )}
      </div>
    </BottomSheet>
  );

  return (
    <>
      <Module title="Journal" icon={<BookOpenIcon />} className={className}>
        {view === 'today' && renderTodayView()}
        {view === 'archive' && renderArchiveView()}
      </Module>
      {isAffirmationModalOpen && <AffirmationFormModal onSave={handleSaveAffirmation} onClose={() => setIsAffirmationModalOpen(false)} initialAffirmation={editingAffirmation} />}
      <MonthlySummaryModal />
    </>
  );
};

export default JournalModule;