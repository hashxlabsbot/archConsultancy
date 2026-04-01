'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
    HiOutlineMicrophone,
    HiOutlineSpeakerWave,
    HiOutlineStopCircle,
    HiOutlineTrash,
} from 'react-icons/hi2';

interface SpeechTextareaProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
    rows?: number;
}

export default function SpeechTextarea({
    value,
    onChange,
    placeholder,
    className = '',
    required,
    rows,
}: SpeechTextareaProps) {
    const { data: session } = useSession();
    const role = ((session?.user as any)?.role || '').trim().toUpperCase();
    const isSiteSupervisor = role === 'SITE_SUPERVISOR';

    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isHindi, setIsHindi] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    // Refs to avoid stale closures
    const recognitionRef = useRef<any>(null);
    const finalRef = useRef('');          // English text confirmed before this session
    const hindiBufferRef = useRef('');    // Raw Hindi accumulation for this session
    const isHindiRef = useRef(false);     // Mirrors isHindi state inside event callbacks
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // ── Audio recording (site supervisor only) ────────────────────────────────
    const startAudioRecording = async () => {
        if (!isSiteSupervisor) return;
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
                stream.getTracks().forEach((t) => t.stop());
            };
            mediaRecorderRef.current = recorder;
            recorder.start();
        } catch {
            // Microphone permission denied or not available — continue without recording
        }
    };

    const stopAudioRecording = () => {
        try {
            if (mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        } catch { }
    };

    // ── Translation via MyMemory (free, no API key) ───────────────────────────
    const translateHindiToEnglish = async (text: string): Promise<string> => {
        if (!text.trim()) return text;
        try {
            const res = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=hi|en`
            );
            const data = await res.json();
            const translated = data.responseData?.translatedText;
            // MyMemory returns the original if translation fails
            return translated && translated !== text ? translated : text;
        } catch {
            return text; // Fallback: keep original text
        }
    };

    // ── Speech recognition ────────────────────────────────────────────────────
    const startListening = async () => {
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        // Snapshot state for this session
        finalRef.current = value;
        hindiBufferRef.current = '';
        isHindiRef.current = isHindi;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = isHindi ? 'hi-IN' : 'en-IN';

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
                // Accumulate raw Hindi; show it as a live preview with indicator
                hindiBufferRef.current += newFinalText;
                const preview = finalRef.current +
                    (hindiBufferRef.current ? `[${hindiBufferRef.current.trim()}] ` : '') +
                    (interimText ? `[${interimText}]` : '');
                onChange(preview);
            } else {
                if (newFinalText) finalRef.current += newFinalText;
                onChange(finalRef.current + interimText);
            }
        };

        recognition.onerror = () => {
            setIsListening(false);
            stopAudioRecording();
        };

        // On end: translate accumulated Hindi if needed
        recognition.onend = async () => {
            stopAudioRecording();
            if (isHindiRef.current && hindiBufferRef.current.trim()) {
                setIsTranslating(true);
                try {
                    const translated = await translateHindiToEnglish(hindiBufferRef.current);
                    finalRef.current += translated + ' ';
                    onChange(finalRef.current.trimEnd());
                } finally {
                    hindiBufferRef.current = '';
                    setIsTranslating(false);
                }
            }
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);

        // Start audio recording in parallel (site supervisor only)
        await startAudioRecording();
    };

    const stopListening = () => {
        recognitionRef.current?.stop(); // triggers recognition.onend → translation
    };

    // ── Text-to-speech ────────────────────────────────────────────────────────
    const speak = () => {
        if (!value || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(value);
        utterance.lang = 'en-IN';
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
    };

    return (
        <div className="space-y-2">
            {/* Textarea with controls */}
            <div className="relative">
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
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
                        className={`px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-sm ${
                            isHindi
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
                        title={
                            isListening
                                ? 'Stop & translate'
                                : isHindi
                                ? 'Speak in Hindi — will auto-translate to English'
                                : 'Speak to type'
                        }
                        className={`p-1.5 rounded-lg transition-all shadow-sm ${
                            isListening
                                ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-300'
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
                    {value.trim() && !isListening && (
                        <button
                            type="button"
                            onClick={isSpeaking ? stopSpeaking : speak}
                            title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                            className={`p-1.5 rounded-lg transition-all shadow-sm ${
                                isSpeaking
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
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                    isTranslating ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
                }`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isTranslating ? 'bg-amber-400 animate-pulse' : 'bg-red-500 animate-pulse'
                    }`} />
                    {isTranslating
                        ? 'Translating Hindi → English…'
                        : isHindi
                        ? 'Listening in Hindi — spoken text will be translated to English when you stop'
                        : 'Listening…'}
                </div>
            )}

            {/* Hindi mode hint (idle) */}
            {isHindi && !isListening && !isTranslating && (
                <p className="text-[11px] text-orange-500 font-medium px-1">
                    Hindi mode active — tap the mic and speak in Hindi, it will be saved in English.
                </p>
            )}

            {/* Audio playback — site supervisor only */}
            {isSiteSupervisor && audioUrl && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-3">
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wider mb-1.5">
                            Recorded Audio Reference
                        </p>
                        <audio controls src={audioUrl} className="w-full" style={{ height: '32px' }} />
                    </div>
                    <button
                        type="button"
                        onClick={clearAudio}
                        title="Discard recording"
                        className="p-1.5 rounded-lg text-orange-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                        <HiOutlineTrash className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
