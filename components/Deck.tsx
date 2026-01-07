
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music, Disc, Upload, Cloud, AlertTriangle, Radio, Wifi, Database } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface DeckProps {
  id: 'A' | 'B';
  accentColor: 'blue' | 'purple';
  externalTrack?: { url: string, name: string } | null;
}

const Deck: React.FC<DeckProps> = ({ id, accentColor, externalTrack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [pitch, setPitch] = useState(1.0);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (audioRef.current) audioEngine.setupDeck(id, audioRef.current);
    // Simular ping de red dinámico
    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 40) + 12);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (externalTrack && audioRef.current) {
      setError(null);
      audioRef.current.src = externalTrack.url;
      audioRef.current.load();
      setFileName(externalTrack.name);
      setCurrentTime(0);
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
          setError("Stream bloqueado por CORS");
        });
      }
    }
  }, [externalTrack]);

  useEffect(() => {
    let anim: number;
    const tick = () => {
      if (isPlaying) {
        setRotation(r => (r + 4 * pitch) % 360);
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          setDuration(audioRef.current.duration);
        }
      }
      anim = requestAnimationFrame(tick);
    };
    anim = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(anim);
  }, [isPlaying, pitch]);

  const togglePlay = async () => {
    if (!audioRef.current || !fileName) return;
    await audioEngine.resume();
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        setError("Error en stream");
      }
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && audioRef.current) {
      const url = URL.createObjectURL(file);
      audioRef.current.src = url;
      audioRef.current.load();
      setFileName(file.name);
      setIsPlaying(false);
      setCurrentTime(0);
      setError(null);
    }
  };

  const progress = (currentTime / (duration || 1)) * 100;
  const accent = accentColor === 'blue' ? '#3b82f6' : '#a855f7';

  return (
    <div className={`p-10 rounded-[50px] bg-black/40 border border-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group`}>
      <div className={`absolute -top-32 -left-32 w-80 h-80 blur-[100px] opacity-10 rounded-full transition-all duration-1000 group-hover:opacity-20`}
           style={{ backgroundColor: accent }}></div>

      <div className="flex justify-between items-start mb-10 relative z-10">
        <div>
          <div className="flex items-center gap-4">
             <div className={`w-4 h-4 rounded-full animate-pulse`} style={{ backgroundColor: accent }}></div>
             <h2 className="font-orbitron font-bold text-3xl tracking-tighter uppercase text-white">DECK {id}</h2>
          </div>
          <p className="text-[11px] font-bold text-slate-500 mt-3 tracking-[0.4em] uppercase truncate max-w-[250px]">
            {fileName || 'Esperando señal...'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase">
            <Wifi size={12} className={isPlaying ? 'text-emerald-500' : ''} /> {latency}ms
          </div>
          <span className="text-2xl font-mono text-white tracking-widest tabular-nums">
            {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-12 py-8 relative z-10">
        <div className="relative flex-shrink-0">
          <svg className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)] -rotate-90">
            <circle cx="50%" cy="50%" r="48%" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="6" />
            <circle cx="50%" cy="50%" r="48%" fill="none" stroke={accent} strokeWidth="6" strokeDasharray="100 100" strokeDashoffset={100 - progress} style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
          </svg>

          <div 
            className="w-64 h-64 rounded-full bg-gradient-to-b from-[#111] to-black border-[15px] border-[#1a1a1a] shadow-2xl relative flex items-center justify-center cursor-pointer group/disc"
            style={{ transform: `rotate(${rotation}deg)` }}
            onClick={togglePlay}
          >
            <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]"></div>
            <div className="w-20 h-20 rounded-full border-4 border-white/5 flex items-center justify-center bg-black/40">
               <Database size={24} className="text-white/20" />
            </div>
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-2 h-10 bg-white/40 rounded-full"></div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              <span>Cloud Pitch</span>
              <span className="text-white">{(128 * pitch).toFixed(1)} BPM</span>
            </div>
            <div className="relative h-44 bg-black/60 rounded-3xl flex items-center justify-center overflow-hidden border border-white/5">
              <input 
                type="range" 
                min="0.8" 
                max="1.2" 
                step="0.001" 
                value={pitch} 
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setPitch(v);
                  audioEngine.setPitch(id, v);
                }}
                className="w-36 h-2 -rotate-90 origin-center accent-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6 relative z-10">
        <button 
          onClick={togglePlay}
          className={`flex items-center justify-center gap-4 py-6 rounded-3xl transition-all font-orbitron font-bold text-[13px] uppercase tracking-widest ${
            isPlaying ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-white text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]'
          }`}
        >
          {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
          {isPlaying ? 'PAUSA' : 'PLAY'}
        </button>
        <label className="flex items-center justify-center gap-4 py-6 rounded-3xl bg-white/5 text-slate-400 hover:text-white border border-white/5 cursor-pointer transition-all hover:bg-white/10">
          <Cloud size={20} />
          <span className="font-orbitron font-bold text-[13px] uppercase tracking-widest">SUBIR</span>
          <input type="file" accept="audio/*" className="hidden" onChange={handleFile} />
        </label>
      </div>

      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)} 
        className="hidden" 
        crossOrigin="anonymous"
        onError={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default Deck;
