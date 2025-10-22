import React, { useState, useRef, useEffect, useCallback } from 'react';
import Module from './Module';
import { GolfIcon, UploadIcon, SparklesIcon, AlertTriangleIcon, ImageIcon, ChevronLeftIcon, TagIcon, LoaderIcon } from './icons';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import usePersistentState from '../hooks/usePersistentState';
import { format } from 'date-fns';
import { logToDailyLog } from '../services/logService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Let TypeScript know about the MediaPipe global variable
declare const mp: any;

// --- TYPE DEFINITIONS ---
type View = 'idle' | 'preview' | 'analyzing' | 'result' | 'error' | 'history';

interface SwingPositionAnalysis {
    proTip: string;
    correctiveDrill: string;
}

interface SwingAnalysis {
    summary: string;
    breakdown: {
        setup: SwingPositionAnalysis;
        backswing: SwingPositionAnalysis;
        topOfSwing: SwingPositionAnalysis;
        downswing: SwingPositionAnalysis;
        impact: SwingPositionAnalysis;
        followThrough: SwingPositionAnalysis;
    };
}

interface SwingHistoryEntry {
  id: number;
  swingType: 'Face On' | 'Down the Line';
  analysis: SwingAnalysis;
  generatedImage: string | null;
  thumbnail: string; // base64 jpeg string of a key frame
  tags: string[];
  savedAt: string; // ISO string
}

interface KeyFrame {
    position: string;
    image: string; // base64 jpeg data URL
}

// Helper function to extract frames from a video file.
const extractFramesFromVideo = (
    videoFile: File, 
    framesToExtract: number, 
    onProgress: (progress: string) => void,
    startTime: number,
    endTime: number,
): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const MAX_FRAMES_PER_SECOND = 10;
        const EXTRACTION_TIMEOUT = 30000; // 30 seconds
        const clipDuration = endTime - startTime;

        console.debug(`Starting video frame extraction from ${startTime.toFixed(2)}s to ${endTime.toFixed(2)}s.`);
        onProgress('Initializing video processor...');

        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const videoUrl = URL.createObjectURL(videoFile);
        let timeoutId: number | undefined;

        const cleanup = () => {
            console.debug("Cleaning up video resources.");
            if (timeoutId) clearTimeout(timeoutId);
            video.onerror = null;
            video.onloadedmetadata = null;
            video.removeAttribute('src');
            video.load();
            URL.revokeObjectURL(videoUrl);
        };

        timeoutId = window.setTimeout(() => {
            cleanup();
            reject(new Error("Frame extraction timed out. The video may be too large, in an unsupported format, or the browser is too slow."));
        }, EXTRACTION_TIMEOUT);

        if (!context) {
            cleanup();
            return reject(new Error("Could not get 2D canvas context. This may be due to browser limitations."));
        }

        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.src = videoUrl;

        video.onerror = (e) => {
            cleanup();
            console.error("Video element error:", e);
            reject(new Error("Error loading video file. It may be corrupt or in an unsupported format."));
        };

        video.onloadedmetadata = async () => {
            try {
                console.debug(`Video metadata loaded. Full Duration: ${video.duration}s, Dimensions: ${video.videoWidth}x${video.videoHeight}`);

                if (!isFinite(video.duration) || clipDuration <= 0 || video.videoWidth === 0) {
                    cleanup();
                    return reject(new Error("Video metadata is invalid or clip duration is zero. Please try a different video or selection."));
                }
                
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                const actualFramesToExtract = Math.min(
                    framesToExtract, 
                    Math.floor(clipDuration * MAX_FRAMES_PER_SECOND)
                );

                if (actualFramesToExtract < 3) {
                    cleanup();
                    return reject(new Error(`Selected clip is too short (${clipDuration.toFixed(2)}s) for meaningful analysis.`));
                }
                
                onProgress(`Found ${actualFramesToExtract} key frames to analyze.`);
                await new Promise(res => setTimeout(res, 500)); 

                console.debug(`Adjusted frame count for clip length. Will extract ${actualFramesToExtract} frames.`);
                const interval = clipDuration / actualFramesToExtract;
                const frames: string[] = [];

                for (let i = 0; i < actualFramesToExtract; i++) {
                    const time = startTime + (i * interval);
                    video.currentTime = time;

                    await new Promise<void>((res, rej) => {
                        video.addEventListener('seeked', () => res(), { once: true });
                        video.addEventListener('error', () => rej(new Error('An error occurred while seeking the video.')), { once: true });
                    });
                    
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                    frames.push(base64Data);
                    onProgress(`Capturing Frame ${i + 1} of ${actualFramesToExtract}...`);
                    console.debug(`Captured frame ${i + 1}/${actualFramesToExtract} at time ${time.toFixed(2)}s`);
                }

                cleanup();
                onProgress("Frame extraction complete.");
                console.debug("Frame extraction completed successfully.");
                resolve(frames);
            } catch (err) {
                cleanup();
                console.error("Error during frame processing:", err);
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during frame processing.";
                reject(new Error(errorMessage));
            }
        };
    });
};


