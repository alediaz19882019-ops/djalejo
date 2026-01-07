
import React, { useRef, useEffect } from 'react';
import { audioEngine } from '../services/audioEngine';

const Visualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beatFlashA = useRef(0);
  const beatFlashB = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let anim: number;
    const render = () => {
      const analyserA = audioEngine.getAnalyser('A');
      const analyserB = audioEngine.getAnalyser('B');
      
      const dataA = new Uint8Array(analyserA?.frequencyBinCount || 0);
      const dataB = new Uint8Array(analyserB?.frequencyBinCount || 0);
      
      if (analyserA) analyserA.getByteFrequencyData(dataA);
      if (analyserB) analyserB.getByteFrequencyData(dataB);

      // Detect "Beat" Energy (Low frequencies 0-10)
      const lowFreqA = dataA.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      const lowFreqB = dataB.slice(0, 10).reduce((a, b) => a + b, 0) / 10;

      // Update flash intensity (decaying over time)
      if (lowFreqA > 180) beatFlashA.current = 1.0;
      else beatFlashA.current *= 0.92;

      if (lowFreqB > 180) beatFlashB.current = 1.0;
      else beatFlashB.current *= 0.92;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw "BEAT SYNC" Background Glow
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, `rgba(59, 130, 246, ${beatFlashA.current * 0.4})`);
      gradient.addColorStop(0.5, `rgba(0, 0, 0, ${0.1 + (beatFlashA.current + beatFlashB.current) * 0.1})`);
      gradient.addColorStop(1, `rgba(168, 85, 247, ${beatFlashB.current * 0.4})`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the "DJ Booth" Grid Lights
      const columns = 24;
      const rows = 6;
      const colWidth = canvas.width / columns;
      const rowHeight = canvas.height / rows;
      const time = Date.now() / 1000;

      for (let i = 0; i < columns; i++) {
        for (let j = 0; j < rows; j++) {
          // Calculate source data based on column (Left side A, Right side B)
          const isLeft = i < columns / 2;
          const currentData = isLeft ? dataA : dataB;
          const currentFlash = isLeft ? beatFlashA.current : beatFlashB.current;
          
          // Map grid coordinates to frequency spectrum
          const freqIdx = Math.floor((i % (columns / 2)) * (currentData.length / (columns / 2)));
          const intensity = (currentData[freqIdx] || 0) / 255;
          
          if (intensity > 0.05) {
            const hue = isLeft ? 210 : 280; // Blue for A, Purple for B
            const saturation = 80 + intensity * 20;
            const lightness = 40 + intensity * 50;
            const opacity = 0.1 + intensity * 0.6 + currentFlash * 0.3;

            ctx.save();
            ctx.shadowBlur = intensity * 15 + currentFlash * 25;
            ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;
            ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;

            const margin = 3;
            // Pulsing size based on beat
            const beatPulse = 1 + currentFlash * 0.3;
            const baseSize = Math.min(colWidth, rowHeight) - margin * 2;
            const size = baseSize * intensity * beatPulse;
            
            ctx.beginPath();
            ctx.roundRect(
              i * colWidth + (colWidth - size) / 2,
              j * rowHeight + (rowHeight - size) / 2,
              size,
              size,
              size / 4
            );
            ctx.fill();
            ctx.restore();
          }
        }
      }

      // Draw a center "Master Visual" bar
      const masterEnergy = (lowFreqA + lowFreqB) / 2;
      const barHeight = (masterEnergy / 255) * canvas.height;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + (beatFlashA.current + beatFlashB.current) * 0.2})`;
      ctx.fillRect(canvas.width / 2 - 2, (canvas.height - barHeight) / 2, 4, barHeight);

      anim = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(anim);
  }, []);

  return (
    <div className="w-full h-32 md:h-48 rounded-3xl overflow-hidden glass-panel border border-white/5 shadow-2xl relative group">
      <canvas ref={canvasRef} width={1200} height={200} className="w-full h-full" />
      
      {/* Overlay info */}
      <div className="absolute inset-0 flex items-center justify-between px-12 pointer-events-none">
        <div className={`text-[10px] font-orbitron font-bold tracking-[0.5em] transition-opacity duration-300 ${beatFlashA.current > 0.5 ? 'opacity-100 text-blue-400' : 'opacity-20 text-white'}`}>
          BEAT A
        </div>
        <div className="text-white/5 text-2xl md:text-4xl font-orbitron font-bold tracking-[1em] uppercase group-hover:text-white/10 transition-colors">
          MB SYNC
        </div>
        <div className={`text-[10px] font-orbitron font-bold tracking-[0.5em] transition-opacity duration-300 ${beatFlashB.current > 0.5 ? 'opacity-100 text-purple-400' : 'opacity-20 text-white'}`}>
          BEAT B
        </div>
      </div>

      {/* Rhythmic border glow */}
      <div 
        className="absolute inset-0 border-2 rounded-3xl pointer-events-none transition-colors duration-100"
        style={{
          borderColor: `rgba(29, 185, 84, ${(beatFlashA.current + beatFlashB.current) * 0.3})`,
          boxShadow: `inset 0 0 40px rgba(255, 255, 255, ${(beatFlashA.current + beatFlashB.current) * 0.1})`
        }}
      />
    </div>
  );
};

export default Visualizer;
