
import React, { useState, useEffect, useRef } from 'react';
import { Zap, Share2, Library, Loader2, Lock, Disc3, Globe } from 'lucide-react';
import Deck from './components/Deck';
import Mixer from './components/Mixer';
import RhythmGraph from './components/RhythmGraph';
import Sampler from './components/Sampler';
import MusicLibrary from './components/MusicLibrary';
import { audioEngine } from './services/audioEngine';

interface Track {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  url: string;
  source: 'spotify' | 'soundcloud' | 'apple' | 'tidal';
}

interface Folders {
  [key: string]: Track[];
}

const App: React.FC = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [autoMix, setAutoMix] = useState(false);
  const [crossfader, setCrossfader] = useState(0.5);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  
  // Folders and Playlist State
  const [folders, setFolders] = useState<Folders>({
    "Mi Colección": []
  });
  const [activeFolderName, setActiveFolderName] = useState<string>("Mi Colección");
  const [playlist, setPlaylist] = useState<Track[]>([]);
  
  const [connectedServices, setConnectedServices] = useState({
    spotify: false,
    soundcloud: false,
    apple: false,
    tidal: false
  });
  const [showServiceMenu, setShowServiceMenu] = useState(false);
  
  const [deckATrack, setDeckATrack] = useState<{url: string, name: string} | null>(null);
  const [deckBTrack, setDeckBTrack] = useState<{url: string, name: string} | null>(null);
  const isTransitioningRef = useRef<'TO_A' | 'TO_B' | false>(false);
  const playlistIndexRef = useRef(0);

  const handleStart = async () => {
    await audioEngine.init();
    setIsStarted(true);
  };

  const connectService = (service: keyof typeof connectedServices) => {
    if (connectedServices[service]) {
      setConnectedServices(prev => ({ ...prev, [service]: false }));
      return;
    }
    setIsConnecting(service);
    setTimeout(() => {
      setConnectedServices(prev => ({ ...prev, [service]: true }));
      setIsConnecting(null);
    }, 1500);
  };

  useEffect(() => {
    if (!isStarted || !autoMix) return;
    
    const interval = setInterval(() => {
      const statusA = audioEngine.getDeckStatus('A');
      const statusB = audioEngine.getDeckStatus('B');
      
      if (statusA.isPlaying && statusA.duration > 0 && statusA.currentTime > statusA.duration - 10 && !isTransitioningRef.current) {
        startTransition('B');
      }
      
      if (statusB.isPlaying && statusB.duration > 0 && statusB.currentTime > statusB.duration - 10 && !isTransitioningRef.current) {
        startTransition('A');
      }

      if (isTransitioningRef.current) {
        const target = isTransitioningRef.current === 'TO_B' ? 1 : 0;
        setCrossfader(prev => {
          const step = 0.005;
          if (Math.abs(prev - target) < step) {
            isTransitioningRef.current = false;
            loadNextInQueue(target === 1 ? 'A' : 'B');
            return target;
          }
          return prev + (target > prev ? step : -step);
        });
      }
    }, 200);
    
    return () => clearInterval(interval);
  }, [isStarted, autoMix, playlist]);

  const startTransition = (toDeck: 'A' | 'B') => {
    if (toDeck === 'B') {
      if (playlist.length > 0 || deckBTrack) {
        audioEngine.playDeck('B');
        isTransitioningRef.current = 'TO_B';
      }
    } else {
      if (playlist.length > 0 || deckATrack) {
        audioEngine.playDeck('A');
        isTransitioningRef.current = 'TO_A';
      }
    }
  };

  const loadNextInQueue = (deckId: 'A' | 'B') => {
    if (playlist.length === 0) return;
    const nextTrack = playlist[playlistIndexRef.current % playlist.length];
    if (deckId === 'A') setDeckATrack({ url: nextTrack.url, name: nextTrack.name });
    else setDeckBTrack({ url: nextTrack.url, name: nextTrack.name });
    playlistIndexRef.current = (playlistIndexRef.current + 1) % playlist.length;
  };

  const handleManualLoad = (deckId: 'A' | 'B', track: {url: string, name: string}) => {
    if (deckId === 'A') {
      setDeckATrack(track);
      setCrossfader(0);
    } else {
      setDeckBTrack(track);
      setCrossfader(1);
    }
  };

  useEffect(() => {
    if (isStarted) audioEngine.setCrossfader(crossfader);
  }, [crossfader, isStarted]);

  const addToFolder = (track: Track, folderName: string) => {
    setFolders(prev => ({
      ...prev,
      [folderName]: [...(prev[folderName] || []), track]
    }));
  };

  const createFolder = (name: string) => {
    if (!name || folders[name]) return;
    setFolders(prev => ({ ...prev, [name]: [] }));
    setActiveFolderName(name);
  };

  const deleteFolder = (name: string) => {
    if (name === "Mi Colección") return;
    const newFolders = { ...folders };
    delete newFolders[name];
    setFolders(newFolders);
    setActiveFolderName("Mi Colección");
  };

  const addToPlaylist = (track: Track) => {
    setPlaylist(prev => [...prev, track]);
  };

  if (!isStarted) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#020204] p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="z-10 flex flex-col items-center text-center">
          <div className="relative mb-12">
            <div className="w-32 h-32 bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 flex items-center justify-center shadow-2xl rotate-12 hover:rotate-0 transition-all duration-700">
               <Zap size={64} className="text-[#1DB954]" />
            </div>
          </div>
          <h1 className="text-7xl font-orbitron font-bold mb-6 tracking-tighter text-white uppercase">Alejo DJ Studio</h1>
          <p className="text-slate-400 max-w-lg mb-12 text-lg">Organiza tu música en carpetas y crea el set perfecto.</p>
          <button onClick={handleStart} className="px-16 py-6 bg-white text-black rounded-full font-bold uppercase tracking-widest hover:scale-110 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]">Abrir Cabina</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050507] text-slate-200">
      {isConnecting && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center">
          <div className="text-center p-12 bg-white/5 rounded-[40px] border border-white/10 max-w-md w-full">
            <Loader2 size={48} className="text-white animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-orbitron font-bold mb-4 uppercase tracking-widest">Sincronizando {isConnecting}</h2>
          </div>
        </div>
      )}

      <header className="h-24 border-b border-white/5 bg-black/40 backdrop-blur-2xl flex items-center justify-between px-12 sticky top-0 z-[100]">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-[#1DB954] rounded-2xl flex items-center justify-center">
            <Zap className="text-black" size={28} />
          </div>
          <div className="flex flex-col">
            <h1 className="font-orbitron font-bold text-3xl tracking-tighter leading-none">ALEJO<span className="text-[#1DB954]">DJ</span></h1>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setAutoMix(!autoMix)}
            className={`flex items-center gap-4 px-6 py-3 rounded-2xl border transition-all ${autoMix ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-white/5 bg-white/5 text-slate-500'}`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${autoMix ? 'bg-emerald-500 animate-pulse' : 'bg-slate-800'}`}></div>
            <span className="text-[11px] font-bold uppercase tracking-widest">AutoMix {autoMix ? 'ON' : 'OFF'}</span>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowServiceMenu(!showServiceMenu)}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
            >
              <Share2 size={20} />
            </button>
            {showServiceMenu && (
              <div className="absolute top-full right-0 mt-4 w-64 bg-[#0a0a0c] border border-white/10 rounded-3xl shadow-2xl p-6 z-50">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Servicios</p>
                <div className="space-y-2">
                  {['spotify', 'soundcloud', 'apple', 'tidal'].map(service => (
                    <div key={service} onClick={() => connectService(service as any)} className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-white/5">
                      <span className="text-xs font-bold uppercase">{service}</span>
                      <div className={`w-2 h-2 rounded-full ${connectedServices[service as keyof typeof connectedServices] ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto p-10">
        <div className="flex flex-col gap-4">
          <RhythmGraph />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-8">
            <div className="lg:col-span-4"><Deck id="A" accentColor="blue" externalTrack={deckATrack} /></div>
            <div className="lg:col-span-4 flex flex-col gap-10"><Mixer crossfader={crossfader} onCrossfaderChange={setCrossfader} /><Sampler /></div>
            <div className="lg:col-span-4"><Deck id="B" accentColor="purple" externalTrack={deckBTrack} /></div>
          </div>

          <MusicLibrary 
            onLoadToA={(track) => handleManualLoad('A', track)}
            onLoadToB={(track) => handleManualLoad('B', track)}
            onAddToPlaylist={addToPlaylist}
            onAddToFolder={addToFolder}
            onCreateFolder={createFolder}
            onDeleteFolder={deleteFolder}
            folders={folders}
            activeFolderName={activeFolderName}
            setActiveFolderName={setActiveFolderName}
            playlist={playlist}
            activeServices={connectedServices}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
