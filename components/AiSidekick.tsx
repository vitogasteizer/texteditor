



import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAIBlob } from "@google/genai";
import { CloseIcon, BotIcon, ImageIcon, MicIcon, SearchIcon, MapIcon, BrainCircuitIcon, SendIcon, StopCircleIcon, SparklesIcon } from './icons/EditorIcons';
import type { ChatMessage } from '../App';

interface AiSidekickProps {
    ai: GoogleGenAI | null;
    onClose: () => void;
    onInsertText: (text: string) => void;
    setToast: (message: string) => void;
    t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

type ActiveTab = 'chat' | 'image' | 'live';
type ChatMode = 'default' | 'search' | 'maps' | 'thinking';

// Live Conversation Audio Helper
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const AiSidekick: React.FC<AiSidekickProps> = ({ ai, onClose, onInsertText, setToast, t }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
    
    // Chat state
    const [chatMode, setChatMode] = useState<ChatMode>('default');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatting, setIsChatting] = useState(false);
    const chatBodyRef = useRef<HTMLDivElement>(null);

    // Image state
    const [imagePrompt, setImagePrompt] = useState('');
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Live state
    const [isLive, setIsLive] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState<{ user: string, model: string} | null>(null);
    const sessionRef = useRef<Promise<any> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const liveOutputAudioContextRef = useRef<AudioContext | null>(null);
    const liveNextStartTimeRef = useRef(0);

    const cleanupLive = () => {
        if (sessionRef.current) {
            sessionRef.current.then(session => session.close());
            sessionRef.current = null;
        }
        if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
        if (sourceRef.current) sourceRef.current.disconnect();
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
        if (liveOutputAudioContextRef.current && liveOutputAudioContextRef.current.state !== 'closed') liveOutputAudioContextRef.current.close();
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        setIsLive(false);
        setLiveTranscript(null);
    };

    useEffect(() => {
        return () => cleanupLive();
    }, []);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleChatSubmit = async () => {
        if (!ai) {
          setToast(t('toasts.aiNotAvailable'));
          return;
        }
        if (!chatInput.trim() || isChatting) return;

        const newUserMessage: ChatMessage = { role: 'user', text: chatInput };
        setChatHistory(prev => [...prev, newUserMessage]);
        setChatInput('');
        setIsChatting(true);

        const modelResponse: ChatMessage = { role: 'model', text: '', isThinking: true };
        setChatHistory(prev => [...prev, modelResponse]);

        try {
            let modelName = 'gemini-2.5-flash';
            let config: any = {};
            if (chatMode === 'thinking') {
                modelName = 'gemini-2.5-pro';
                config.thinkingConfig = { thinkingBudget: 32768 };
            } else if (chatMode === 'search') {
                config.tools = [{ googleSearch: {} }];
            } else if (chatMode === 'maps') {
                config.tools = [{ googleMaps: {} }];
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    config.toolConfig = { retrievalConfig: { latLng: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }}};
                } catch (e) {
                    setToast(t('toasts.geolocationError'));
                }
            }

            const stream = await ai.models.generateContentStream({
                model: modelName,
                contents: chatInput,
                config,
            });

