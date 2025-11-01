
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob as GenAIBlob } from "@google/genai";
import { MicIcon, CloseIcon } from './icons/EditorIcons';

interface TranscriptionUIProps {
    ai: GoogleGenAI | null;
    onClose: () => void;
    onInsert: (text: string) => void;
    setToast: (message: string) => void;
    t: (key: string) => string;
}

// Helper function to encode audio data
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

const TranscriptionUI: React.FC<TranscriptionUIProps> = ({ ai, onClose, onInsert, setToast, t }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    
    const sessionRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const cleanup = () => {
        if (sessionRef.current) {
            sessionRef.current.then(session => session.close());
            sessionRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
         if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const startRecording = async () => {
        if (!ai) return;
        setIsRecording(true);
        setTranscript('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // FIX: Cast window to any to allow for webkitAudioContext which is used for cross-browser compatibility.
            const inputAudioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = inputAudioContext;

            sessionRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        sourceRef.current = source;
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const int16 = new Int16Array(inputData.length);
                            for (let i = 0; i < inputData.length; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: GenAIBlob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            
                            if (sessionRef.current) {
                                sessionRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            setTranscript(prev => prev + message.serverContent!.inputTranscription!.text);
                        }
                        if (message.serverContent?.turnComplete) {
                            // Can add logic here if needed when a turn is complete.
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Transcription error:', e);
                        setToast(t('toasts.aiAnalysisError'));
                        stopRecording();
                    },
                    onclose: () => {
                        // console.log('Transcription session closed.');
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                },
            });
        } catch (error) {
            console.error('Failed to get user media:', error);
            setToast(t('toasts.aiMicError'));
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        setIsRecording(false);
        cleanup();
    };

    // Cleanup on component unmount
    useEffect(() => {
        return () => cleanup();
    }, []);

    const handleInsert = () => {
        if (transcript.trim()) {
            onInsert(transcript.trim());
        }
    };

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
            <header className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t('transcription.title')}</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                    <CloseIcon />
                </button>
            </header>
            <div className="p-4 flex-grow">
                <div 
                  className="w-full h-24 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 overflow-y-auto text-sm"
                  aria-live="polite"
                >
                    {transcript || (isRecording && <span className="text-gray-500">{t('transcription.recording')}</span>)}
                </div>
            </div>
            <footer className="p-3 flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 w-40 ${isRecording ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white'}`}
                >
                    <MicIcon className="w-4 h-4" />
                    {isRecording ? t('transcription.stop') : t('transcription.start')}
                </button>
                 <button
                    onClick={handleInsert}
                    disabled={!transcript.trim() || isRecording}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t('transcription.insert')}
                </button>
            </footer>
        </div>
    );
};

export default TranscriptionUI;
