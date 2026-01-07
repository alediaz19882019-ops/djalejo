
import React from 'react';
import { Volume1, Zap } from 'lucide-react';
// Fixed: Import from services instead of App
import { audioEngine } from '../services/audioEngine';

const SOUNDS = [
  { name: 'AIRHORN', url: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg' },
  { name: 'GLITCH', url: 'https://actions.google.com/sounds/v1/science_fiction/glitch_low_short.ogg' },
  { name: 'SNARE', url: 'https://actions.google.com/sounds/v1/percussion/shaker_rhythm.ogg' },
  { name: 'LASER', url: 'https://actions.google.com/sounds/v1/science_fiction/retro_game_laser.ogg' },
  { name: 'DRUM ROLL', url: 'https://actions.google.com/sounds/v1/percussion/drum_roll.ogg' },
  { name: 'VOCAL POP', url: 'https://actions.google.com/sounds/v1/cartoon/human_vocal_pop.ogg' },
  { name: 'SCRATCH', url: 'https://actions.google.com/sounds/v1/impacts/foley_wood_impact_crack.ogg' },
  { name: 'SWEEP', url: 'https://actions.google.com/sounds/v1/science_fiction/robot_vacuum_hum.ogg' },
  { name: 'DROP', url: 'https://actions.google.com/sounds/v1/science_fiction/energy_pulse.ogg' },
];

const Sampler: React.FC = () => {
  return (
    <div className="p-6 rounded-3xl glass-panel border border-white/5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Volume1 size={18} className="text-slate-500" />
          <h3 className="font-orbitron text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">DJ Sampler</h3>
        </div>
        <Zap size={14} className="text-yellow-500/40 animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {SOUNDS.map(sound => (
          <button
            key={sound.name}
            onClick={() => audioEngine.playSound(sound.url)}
            className="h-16 bg-white/5 border border-white/5 rounded-xl text-[9px] font-bold tracking-widest text-slate-400 hover:bg-[#1DB954]/20 hover:text-[#1DB954] hover:border-[#1DB954]/30 transition-all active:scale-95 uppercase px-1 text-center flex flex-col items-center justify-center gap-1 group"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-[#1DB954] transition-colors"></div>
            {sound.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sampler;