            let fullText = '';
            let finalSources: any[] = [];
            for await (const chunk of stream) {
                fullText += chunk.text;
                if(chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                    finalSources = chunk.candidates[0].groundingMetadata.groundingChunks;
                }
                setChatHistory(prev => prev.map((msg, index) => 
                    index === prev.length - 1 ? { ...msg, text: fullText, isThinking: false } : msg
                ));
            }
            if (finalSources.length > 0) {
                 setChatHistory(prev => prev.map((msg, index) => 
                    index === prev.length - 1 ? { ...msg, sources: finalSources } : msg
                ));
            }

        } catch (error) {
            console.error("Chat error:", error);
            setToast(t('toasts.aiError'));
             setChatHistory(prev => prev.map((msg, index) => 
                index === prev.length - 1 ? { ...msg, text: t('toasts.aiError'), isThinking: false } : msg
            ));
        } finally {
            setIsChatting(false);
        }
    };
    
    const handleGenerateImage = async () => {
        if (!ai) {
          setToast(t('toasts.aiNotAvailable'));
          return;
        }
        if (!imagePrompt.trim() || isGenerating) return;

        setIsGenerating(true);
        setGeneratedImages([]);
        setToast(t('toasts.aiGeneratingImage'));
        try {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: imagePrompt,
            });
            const images = response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
            setGeneratedImages(images);
        } catch (error) {
            console.error("Image generation error:", error);
            setToast(t('toasts.aiError'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleStartLive = async () => {
        if (!ai) {
          setToast(t('toasts.aiNotAvailable'));
          return;
        }
        if (isLive) return;

        setIsLive(true);
        setLiveTranscript({ user: '', model: '' });

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            // @ts-ignore
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            // @ts-ignore
            liveOutputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
            liveNextStartTimeRef.current = 0;

            sessionRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = audioContextRef.current!.createMediaStreamSource(stream);
                        sourceRef.current = source;
                        const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const i16 = new Int16Array(inputData.length);
                            for (let i = 0; i < inputData.length; i++) { i16[i] = inputData[i] * 32768; }
                            const blob: GenAIBlob = { data: encode(new Uint8Array(i16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                            sessionRef.current?.then(s => s.sendRealtimeInput({ media: blob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(audioContextRef.current!.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        if (msg.serverContent?.inputTranscription) {
                            setLiveTranscript(prev => ({...prev!, user: prev!.user + msg.serverContent!.inputTranscription!.text }));
                        }
                        if (msg.serverContent?.outputTranscription) {
                            setLiveTranscript(prev => ({...prev!, model: prev!.model + msg.serverContent!.outputTranscription!.text }));
                        }
                        if (msg.serverContent?.turnComplete) {
                            setLiveTranscript(prev => ({ user: '', model: ''}));
                        }
                        
                        const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (audioData && liveOutputAudioContextRef.current) {
                             const audioContext = liveOutputAudioContextRef.current;
                            liveNextStartTimeRef.current = Math.max(
                                liveNextStartTimeRef.current,
                                audioContext.currentTime,
                            );
                            const audioBuffer = await decodeAudioData(
                                decode(audioData),
                                audioContext,
                                24000,
                                1,
                            );
                            const sourceNode = audioContext.createBufferSource();
                            sourceNode.buffer = audioBuffer;
                            sourceNode.connect(audioContext.destination);
                            sourceNode.start(liveNextStartTimeRef.current);
                            liveNextStartTimeRef.current += audioBuffer.duration;
                        }
                    },
                    onerror: (e) => { console.error(e); setToast(t('toasts.aiError')); cleanupLive(); },
                    onclose: () => cleanupLive(),
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
            });
        } catch (e) {
            console.error(e);
            setToast(t('toasts.aiMicError'));
            cleanupLive();
        }
    };
    
    const ChatModeButton: React.FC<{ mode: ChatMode; icon: React.ReactNode; label: string }> = ({ mode, icon, label }) => (
      <button
        onClick={() => setChatMode(mode)}
        title={label}
        className={`p-2 rounded-md transition-colors ${chatMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
      >
        {icon}
      </button>
    );

    return (
        <aside className="w-full md:w-96 bg-gray-100 dark:bg-gray-800 md:border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
            <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <SparklesIcon className="text-yellow-500" />
                    <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t('sidekick.title')}</h2>
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon /></button>
            </header>

            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-around bg-gray-200 dark:bg-gray-900/50 rounded-md p-1">
                    <button onClick={() => setActiveTab('chat')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex-1 ${activeTab === 'chat' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>{t('sidekick.chat')}</button>
                    <button onClick={() => setActiveTab('image')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex-1 ${activeTab === 'image' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>{t('sidekick.image')}</button>
                    <button onClick={() => setActiveTab('live')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex-1 ${activeTab === 'live' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>{t('sidekick.live')}</button>
                </div>
            </div>

            {/* Chat Tab */}
            {activeTab === 'chat' && (
                <div className="flex-grow flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2">
                        <ChatModeButton mode="default" icon={<BotIcon />} label={t('sidekick.chatModes.default')} />
                        <ChatModeButton mode="search" icon={<SearchIcon />} label={t('sidekick.chatModes.search')} />
                        <ChatModeButton mode="maps" icon={<MapIcon />} label={t('sidekick.chatModes.maps')} />
                        <ChatModeButton mode="thinking" icon={<BrainCircuitIcon />} label={t('sidekick.chatModes.thinking')} />
                    </div>
                    <div ref={chatBodyRef} className="flex-grow p-4 overflow-y-auto space-y-4">
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs md:max-w-sm rounded-lg px-3 py-2 ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700'}`}>
                                    <p className="text-sm" dangerouslySetInnerHTML={{__html: msg.text.replace(/\n/g, '<br/>')}}></p>
                                    {msg.isThinking && <div className="mt-2 h-2 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>}
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-2 border-t pt-1">
                                            {msg.sources.map((s, si) => <a key={si} href={s.web?.uri || s.maps?.uri} target="_blank" className="text-xs text-blue-300 block truncate">{s.web?.title || s.maps?.title}</a>)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                            placeholder={t('sidekick.chatPlaceholder')}
                            className="flex-grow w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                            disabled={isChatting}
                        />
                        <button onClick={handleChatSubmit} disabled={isChatting || !chatInput.trim()} className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"><SendIcon /></button>
                    </div>
                </div>
            )}

            {/* Image Tab */}
            {activeTab === 'image' && (
                 <div className="flex-grow flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('sidekick.imageDescription')}</p>
                    </div>
                    <div className="flex-grow p-4 overflow-y-auto">
                        {isGenerating && <div className="text-center">{t('sidekick.imageGenerating')}</div>}
                        <div className="grid grid-cols-2 gap-2">
                            {generatedImages.map((src, i) => <img key={i} src={src} alt="Generated image" onClick={() => onInsertText(`<img src="${src}" />`)} className="rounded-md cursor-pointer hover:opacity-80 transition-opacity" />)}
                        </div>
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                        <input
                            type="text"
                            value={imagePrompt}
                            onChange={e => setImagePrompt(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleGenerateImage()}
                            placeholder={t('sidekick.imagePlaceholder')}
                            className="flex-grow w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                            disabled={isGenerating}
                        />
                        <button onClick={handleGenerateImage} disabled={isGenerating || !imagePrompt.trim()} className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"><ImageIcon /></button>
                    </div>
                </div>
            )}
            
            {/* Live Tab */}
            {activeTab === 'live' && (
                <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{t('sidekick.liveDescription')}</p>
                    <button onClick={isLive ? cleanupLive : handleStartLive} className={`flex items-center gap-3 px-6 py-3 rounded-full text-white font-semibold transition-colors ${isLive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                        {isLive ? <StopCircleIcon /> : <MicIcon />}
                        <span>{isLive ? t('sidekick.liveStop') : t('sidekick.liveStart')}</span>
                    </button>
                    {isLive && liveTranscript && (
                        <div className="mt-4 w-full text-left p-2 bg-white dark:bg-gray-700 rounded-md h-24 overflow-y-auto">
                           <p className="text-sm"><strong className="text-blue-500">You:</strong> {liveTranscript.user}</p>
                           <p className="text-sm"><strong className="text-green-500">AI:</strong> {liveTranscript.model}</p>
                        </div>
                    )}
                </div>
            )}
        </aside>
    );
};

export default AiSidekick;