const analyzePoseAndExtractKeyFrames = async (
    videoFile: File,
    startTime: number,
    endTime: number,
    onProgress: (progress: string) => void
): Promise<KeyFrame[]> => {
    // 1. Initialize PoseLandmarker
    onProgress('Initializing pose model...');
    const { PoseLandmarker, FilesetResolver } = (window as any).mp.tasks.vision;
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
    const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1,
    });
    
    // 2. Process video frames
    onProgress('Analyzing swing motion...');
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not create canvas context.");

    video.src = URL.createObjectURL(videoFile);
    await new Promise(resolve => video.onloadedmetadata = resolve);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const clipDuration = endTime - startTime;
    const FPS = 15;
    const frameCount = Math.floor(clipDuration * FPS);
    const frameData: { timestamp: number; landmarks: any[] }[] = [];

    for (let i = 0; i < frameCount; i++) {
        const timestamp = startTime + (i / FPS);
        video.currentTime = timestamp;
        await new Promise<void>(res => video.onseeked = () => res());
        const result = poseLandmarker.detectForVideo(video, Math.round(timestamp * 1000));
        if (result.landmarks && result.landmarks.length > 0) {
            frameData.push({ timestamp, landmarks: result.landmarks[0] });
        }
        onProgress(`Analyzing motion... ${Math.round((i / frameCount) * 100)}%`);
    }

    // 3. Find key positions using heuristics
    onProgress('Identifying key positions...');
    if (frameData.length < 5) throw new Error("Could not find enough pose data. Please ensure the full swing is visible in the trimmed clip.");

    const getWristsY = (landmarks: any[]) => (landmarks[15].y + landmarks[16].y) / 2;
    const addressFrame = frameData[0];
    const topFrame = [...frameData].sort((a, b) => getWristsY(a.landmarks) - getWristsY(b.landmarks))[0];
    const topIndex = frameData.findIndex(f => f.timestamp === topFrame.timestamp);
    const downswingFrames = frameData.slice(topIndex);
    const impactFrame = downswingFrames.length > 0 ? [...downswingFrames].sort((a, b) => getWristsY(b.landmarks) - getWristsY(a.landmarks))[0] : frameData[frameData.length - 1];
    const impactIndex = frameData.findIndex(f => f.timestamp === impactFrame.timestamp);
    const followThroughFrames = frameData.slice(impactIndex);
    const finishFrame = followThroughFrames.length > 0 ? [...followThroughFrames].sort((a, b) => getWristsY(a.landmarks) - getWristsY(b.landmarks))[0] : frameData[frameData.length - 1];
    const takeawayTimestamp = addressFrame.timestamp + (topFrame.timestamp - addressFrame.timestamp) / 3;
    const takeawayFrame = frameData.reduce((prev, curr) => Math.abs(curr.timestamp - takeawayTimestamp) < Math.abs(prev.timestamp - takeawayTimestamp) ? curr : prev);

    const keyTimestamps: Record<string, number> = {
        'P1: Address': addressFrame.timestamp,
        'P2: Takeaway': takeawayFrame.timestamp,
        'P3: Top of Swing': topFrame.timestamp,
        'P4: Impact': impactFrame.timestamp,
        'P5: Finish': finishFrame.timestamp,
    };

    // 4. Extract frame images for these timestamps
    onProgress('Extracting key frames...');
    const keyFrames: KeyFrame[] = [];
    for (const position in keyTimestamps) {
        const timestamp = keyTimestamps[position];
        video.currentTime = timestamp;
        await new Promise<void>(res => video.onseeked = () => res());
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = canvas.toDataURL('image/jpeg', 0.8);
        keyFrames.push({ position, image });
    }

    // 5. Cleanup and return
    URL.revokeObjectURL(video.src);
    poseLandmarker.close();
    return keyFrames;
};


