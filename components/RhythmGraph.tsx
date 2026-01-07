
import React, { useRef, useEffect } from 'react';
import { audioEngine } from '../services/audioEngine';

const RhythmGraph: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollPos = useRef(0);
  const dataHistoryA = useRef<number[]>(new Array(200).fill(0));
  const dataHistoryB = useRef<number[]>(new Array(200).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let anim: number;
    const render = () => {
      const analyserA = audioEngine.getAnalyser('A');
      const analyserB = audioEngine.getAnalyser('B');
      
      const bufferLength = analyserA?.frequencyBinCount || 128;
      const dataA = new Uint8Array(bufferLength);
      const dataB = new Uint8Array(bufferLength);
      
      if (analyserA) analyserA.getByteFrequencyData(dataA);
      if (analyserB) analyserB.getByteFrequencyData(dataB);

      // Calcular energía de bajos (ritmo) para el historial
      const bassA = dataA.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
      const bassB = dataB.slice(0, 5).reduce((a, b) => a + b, 0) / 5;

      dataHistoryA.current.shift();
      dataHistoryA.current.push(bassA);
      dataHistoryB.current.shift();
      dataHistoryB.current.push(bassB);

      // Limpiar y dibujar fondo técnico
      ctx.fillStyle = '#050507';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Dibujar Rejilla
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for(let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for(let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      const drawWave = (history: number[], color: string, yOffset: number, height: number, glow: string) => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = glow;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();

        const sliceWidth = canvas.width / history.length;
        let x = 0;

        for (let i = 0; i < history.length; i++) {
          const v = (history[i] / 255.0) * height;
          const y = yOffset + (height / 2) - v / 2;
          
          if (i === 0) ctx.moveTo(x, y + v);
          else ctx.lineTo(x, y + v);
          
          ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      // Dibujar Ondas
      drawWave(dataHistoryA.current, '#3b82f6', 10, 80, 'rgba(59, 130, 246, 0.5)');
      drawWave(dataHistoryB.current, '#a855f7', 100, 80, 'rgba(168, 85, 247, 0.5)');

      // Línea de Sincronización Central (Beat matching point)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Etiquetas
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = 'bold 10px Orbitron';
      ctx.fillText('RHYTHM DECK A', 10, 20);
      ctx.fillText('RHYTHM DECK B', 10, 110);

      anim = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(anim);
  }, []);

  return (
    <div className="w-full h-48 rounded-[30px] bg-black/60 border border-white/5 overflow-hidden shadow-2xl relative mb-8">
      <canvas ref={canvasRef} width={1200} height={190} className="w-full h-full" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-white/10 px-4 py-1 rounded-b-lg border border-t-0 border-white/10">
        <span className="text-[9px] font-orbitron font-bold text-white tracking-[0.3em] uppercase">Beat Alignment Analyzer</span>
      </div>
    </div>
  );
};

export default RhythmGraph;
