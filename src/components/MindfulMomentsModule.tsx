import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import usePersistentState from '@/hooks/usePersistentState';
import { XIcon, BrainCircuitIcon, LoaderIcon } from '@/components/icons';
import { logToDailyLog } from '@/services/logService';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });

interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

const MindfulMomentsModule: React.FC<{
  setIsFocusMode: (isFocused: boolean) => void;
  setActiveModule: (module: string) => void;
}> = ({ setIsFocusMode, setActiveModule }) => {
  const [history, setHistory] = usePersistentState<ChatMessage[]>('mindfulMomentsChat', []);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null);

  const historyRef = useRef(history);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const systemInstruction = `You are "Aura", a compassionate and insightful AI coach from the Life Sync app. Your purpose is to help users reflect on their day, manage stress, and work towards their goals. You are not a licensed therapist, but you can provide a safe space for users to talk and offer guidance based on cognitive-behavioral therapy (CBT) and mindfulness principles. Keep your responses encouraging, empathetic, and relatively brief. Ask open-ended questions to guide the user's reflection. Start the conversation with a warm and gentle greeting if the history is empty.`;

  useEffect(() => {
    setIsFocusMode(true);
    
    chatRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: [...history],
        config: {
            systemInstruction: systemInstruction,
        }
    });

    if (history.length === 0) {
        handleSendMessage(true);
    }
    
    return () => {
        setIsFocusMode(false);
        if (historyRef.current.length > 1) { // Only log if there was an interaction
            logToDailyLog('mindful_moment_chat_ended', { messageCount: historyRef.current.length });
        }
    };
  }, [setIsFocusMode]); // Only run on mount and unmount

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, streamingMessage]);

  const handleSendMessage = async (isInitial = false) => {
    const textToSend = userInput.trim();
    if ((!textToSend && !isInitial) || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setUserInput('');
    
    const userMessage: ChatMessage = { role: 'user', parts: [{ text: textToSend }] };
    
    if (!isInitial) {
      setHistory((prev: ChatMessage[]) => [...prev, userMessage]);
    }
    
    setStreamingMessage({ role: 'model', parts: [{ text: '' }] });

    try {
        const result = await (chatRef.current as Chat).sendMessageStream({ message: isInitial ? "Hello" : textToSend });
        let fullResponse = '';
        
        for await (const chunk of result) {
            const chunkText = chunk.text;
            fullResponse += chunkText;
            setStreamingMessage({ role: 'model', parts: [{ text: fullResponse }] });
        }

        const modelMessage: ChatMessage = { role: 'model', parts: [{ text: fullResponse }] };
        const finalHistory = isInitial ? [modelMessage] : [...history, userMessage, modelMessage];
        setHistory(finalHistory);

    } catch (e) {
      console.error(e);
      setError("Sorry, I'm having trouble connecting right now. Please try again later.");
    } finally {
      setIsLoading(false);
      setStreamingMessage(null);
    }
  };
  
  const displayedMessages = streamingMessage ? [...history, streamingMessage] : history;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-indigo-900/50 z-50 flex flex-col p-4 font-sans animate-fade-in">
        <style>{`.animate-fade-in { animation: fadeIn 0.3s ease-in-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      
      <header className="flex-shrink-0 w-full max-w-3xl mx-auto flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
            <BrainCircuitIcon className="w-8 h-8 text-indigo-300" />
            <h1 className="text-xl font-semibold text-white">Mindful Moments with Aura</h1>
        </div>
        <button 
          onClick={() => setActiveModule('DASHBOARD')}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close chat"
        >
          <XIcon className="w-6 h-6" />
        </button>
      </header>
      
      <main className="flex-grow w-full max-w-3xl mx-auto overflow-y-auto mb-4 pr-2">
        <div className="space-y-6">
            {displayedMessages.map((msg: ChatMessage, index: number) => (
                <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-indigo-500/50 flex items-center justify-center flex-shrink-0"><BrainCircuitIcon className="w-5 h-5 text-indigo-200"/></div>}
                    <div className={`max-w-md md:max-w-lg p-4 rounded-2xl text-body break-words ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-700/80 text-gray-200 rounded-bl-none'}`}>
                        {msg.parts[0].text}
                        {streamingMessage && index === displayedMessages.length - 1 && <span className="inline-block w-2 h-4 bg-white animate-pulse ml-1" />}
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="flex-shrink-0 w-full max-w-3xl mx-auto">
        {error && <p className="text-red-400 text-sm text-center mb-2">{error}</p>}
        <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center gap-3"
        >
            <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your thoughts here..."
                className="flex-grow bg-slate-800/80 text-white placeholder-gray-400 px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                disabled={isLoading}
                aria-label="Chat input"
            />
            <button
                type="submit"
                disabled={isLoading || userInput.trim() === ''}
                className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition font-semibold flex items-center justify-center active:scale-95 flex-shrink-0 h-12 w-12 disabled:bg-gray-500 disabled:cursor-not-allowed"
                aria-label="Send message"
            >
                {isLoading ? <LoaderIcon className="w-6 h-6"/> : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                )}
            </button>
        </form>
      </footer>
    </div>
  );
};

export default MindfulMomentsModule;