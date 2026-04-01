'use client';

import { useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
    HiOutlineMicrophone,
    HiOutlineSpeakerWave,
    HiOutlineStopCircle,
    HiOutlineTrash,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

interface SpeechTextareaProps {
    value: string;
    onChange: (val: string) => void;
    onAudioChange?: (blob: Blob | null) => void;
    onBusyChange?: (busy: boolean) => void;
    initialAudioUrl?: string;
    placeholder?: string;
    className?: string;
    required?: boolean;
    rows?: number;
}

export default function SpeechTextarea({
    value,
    onChange,
    onAudioChange,
    onBusyChange,
    initialAudioUrl,
    placeholder,
    className = '',
    required,
    rows,
}: SpeechTextareaProps) {
    const { data: session } = useSession();
    const role = ((session?.user as any)?.role || '').trim().toUpperCase();
    const canRecordAudio = role === 'SITE_SUPERVISOR' || role === 'SITE_ENGINEER' || role === 'ADMIN';

    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isHindi, setIsHindi] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
    const [timeLeft, setTimeLeft] = useState(300);

    // Stable refs — never stale inside async callbacks
    const isListeningRef = useRef(false);
    const isHindiRef = useRef(false);
    const finalRef = useRef('');        // confirmed English text accumulated this session
    const hindiBufferRef = useRef('');  // raw Hindi text accumulated this session
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;     // always points to latest onChange prop

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recognitionRef = useRef<any>(null);
    const timerRef = useRef<any>(null);
    const restartTimerRef = useRef<any>(null);
    const prevBusyRef = useRef(false);
    const valueRef = useRef(value);
    valueRef.current = value;

    // Sync finalRef when not listening to handle manual edits
    if (!isListening) {
        finalRef.current = value;
    }

    // ── Notify parent of busy state ──────────────────────────────────────────
    const currBusy = isListening || isTranslating;
    if (onBusyChange && currBusy !== prevBusyRef.current) {
        prevBusyRef.current = currBusy;
        onBusyChange(currBusy);
    }

    // ── Timer ─────────────────────────────────────────────────────────────────
    const startTimer = () => {
        setTimeLeft(300);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { stopListening(); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    };

    // ── Audio recording ───────────────────────────────────────────────────────
    const startAudioRecording = async () => {
        if (!canRecordAudio) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunksRef.current = [];
            const recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                if (onAudioChange) onAudioChange(blob);
                stream.getTracks().forEach(t => t.stop());
            };
            mediaRecorderRef.current = recorder;
            recorder.start();
        } catch (err: any) {
            const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
            if (isDenied) toast.error('Microphone access denied. Please allow microphone in your browser settings.');
        }
    };

    const stopAudioRecording = () => {
        try {
            if (mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        } catch { }
    };

    // ── Translation with 5-second timeout fallback ────────────────────────────
    const translateHindiToEnglish = async (text: string): Promise<string> => {
        if (!text.trim()) return text;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=hi|en`,
                { signal: controller.signal }
            );
            clearTimeout(timeout);
            const data = await res.json();
            const translated = data.responseData?.translatedText;
            // Return translated text only if it's different and looks like English
            if (translated && translated !== text.trim() && translated !== 'PLEASE SELECT TWO DISTINCT LANGUAGES') {
                return translated;
            }
            return text;
        } catch {
            // Timeout or network error — return original Hindi text
            return text;
        }
    };

    // ── Core: create a fresh recognition instance for each utterance ──────────
    // Using continuous:false + per-utterance restart is far more reliable than
    // continuous:true on Chrome, which can silently stop firing onresult.
    const startRecognitionSession = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition || !isListeningRef.current) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;       // single utterance — restart in onend
        recognition.interimResults = true;
        recognition.lang = isHindiRef.current ? 'hi-IN' : 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
            let interimText = '';
            let newFinalText = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    newFinalText += event.results[i][0].transcript + ' ';
                } else {
                    interimText += event.results[i][0].transcript;
                }
            }

            if (isHindiRef.current) {
                // Accumulate Hindi — show as bracketed preview until translated
                hindiBufferRef.current += newFinalText;
                const preview =
                    finalRef.current +
                    (hindiBufferRef.current ? `[${hindiBufferRef.current.trim()}] ` : '') +
                    (interimText ? `[${interimText}]` : '');
                onChangeRef.current(preview);
            } else {
                if (newFinalText) finalRef.current += newFinalText;
                onChangeRef.current(finalRef.current + interimText);
            }
        };

        recognition.onerror = (e: any) => {
            // no-speech: user was quiet — onend will restart, nothing to do
            if (e.error === 'no-speech' || e.error === 'aborted') return;

            // Fatal errors — stop and inform user
            isListeningRef.current = false;
            setIsListening(false);
            stopAudioRecording();
            stopTimer();

            if (e.error === 'not-allowed' || e.error === 'audio-capture') {
                toast.error('Microphone access denied. Allow microphone in browser settings.');
            } else if (e.error === 'network') {
                toast.error('Speech recognition needs an internet connection.');
            } else if (e.error === 'language-not-supported') {
                toast.error('Speech language not supported in this browser.');
            } else if (e.error === 'service-not-allowed') {
                toast.error('Speech recognition unavailable. Use Chrome/Edge on HTTPS.');
            } else {
                toast.error(`Speech error: ${e.error}. Try again.`);
            }
        };

        recognition.onend = () => {
            if (!isListeningRef.current) {
                // User pressed stop — finalize
                finalizeRecognition();
                return;
            }
            // Still listening — start a new instance after a short delay
            // (delay prevents rapid-fire restart loops on some Chrome versions)
            if (isListeningRef.current) {
                restartTimerRef.current = setTimeout(startRecognitionSession, 150);
            }
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
        } catch {
            // start() threw (e.g. already started in a race) — retry after delay
            if (isListeningRef.current) {
                restartTimerRef.current = setTimeout(startRecognitionSession, 200);
            }
        }
    }, []); // stable — reads all state via refs

    const finalizeRecognition = () => {
        stopAudioRecording();
        stopTimer();

        if (isHindiRef.current && hindiBufferRef.current.trim()) {
            setIsTranslating(true);
            translateHindiToEnglish(hindiBufferRef.current).then(translated => {
                finalRef.current += translated + ' ';
                onChangeRef.current(finalRef.current.trimEnd());
                hindiBufferRef.current = '';
                setIsTranslating(false);
                setIsListening(false);
            }).catch(() => {
                // Fallback: keep Hindi text as-is
                finalRef.current += hindiBufferRef.current;
                onChangeRef.current(finalRef.current.trimEnd());
                hindiBufferRef.current = '';
                setIsTranslating(false);
                setIsListening(false);
            });
        } else {
            setIsListening(false);
        }
    };

    // ── Public start/stop ──────────────────────────────────────────────────────
    const startListening = async () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('Speech recognition is not supported. Please use Chrome or Edge.');
            return;
        }

        // Seed refs from current state/props
        finalRef.current = value;
        hindiBufferRef.current = '';
        isHindiRef.current = isHindi;
        isListeningRef.current = true;

        setIsListening(true);
        startTimer();
        startRecognitionSession();
        await startAudioRecording();
    };

    const stopListening = () => {
        isListeningRef.current = false;
        clearTimeout(restartTimerRef.current);
        try { recognitionRef.current?.stop(); } catch { }
        // finalizeRecognition is called from onend after stop()
        // but if onend never fires, call it ourselves after a timeout
        setTimeout(() => {
            if (isListeningRef.current === false) finalizeRecognition();
        }, 500);
    };

    // ── Text-to-speech ────────────────────────────────────────────────────────
    const speak = () => {
        if (!value || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(value);
        utterance.lang = 'en-US';
        utterance.rate = 0.95;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    const stopSpeaking = () => {
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
    };

    const clearAudio = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        if (onAudioChange) onAudioChange(null);
    };

    return (
        <div className="space-y-2">
            {/* Textarea with controls */}
            <div className="relative">
                <textarea
                    value={value}
                    onChange={(e) => onChangeRef.current(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    rows={rows}
                    className={`${className} pr-[4.5rem]`}
                />

                <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                    {/* Language toggle EN / HI */}
                    <button
                        type="button"
                        onClick={() => {
                            const next = !isHindi;
                            setIsHindi(next);
                            isHindiRef.current = next;
                        }}
                        title={isHindi ? 'Currently Hindi → English. Click for English only.' : 'Click to speak in Hindi (auto-translates to English)'}
                        className={`px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-sm ${isHindi
                            ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-300'
                            : 'bg-slate-100 text-slate-500 hover:bg-orange-50 hover:text-orange-500'
                            }`}
                    >
                        {isHindi ? 'HI' : 'EN'}
                    </button>

                    {/* Mic button */}
                    <button
                        type="button"
                        onClick={isListening ? stopListening : startListening}
                        disabled={isTranslating}
                        title={
                            isTranslating ? 'Translating…'
                                : isListening ? 'Stop & save'
                                    : isHindi ? 'Speak in Hindi — auto-translates to English'
                                        : 'Speak to type'
                        }
                        className={`p-1.5 rounded-lg transition-all shadow-sm ${isListening
                            ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-300'
                            : isTranslating
                                ? 'bg-amber-100 text-amber-600 cursor-wait'
                                : 'bg-slate-100 text-slate-400 hover:bg-indigo-100 hover:text-indigo-600'
                            }`}
                    >
                        {isListening ? (
                            <HiOutlineStopCircle className="w-4 h-4" />
                        ) : (
                            <HiOutlineMicrophone className="w-4 h-4" />
                        )}
                    </button>

                    {/* Speaker button */}
                    {value.trim() && !isListening && !isTranslating && (
                        <button
                            type="button"
                            onClick={isSpeaking ? stopSpeaking : speak}
                            title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                            className={`p-1.5 rounded-lg transition-all shadow-sm ${isSpeaking
                                ? 'bg-indigo-100 text-indigo-600 animate-pulse ring-2 ring-indigo-300'
                                : 'bg-slate-100 text-slate-400 hover:bg-indigo-100 hover:text-indigo-600'
                                }`}
                        >
                            {isSpeaking ? (
                                <HiOutlineStopCircle className="w-4 h-4" />
                            ) : (
                                <HiOutlineSpeakerWave className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Status bar */}
            {(isListening || isTranslating) && (
                <div className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${isTranslating ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
                    }`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isTranslating ? 'bg-amber-400 animate-pulse' : 'bg-red-500 animate-pulse'
                            }`} />
                        {isTranslating
                            ? 'Translating Hindi → English…'
                            : isHindi
                                ? 'Listening in Hindi — tap stop to translate'
                                : 'Listening… speak now'}
                    </div>
                    {isListening && (
                        <span className="font-mono bg-white/50 px-1.5 py-0.5 rounded border border-red-200">
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </span>
                    )}
                </div>
            )}

            {/* Hindi mode idle hint */}
            {isHindi && !isListening && !isTranslating && (
                <p className="text-[11px] text-orange-500 font-medium px-1">
                    Hindi mode — speak in Hindi, saved in English.
                </p>
            )}

            {/* Audio playback */}
            {audioUrl && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-3">
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wider mb-1.5">
                            {canRecordAudio ? 'Recorded Audio' : 'Audio Reference'}
                        </p>
                        <audio controls src={audioUrl} className="w-full" style={{ height: '32px' }} />
                    </div>
                    {canRecordAudio && (
                        <button
                            type="button"
                            onClick={clearAudio}
                            title="Discard recording"
                            className="p-1.5 rounded-lg text-orange-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                        >
                            <HiOutlineTrash className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
