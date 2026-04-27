import React, { useEffect, useState } from 'react';
import { useLiveAPI } from '../hooks/useLiveAPI';
import { Mic, MicOff, X, Rocket } from 'lucide-react';
import { motion } from 'motion/react';

interface VoiceAgentProps {
  systemInstruction: string;
  onEndDemo: () => void;
}

export function VoiceAgent({ systemInstruction, onEndDemo }: VoiceAgentProps) {
  const [showLockInButton, setShowLockInButton] = useState(false);
  
  const handleLockIn = () => {
     setShowLockInButton(true);
  };

  const { connect, disconnect, isConnected, volume } = useLiveAPI(systemInstruction, handleLockIn);

  // Auto-connect upon load
  useEffect(() => {
    // Attempt auto-connect as soon as component mounts
    // This works smoothly because mounting happens shortly after the "Launch Demo" button click.
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Visualizer scale and glow based on volume
  // Scale between 1 and 1.5, glow between 0 and 20px
  const scale = 1 + Math.min(volume * 5, 0.5);
  const glow = Math.min(volume * 100, 20);

  return (
    <>
      {showLockInButton && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            onClick={() => setShowLockInButton(false)}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white p-10 rounded-3xl shadow-[0_0_80px_rgba(59,130,246,0.3)] flex flex-col items-center gap-6 max-w-md w-full border border-zinc-200"
          >
            <div className="flex flex-col items-center mb-2">
              {/* Dynamic Media Logo Graphic */}
              <div className="flex gap-1.5 items-end justify-center h-12 mb-3">
                <div className="w-3.5 h-6 bg-[#f05a28] rounded-sm"></div>
                <div className="w-3.5 h-9 bg-[#fcee21] rounded-sm"></div>
                <div className="w-3.5 h-8 bg-[#29afe3] rounded-sm"></div>
                <div className="w-3.5 h-12 bg-[#8c2a9c] rounded-sm"></div>
              </div>
              <h1 className="text-[28px] font-black text-black tracking-tight leading-none mb-1">Dynamic Media</h1>
              <p className="text-base font-medium text-black">Fractional Ai Consultants</p>
            </div>

            <div className="text-center w-full border-t border-gray-100 pt-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3">AI Voice Agent Project Initiation</h2>
              <p className="text-5xl font-extrabold text-blue-600 bg-clip-text text-transparent bg-gradient-to-br from-blue-600 to-indigo-600 pb-1">$2,500</p>
            </div>
            
            {/* @ts-ignore */}
            <stripe-buy-button
              buy-button-id="buy_btn_0TQcMASGSLpZdRqBbJPnUaYc"
              publishable-key="pk_live_AyoNbnxb1C1Mr5p2abmyLoNA"
            >{/* @ts-ignore */}</stripe-buy-button>
            
            <button 
               onClick={() => setShowLockInButton(false)}
               className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-2"
            >
               <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}

      <div className="absolute bottom-8 right-8 z-50 flex items-center justify-center pointer-events-auto">
        <div className="relative group">
          {/* Glow effect */}
          {isConnected && (
              <motion.div 
                 className="absolute inset-0 bg-blue-500 rounded-full z-0 blur-xl mix-blend-screen"
                 animate={{ 
                   scale: isConnected ? scale : 1, 
                   opacity: volume > 0.01 ? 0.8 : 0.3 
                 }}
                 transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
          )}
          
          {/* Main Agent Button */}
          <button 
            onClick={() => isConnected ? disconnect() : connect()}
            className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-2xl border-2 ${
              isConnected 
                ? 'bg-zinc-900 border-blue-500 text-blue-400' 
                : 'bg-zinc-900 border-zinc-700 text-zinc-500'
            }`}
          >
            {isConnected ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
          </button>

          {/* Close Demo Button */}
          <button 
             onClick={onEndDemo}
             className="absolute -top-4 -right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow border border-red-700 transition z-20"
             title="End Demo"
          >
             <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Tooltip */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-900/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
           {isConnected ? 'Agent Active' : 'Agent Offline'}
        </div>
      </div>
    </>
  );
}
