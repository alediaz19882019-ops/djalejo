
import React from 'react';
import { Sliders, Volume2, Maximize, Activity } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface MixerProps {
  crossfader: number;
  onCrossfaderChange: (val: number) => void;
}

const Mixer: React.FC<MixerProps> = ({ crossfader, onCrossfaderChange }) => {
  const handleEQ = (deckId: string, band: 'low' | 'mid' | 'high', val: string) => {
    audioEngine.setEQ(deckId, band, parseFloat(val));
  };

  return (
    <div className="p-10 rounded-[40px] bg-black/40 border border-white/5 backdrop-blur-3xl shadow-2xl flex flex-col items-center gap-10">
      <div className="w-full flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <Activity size={20} className="text-slate-500" />
          <h3 className="font-orbitron text-[11px] font-bold tracking-[0.4em] text-slate-500 uppercase">Master Engine</h3>
        </div>
        <div className="flex gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
           <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-16 w-full">
        {['A', 'B'].map(id => (
          <div key={id} className="flex flex-col items-center gap-8 group">
            <span className={`text-[11px] font-orbitron font-bold uppercase tracking-widest ${id === 'A' ? 'text-blue-500' : 'text-purple-500'}`}>
              Channel {id}
            </span>
            <div className="flex gap-6">
              {['high', 'mid', 'low'].map(band => (
                <div key={band} className="flex flex-col items-center gap-4">
                  <div className="h-40 w-10 bg-black/60 rounded-full flex items-center justify-center p-1 border border-white/5 relative shadow-inner">
                    <input 
                      type="range" 
                      min="-1" 
                      max="1" 
                      step="0.01" 
                      defaultValue="0"
                      onChange={(e) => handleEQ(id, band as any, e.target.value)}
                      className="w-32 h-1 -rotate-90 origin-center accent-white opacity-40 hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/20"></div>
                  </div>
                  <span className="text-[9px] font-bold uppercase text-slate-600 tracking-tighter">{band}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full mt-6 space-y-6">
        <div className="flex justify-between items-center px-4">
          <span className="text-[10px] font-orbitron font-bold text-blue-500/60 uppercase">Deck A</span>
          <div className="flex items-center gap-2">
            <Sliders size={12} className="text-slate-700" />
            <span className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.3em]">Crossfade Matrix</span>
          </div>
          <span className="text-[10px] font-orbitron font-bold text-purple-500/60 uppercase">Deck B</span>
        </div>
        
        <div className="relative h-20 bg-black/80 rounded-[25px] flex items-center px-8 border border-white/5 shadow-2xl overflow-hidden">
          {/* Active indicator bar */}
          <div className="absolute inset-x-0 h-[2px] top-0 bg-gradient-to-r from-blue-500/20 via-transparent to-purple-500/20"></div>
          
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.001" 
            value={crossfader}
            onChange={(e) => onCrossfaderChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-white"
          />
          
          <div className="absolute left-1/2 -translate-x-1/2 h-8 w-[1px] bg-white/10"></div>
        </div>
      </div>
    </div>
  );
};

export default Mixer;
