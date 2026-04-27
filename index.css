import { useRef, useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import axios from 'axios';

export function useLiveAPI(systemInstruction: string, onLockInTriggered?: () => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null); // holds session promise
  const streamRef = useRef<MediaStream | null>(null);
  const inputProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const outputProcessorRef = useRef<ScriptProcessorNode | null>(null);

  // Audio nodes for playing back the raw PCM data from Gemini
  const playQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);

  // For visualizer
  const [volume, setVolume] = useState(0);

  const connect = useCallback(async () => {
    if (isConnected || sessionRef.current) return;

    try {
      // First, get the API Key dynamically from the backend
      // This is crucial for Render deployments to ensure it gets the live runtime key
      const { data } = await axios.get('/api/credentials');
      const apiKey = data.apiKey || process.env.GEMINI_API_KEY; 
      
      if (!apiKey) {
         console.error("GEMINI_API_KEY is missing. Make sure it is set in the environment or secrets panel.");
         alert("API Key is missing. The Voice Agent cannot connect.");
         return;
      }

      // Proactively initialize AudioContext
      // This should happen as close to user interaction as possible
      if (!audioContextRef.current) {
        audioContextRef.current = (window as any).__AUDIO_CONTEXT || new AudioContext({ sampleRate: 16000 });
      }
      // Ensure the AudioContext is resumed if suspended by browser policy
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          tools: [{
            functionDeclarations: [
              {
                name: 'showLockInButton',
                description: 'Displays the Beta Lock-in Button on the screen to the prospect. Call this when the prospect agrees to the beta program or says "I am in".',
              }
            ]
          }],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
        },
        callbacks: {
          onopen: async () => {
            if (sessionRef.current !== sessionPromise) return; // Ignore if replaced or disconnected
            setIsConnected(true);
            await setupAudioCapture(sessionPromise);
            
            // Jumpstart the agent immediately instead of waiting for user audio
            sessionPromise.then((session: any) => {
               try {
                 session.sendRealtimeInput({
                   text: "Hello! The user has connected. Please begin the interaction according to your system instructions."
                 });
               } catch(e) {
                 console.error("Jumpstart exception:", e);
               }
            }).catch((err: any) => {
               console.error("Session promise failed during setup:", err);
            });
          },
          onmessage: (message: LiveServerMessage) => {
            if (sessionRef.current !== sessionPromise) return;

            // Handle Function Calls
            if (message.toolCall?.functionCalls) {
               const functionResponses = message.toolCall.functionCalls.map((call: any) => {
                 if (call.name === 'showLockInButton' && onLockInTriggered) {
                   onLockInTriggered();
                 }
                 return {
                   id: call.id,
                   name: call.name,
                   response: { result: "ok" }
                 };
               });
               
               sessionPromise.then((session: any) => {
                 session.sendToolResponse({ functionResponses });
               });
            }

            if (message.serverContent?.modelTurn?.parts) {
               message.serverContent.modelTurn.parts.forEach((part: any) => {
                  if (part.text) {
                     console.log("Agent:", part.text);
                  }
                  if (part.inlineData && part.inlineData.data) {
                     queueAudioPlayback(part.inlineData.data);
                  }
               });
            }
            if (message.serverContent?.interrupted) {
              playQueueRef.current = [];
            }
          },
          onclose: (event: any) => {
            console.log("GenAI Live API WebSocket onclose fired:", event);
            setIsConnected(false);
            cleanupAudio();
          },
          onerror: (error: any) => {
            console.error('GenAI Live API WebSocket onerror fired:', error);
            setIsConnected(false);
            cleanupAudio();
          }
        }
      });
      sessionRef.current = sessionPromise;
      
    } catch (e) {
      console.error("Failed to connect to Live API:", e);
      setIsConnected(false);
      sessionRef.current = null;
    }
  }, [systemInstruction]);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => {
        try {
          if (session && typeof session.close === 'function') {
            session.close();
          }
        } catch (e) {}
      }).catch((e:any) => console.error("Session disconnect error:", e));
      sessionRef.current = null;
    }
    cleanupAudio();
    setIsConnected(false);
  }, []);

  const setupAudioCapture = async (sessionPromise: any) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
    }
    const ctx = audioContextRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsMicrophoneActive(true);

      const source = ctx.createMediaStreamSource(stream);
      // Deprecated but simpler for raw PCM extraction without AudioWorklet. Better for quick demo.
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      inputProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate volume for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setVolume(rms);

        // Convert Float32 to Int16 PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to Base64 safely and quickly
        const buffer = new Uint8Array(pcm16.buffer);
        let binary = '';
        const chunk = 0x8000;
        for (let i = 0; i < buffer.length; i += chunk) {
          binary += String.fromCharCode.apply(null, Array.from(buffer.subarray(i, i + chunk)));
        }
        const base64Data = btoa(binary);

        if (sessionRef.current) {
          sessionRef.current.then((session: any) => {
             try {
               // Only send if the session is still active
               session.sendRealtimeInput({
                 audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
               });
             } catch(err) {
               console.error("Audio sending error:", err);
             }
          }).catch(() => {});
        }
      };

      source.connect(processor);
      processor.connect(ctx.destination);
    } catch (e) {
      console.error("Microphone access denied or error:", e);
    }
  };

  const queueAudioPlayback = (base64Audio: string) => {
    // Decode base64 to Float32Array PCM
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    playQueueRef.current.push(float32Array);
    if (!isPlayingRef.current) {
      playNextAudio();
    }
  };

  const playNextAudio = () => {
    if (!audioContextRef.current) return;
    
    if (playQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const audioData = playQueueRef.current.shift()!;
    
    const ctx = audioContextRef.current;
    
    // We receive 24kHz audio from Gemini Live
    // The AudioContext might be 16kHz for input, but browsers handle resampling
    // automatically when playing back a buffer with a specified sample rate.
    
    const buffer = ctx.createBuffer(1, audioData.length, 24000);
    buffer.getChannelData(0).set(audioData);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      playNextAudio();
    };
    source.start();
  };

  const cleanupAudio = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (inputProcessorRef.current) {
        inputProcessorRef.current.disconnect();
        inputProcessorRef.current = null;
    }
    setIsMicrophoneActive(false);
  };

  return { connect, disconnect, isConnected, volume };
}