const SwingStationModule: React.FC<{ className?: string }> = ({ className = '' }) => {
    const [view, setView] = useState<View>('idle');
    const [swingType, setSwingType] = useState<'Face On' | 'Down the Line' | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [analysis, setAnalysis] = useState<SwingAnalysis | null>(null);
    const [error, setError] = useState<string>('');
    const [analysisStep, setAnalysisStep] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const activeHandleRef = useRef<'start' | 'end' | null>(null);
    
    // State for video trimming
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [videoDuration, setVideoDuration] = useState<number | null>(null);

    // State for history and saving
    const [swingHistory, setSwingHistory] = usePersistentState<SwingHistoryEntry[]>('swingHistory', []);
    const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
    const [tags, setTags] = useState('');
    const [justSavedId, setJustSavedId] = useState<number | null>(null);
    const [viewingHistoryItem, setViewingHistoryItem] = useState<SwingHistoryEntry | null>(null);
    
    // New state for pose estimation results
    const [keyFrames, setKeyFrames] = useState<KeyFrame[]>([]);


    const handleSelectSwingType = (type: 'Face On' | 'Down the Line') => {
        setSwingType(type);
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            setVideoFile(file);
            const url = URL.createObjectURL(file);
            setVideoUrl(url);
            setView('preview');
        } else if (file) {
            setError('Unsupported format. Please select a valid video file.');
            setView('error');
        }
    };
    
    const handleGenerateAnalysis = async () => {
        if (!videoFile || !swingType || endTime === null) return;
        
        setView('analyzing');
        setError('');
        setAnalysisStep('Preparing video...');
        setKeyFrames([]);

        const generateVisualDrill = async (analysisSummary: string) => {
            try {
                const imageGenPrompt = `
                    Based on the following golf swing analysis summary, create a simple and clear instructional diagram. 
                    The diagram should illustrate the single most important corrective drill implied by the summary. 
                    Use a 'Correct' vs. 'Incorrect' side-by-side format if applicable. 
                    Use simple lines, arrows, and stick figures to make it easy to understand. 
                    The style should be clean, minimalist, and look like a modern golf coaching manual. Add a title for the drill.

                    Analysis Summary:
                    "${analysisSummary}"
                `;

                const imageResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: imageGenPrompt }] },
                    config: {
                        responseModalities: [Modality.IMAGE],
                    },
                });

                let base64ImageBytes: string | null = null;
                for (const part of imageResponse.candidates[0].content.parts) {
                    if (part.inlineData) {
                        base64ImageBytes = part.inlineData.data;
                        break;
                    }
                }
                
                if (base64ImageBytes) {
                    const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                    setGeneratedImage(imageUrl);
                } else {
                    console.warn("Could not generate visual aid, but text analysis is available.");
                }
            } catch (imageGenError) {
                console.error("Failed to generate visual drill:", imageGenError);
            }
        };
        
        try {
            const geminiAnalysisPromise = (async () => {
                const frames = await extractFramesFromVideo(videoFile, 15, (p) => setAnalysisStep(p), startTime, endTime);
                setCapturedFrames(frames);
                setAnalysisStep('Analyzing key positions with AI...');
    
                const imageParts = frames.map(frame => ({ inlineData: { mimeType: 'image/jpeg', data: frame } }));
                const analysisPrompt = `You are a world-renowned golf coach. Analyze the provided swing frames from a ${swingType} perspective and return your analysis in a structured JSON format. For each key position, provide a "Pro Tip" (ideal movement) and a "Corrective Drill" (an actionable exercise). The overall summary should be a brief, encouraging overview identifying the single most important area for improvement.`;
                const swingPositionSchema = { type: Type.OBJECT, properties: { proTip: { type: Type.STRING }, correctiveDrill: { type: Type.STRING } }, required: ['proTip', 'correctiveDrill'] };
                const responseSchema = { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, breakdown: { type: Type.OBJECT, properties: { setup: swingPositionSchema, backswing: swingPositionSchema, topOfSwing: swingPositionSchema, downswing: swingPositionSchema, impact: swingPositionSchema, followThrough: swingPositionSchema }, required: ['setup', 'backswing', 'topOfSwing', 'downswing', 'impact', 'followThrough'] } }, required: ['summary', 'breakdown'] };
                const contents = { parts: [{ text: analysisPrompt }, ...imageParts] };
    
                const analysisResponse = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: contents, config: { responseMimeType: "application/json", responseSchema } });
    
                try {
                    const analysisResult: SwingAnalysis = JSON.parse(analysisResponse.text);
                    setAnalysis(analysisResult);
                    return analysisResult;
                } catch (jsonError) {
                    console.error("Failed to parse JSON:", jsonError, "Raw:", analysisResponse.text);
                    throw new Error("Received an invalid analysis format from the AI.");
                }
            })();

            const poseAnalysisPromise = analyzePoseAndExtractKeyFrames(videoFile, startTime, endTime, (p) => setAnalysisStep(p))
                .then(kfs => setKeyFrames(kfs));

            const [analysisResult] = await Promise.all([geminiAnalysisPromise, poseAnalysisPromise]);
            
            setView('result');
            setAnalysisStep('Creating a visual drill...');
            await generateVisualDrill(analysisResult.summary);
            setAnalysisStep('');

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
            setError(errorMessage);
            setView('error');
        }
    };

    const handleSaveAnalysis = () => {
        if (!analysis || capturedFrames.length === 0 || !swingType) return;

        const newEntry: SwingHistoryEntry = {
            id: Date.now(),
            swingType: swingType,
            analysis: analysis,
            generatedImage: generatedImage,
            thumbnail: capturedFrames[Math.floor(capturedFrames.length / 2)] || capturedFrames[0], // Use middle frame
            tags: tags.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(Boolean),
            savedAt: new Date().toISOString(),
        };

        setSwingHistory([newEntry, ...swingHistory]);
        logToDailyLog('swing_analysis_saved', { swingType: newEntry.swingType, tags: newEntry.tags });
        setJustSavedId(newEntry.id);
    };

    const resetState = () => {
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        setView('idle'); setSwingType(null); setVideoFile(null); setVideoUrl('');
        setAnalysis(null); setError(''); setGeneratedImage(null); setAnalysisStep('');
        setStartTime(0); setEndTime(null); setVideoDuration(null);
        setCapturedFrames([]); setTags(''); setJustSavedId(null); setViewingHistoryItem(null);
        setKeyFrames([]);
        if(fileInputRef.current) fileInputRef.current.value = '';
    };
    
    useEffect(() => {
        return () => { if (videoUrl) URL.revokeObjectURL(videoUrl); };
    }, [videoUrl]);
    
    // --- Video Trimmer Logic ---
    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const duration = videoRef.current.duration;
            setVideoDuration(duration);
            setEndTime(duration);
            videoRef.current.play();
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current && endTime !== null && videoRef.current.currentTime >= endTime) {
            videoRef.current.currentTime = startTime;
            videoRef.current.play();
        }
    };
    
    const handleDragStart = (handle: 'start' | 'end') => { activeHandleRef.current = handle; };

    const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!activeHandleRef.current || !timelineRef.current || videoDuration === null) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const rect = timelineRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        const time = (percent / 100) * videoDuration;

        if (activeHandleRef.current === 'start') {
            const newStartTime = Math.min(time, endTime ?? videoDuration);
            setStartTime(newStartTime);
            if(videoRef.current && videoRef.current.currentTime < newStartTime) {
                videoRef.current.currentTime = newStartTime;
            }
        } else {
            setEndTime(Math.max(time, startTime));
        }
    }, [videoDuration, startTime, endTime]);

    const handleDragEnd = useCallback(() => { activeHandleRef.current = null; }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('touchmove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchend', handleDragEnd);

        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [handleDragMove, handleDragEnd]);


    const renderIdle = () => (
        <div className="text-center p-4 flex flex-col items-center justify-center min-h-[20rem]">
            <GolfIcon className="w-16 h-16 text-indigo-400 mb-4" />
            <h3 className="text-body-emphasis text-gray-200 mb-2">Get Instant Swing Feedback</h3>
            <p className="text-caption mb-6 max-w-sm">Upload a video of your swing and let our AI coach provide you with a detailed analysis and actionable tips.</p>
            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => handleSelectSwingType('Face On')} className="flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition">
                   <UploadIcon className="w-5 h-5" /> Face On View
                </button>
                <button onClick={() => handleSelectSwingType('Down the Line')} className="flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition">
                    <UploadIcon className="w-5 h-5" /> Down the Line
                </button>
            </div>
            {swingHistory.length > 0 && (
                <button onClick={() => setView('history')} className="mt-6 text-indigo-300 font-semibold hover:underline">
                    View Swing History ({swingHistory.length})
                </button>
            )}
        </div>
    );
    
    const renderPreview = () => {
        const startPercent = videoDuration ? (startTime / videoDuration) * 100 : 0;
        const endPercent = videoDuration && endTime ? (endTime / videoDuration) * 100 : 100;

        return (
            <div className="p-4 flex flex-col items-center">
                <h3 className="text-body-emphasis mb-2">{swingType} View</h3>
                <video 
                    ref={videoRef}
                    src={videoUrl} 
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    muted loop playsInline
                    className="w-full max-w-md rounded-lg mb-4 border border-white/10 bg-black" 
                    title={`Video preview of ${swingType} swing`} 
                />
                
                <div className="w-full max-w-md">
                    <p className="text-caption text-center mb-2">Drag handles to trim video to just your swing</p>
                    <div className="relative w-full px-2">
                        <div ref={timelineRef} className="relative h-2 bg-gray-600 rounded-full cursor-pointer"
                             onMouseDown={(e) => {
                                 const rect = e.currentTarget.getBoundingClientRect();
                                 const percent = ((e.clientX - rect.left) / rect.width) * 100;
                                 if (Math.abs(percent - startPercent) < Math.abs(percent - endPercent)) {
                                     handleDragStart('start');
                                 } else {
                                     handleDragStart('end');
                                 }
                                 handleDragMove(e.nativeEvent);
                             }}
                        >
                            <div className="absolute h-full bg-gray-800 rounded-full" style={{ left: 0, width: `${startPercent}%` }} />
                            <div className="absolute h-full bg-gray-800 rounded-full" style={{ right: 0, width: `${100 - endPercent}%` }} />
                            <div 
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full shadow cursor-grab active:cursor-grabbing"
                                style={{ left: `${startPercent}%` }}
                                onMouseDown={(e) => { e.stopPropagation(); handleDragStart('start'); }}
                                onTouchStart={(e) => { e.stopPropagation(); handleDragStart('start'); }}
                            />
                            <div 
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full shadow cursor-grab active:cursor-grabbing"
                                style={{ left: `${endPercent}%` }}
                                onMouseDown={(e) => { e.stopPropagation(); handleDragStart('end'); }}
                                onTouchStart={(e) => { e.stopPropagation(); handleDragStart('end'); }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-400 font-mono">
                            <span>{startTime.toFixed(1)}s</span>
                            <span>{endTime?.toFixed(1)}s</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <button onClick={resetState} className="px-6 py-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">Choose a different video</button>
                    <button onClick={handleGenerateAnalysis} className="px-6 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5" /> Generate Analysis
                    </button>
                </div>
            </div>
        );
    };
    
    const renderAnalyzing = () => (
        <div className="text-center p-8 flex flex-col items-center justify-center min-h-[20rem]" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mb-4"></div>
            <h3 className="text-body-emphasis text-gray-200">Analyzing Your Swing...</h3>
            <p className="text-caption mt-2 h-6 transition-opacity duration-500">{analysisStep}</p>
        </div>
    );
    
    const renderResult = () => {
        if (!analysis) return null;

        const breakdownTitles: Record<keyof SwingAnalysis['breakdown'], string> = {
            setup: 'Setup',
            backswing: 'Backswing',
            topOfSwing: 'Top of Swing',
            downswing: 'Downswing',
            impact: 'Impact',
            followThrough: 'Follow-through',
        };
        
        const isViewingHistory = !!viewingHistoryItem;
        const isSaved = justSavedId !== null;

        return (
            <div className="p-4 max-h-[75vh] overflow-y-auto pr-2">
                 {isViewingHistory && (
                    <div className="mb-4 bg-white/5 p-3 rounded-lg text-center">
                        <p className="text-caption">Viewing analysis from <span className="font-semibold text-indigo-300">{format(new Date(viewingHistoryItem.savedAt), 'MMMM d, yyyy')}</span></p>
                    </div>
                 )}
                
                <div className="mb-6">
                    <h3 className="text-body-emphasis text-indigo-300 mb-4 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Key Swing Positions
                    </h3>
                    {keyFrames.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {keyFrames.map(frame => (
                            <div key={frame.position} className="text-center flex flex-col gap-2">
                            <img src={frame.image} alt={`Key frame: ${frame.position}`} className="w-full rounded-lg border border-white/10" />
                            <div>
                                <h4 className="text-sm font-semibold">{frame.position}</h4>
                                <p className="text-xs text-gray-400 mt-1 bg-black/30 p-2 rounded">AI Feedback coming soon...</p>
                            </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div className="w-full aspect-[2/1] bg-black/30 rounded-lg flex flex-col items-center justify-center text-center p-4">
                            <LoaderIcon className="w-8 h-8 text-indigo-400 mb-4" />
                            <p className="text-body-emphasis">Finalizing key frames...</p>
                        </div>
                    )}
                </div>


                <div className="mb-6">
                    <h3 className="text-body-emphasis text-indigo-300 mb-2 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Visual Feedback
                    </h3>
                    {generatedImage ? (
                        <img src={generatedImage} alt="AI-generated visual diagram of a corrective golf swing drill" className="w-full rounded-lg border border-white/10 bg-black" />
                    ) : (
                        <div className="w-full aspect-video bg-black/30 rounded-lg flex flex-col items-center justify-center text-center p-4">
                            {analysisStep ? (
                                <>
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mb-4"></div>
                                    <p className="text-body-emphasis text-gray-200">{analysisStep}</p>
                                </>
                            ) : (
                                 <>
                                    <AlertTriangleIcon className="w-8 h-8 text-yellow-400 mb-4" />
                                    <p className="text-body-emphasis text-yellow-300">Could not generate visual drill.</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white/5 rounded-lg p-4 space-y-6">
                    <div>
                        <h2 className="text-module-header text-indigo-300 mb-2">Overall Summary</h2>
                        <p className="text-body">{analysis.summary}</p>
                    </div>
                    
                    <div>
                        <h2 className="text-module-header text-indigo-300 mb-4">Detailed Breakdown</h2>
                        <div className="space-y-4">
                            {(Object.keys(analysis.breakdown) as Array<keyof SwingAnalysis['breakdown']>).map((key) => {
                                const value = analysis.breakdown[key];
                                return (
                                <div key={key} className="bg-black/20 p-4 rounded-md">
                                    <h3 className="font-semibold text-white capitalize mb-2">{breakdownTitles[key]}</h3>
                                    <div className="pl-4 border-l-2 border-green-400/50">
                                        <p className="text-sm font-semibold text-green-300">Pro Tip:</p>
                                        <p className="text-caption text-gray-300">{value.proTip}</p>
                                    </div>
                                    <div className="pl-4 border-l-2 border-yellow-400/50 mt-3">
                                        <p className="text-sm font-semibold text-yellow-300">Corrective Drill:</p>
                                        <p className="text-caption text-gray-300">{value.correctiveDrill}</p>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                </div>

                {!isViewingHistory && (
                    <div className="mt-6 p-4 bg-white/5 rounded-lg">
                        <h3 className="text-body-emphasis mb-2">Save Analysis</h3>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input 
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="Add tags, e.g., #Driver, #RangeDay"
                                className="flex-grow bg-black/30 text-white placeholder-gray-400 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                                disabled={isSaved}
                            />
                            <button onClick={handleSaveAnalysis} disabled={isSaved} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:bg-green-600 disabled:cursor-not-allowed">
                                {isSaved ? 'Saved!' : 'Save to History'}
                            </button>
                        </div>
                    </div>
                )}

                <button onClick={isViewingHistory ? () => setView('history') : resetState} className="mt-6 w-full px-6 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition">
                    {isViewingHistory ? 'Back to History' : 'Analyze Another Swing'}
                </button>
            </div>
        );
    };

    const renderHistory = () => {
        const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

        const allTags = [...new Set(swingHistory.flatMap(item => item.tags))];
        const filteredHistory = activeTagFilter 
            ? swingHistory.filter(item => item.tags.includes(activeTagFilter))
            : swingHistory;

        const handleViewHistoryItem = (item: SwingHistoryEntry) => {
            setAnalysis(item.analysis);
            setGeneratedImage(item.generatedImage);
            setViewingHistoryItem(item);
            // Since we don't save keyframes in history, we'll reset them
            setKeyFrames([]); 
            setView('result');
        };

        return (
            <div className="p-4">
                <button onClick={() => setView('idle')} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white mb-4">
                    <ChevronLeftIcon className="w-5 h-5" /> Back
                </button>
                <h3 className="text-module-header mb-4">Swing History</h3>
                
                {allTags.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-body-emphasis mb-2 flex items-center gap-2"><TagIcon className="w-4 h-4"/> Filter by Tag</h4>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setActiveTagFilter(null)} className={`px-3 py-1 text-sm rounded-full transition ${!activeTagFilter ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>All</button>
                            {allTags.map(tag => (
                                <button key={tag} onClick={() => setActiveTagFilter(tag)} className={`px-3 py-1 text-sm rounded-full capitalize transition ${activeTagFilter === tag ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>#{tag}</button>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map(item => (
                            <button key={item.id} onClick={() => handleViewHistoryItem(item)} className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition text-left">
                                <img src={`data:image/jpeg;base64,${item.thumbnail}`} alt="Swing thumbnail" className="w-24 h-24 object-cover rounded-md bg-black" />
                                <div className="flex-1">
                                    <p className="text-caption text-gray-400">{format(new Date(item.savedAt), 'MMMM d, yyyy')}</p>
                                    <p className="font-semibold text-white">{item.swingType} View</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {item.tags.map(tag => <span key={tag} className="px-2 py-1 text-xs bg-indigo-500/10 text-indigo-300 rounded-full">#{tag}</span>)}
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <p className="font-semibold">No Swings Found</p>
                            <p className="text-sm mt-2">{activeTagFilter ? `No swings with the tag #${activeTagFilter}` : 'Your saved analyses will appear here.'}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };
    
    const renderError = () => {
        let title = "Analysis Failed";
        let message = error;
        let suggestion = "There was an unexpected issue. Please try again with a different video file.";
        const lowerCaseError = error.toLowerCase();

        if (lowerCaseError.includes("too short")) {
            title = "Video Clip Too Short";
            message = "The selected video clip is too short for a meaningful swing analysis.";
            suggestion = "Please select a clip that is at least a few seconds long and shows the complete swing.";
        } else if (lowerCaseError.includes("unsupported format") || lowerCaseError.includes("valid video file")) {
            title = "Unsupported Video";
            message = "The video format is not supported, or the file may be corrupt.";
            suggestion = "Please try a standard video format like MP4, MOV, or WebM.";
        } else if (lowerCaseError.includes("timed out")) {
            title = "Analysis Timed Out";
            message = "Video processing took too long. This can happen with very large files or on slower devices.";
            suggestion = "Please try a shorter video clip (under 30 seconds) or a smaller file size.";
        } else if (lowerCaseError.includes("browser limitations") || lowerCaseError.includes("canvas context")) {
            title = "Browser Incompatible";
            message = "Your browser may not fully support the features required for video analysis.";
            suggestion = "For best results, please use a modern browser like Chrome or Firefox on a desktop computer.";
        } else if (lowerCaseError.includes("metadata is invalid")) {
            title = "Corrupt Video File";
            message = "The video file appears to be corrupt or missing important metadata.";
            suggestion = "Please try re-exporting the video or using a different file.";
        }

        return (
            <div className="text-center p-8 flex flex-col items-center justify-center min-h-[20rem] bg-red-500/10 rounded-lg" role="alert">
                <AlertTriangleIcon className="w-12 h-12 text-red-400 mb-4" />
                <h3 className="text-body-emphasis text-red-300">{title}</h3>
                <p className="text-caption text-red-400 mt-2 max-w-sm">{message}</p>
                <p className="text-caption text-sm mt-4 max-w-sm">{suggestion}</p>
                <button onClick={resetState} className="mt-6 px-6 py-4 bg-red-500/80 text-white font-semibold rounded-lg hover:bg-red-500 transition">Try Again</button>
            </div>
        );
    };

    const renderContent = () => {
        switch(view) {
            case 'idle': return renderIdle();
            case 'preview': return renderPreview();
            case 'analyzing': return renderAnalyzing();
            case 'result': return renderResult();
            case 'history': return renderHistory();
            case 'error': return renderError();
            default: return renderIdle();
        }
    }

    return (
        <Module title="Swing Station" icon={<GolfIcon />} className={className}>
            {renderContent()}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*"
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
            />
        </Module>
    );
};

export default SwingStationModule;