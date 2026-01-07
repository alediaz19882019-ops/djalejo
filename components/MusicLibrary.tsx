
import React, { useState, useRef } from 'react';
import { Search, Music, Loader2, Play, Pause, Plus, Trash2, FolderPlus, Folder, FolderOpen, Globe, ListMusic, ChevronRight, X } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface Track {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  url: string;
  source: 'spotify' | 'soundcloud' | 'apple' | 'tidal';
}

interface LibraryProps {
  onLoadToA: (track: {url: string, name: string}) => void;
  onLoadToB: (track: {url: string, name: string}) => void;
  onAddToPlaylist: (track: Track) => void;
  onAddToFolder: (track: Track, folderName: string) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (name: string) => void;
  folders: { [key: string]: Track[] };
  activeFolderName: string;
  setActiveFolderName: (name: string) => void;
  playlist: Track[];
  activeServices: {
    spotify: boolean;
    soundcloud: boolean;
    apple: boolean;
    tidal: boolean;
  };
}

const FALLBACK_TRACKS = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
];

const MusicLibrary: React.FC<LibraryProps> = ({ 
  onLoadToA, onLoadToB, onAddToPlaylist, onAddToFolder, onCreateFolder, onDeleteFolder,
  folders, activeFolderName, setActiveFolderName, playlist, activeServices 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Track[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Busca música para DJ: "${searchTerm}". Genera 12 temas JSON con id, name, artist, albumArt, url, source. URLs: ${FALLBACK_TRACKS.join(', ')}`,
        config: { 
          tools: [{ googleSearch: {} }], 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                artist: { type: Type.STRING },
                albumArt: { type: Type.STRING },
                url: { type: Type.STRING },
                source: { type: Type.STRING }
              },
              required: ["id", "name", "artist", "albumArt", "url", "source"]
            }
          }
        },
      });
      setResults(JSON.parse(response.text || '[]'));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const currentFolderTracks = folders[activeFolderName] || [];

  return (
    <div className="w-full bg-[#0a0a0c] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl flex flex-col lg:grid lg:grid-cols-12 h-[850px]">
      <audio ref={previewAudioRef} className="hidden" crossOrigin="anonymous" />
      
      {/* Sidebar: Navigation & Folders */}
      <div className="lg:col-span-3 bg-black/60 border-r border-white/5 p-8 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-orbitron font-bold text-sm text-slate-500 uppercase tracking-[0.2em]">Estructura</h3>
          <button onClick={() => setIsCreatingFolder(true)} className="p-2 bg-white/5 rounded-lg text-[#1DB954] hover:bg-[#1DB954]/10 transition-all">
            <FolderPlus size={18} />
          </button>
        </div>

        {isCreatingFolder && (
          <div className="mb-6 flex gap-2 animate-in slide-in-from-top-2">
            <input 
              autoFocus
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1DB954]"
              placeholder="Nombre carpeta..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { onCreateFolder(newFolderName); setNewFolderName(''); setIsCreatingFolder(false); }
                if (e.key === 'Escape') setIsCreatingFolder(false);
              }}
            />
            <button onClick={() => setIsCreatingFolder(false)} className="p-2 text-slate-500"><X size={16}/></button>
          </div>
        )}

        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Mis Carpetas</p>
          {Object.keys(folders).map(name => (
            <div 
              key={name}
              onClick={() => setActiveFolderName(name)}
              className={`flex items-center justify-between group p-3 rounded-xl cursor-pointer transition-all ${activeFolderName === name ? 'bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/20' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <div className="flex items-center gap-3 truncate">
                {activeFolderName === name ? <FolderOpen size={18} /> : <Folder size={18} />}
                <span className="text-xs font-bold truncate">{name}</span>
              </div>
              <span className="text-[10px] font-mono opacity-40 group-hover:opacity-100">{folders[name].length}</span>
            </div>
          ))}
          
          <div className="h-8"></div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Reproducción</p>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 text-white border border-white/5">
            <ListMusic size={18} className="text-[#1DB954]" />
            <span className="text-xs font-bold">Live Queue ({playlist.length})</span>
          </div>
        </div>
      </div>

      {/* Main Content: Search & Selected Folder */}
      <div className="lg:col-span-9 flex flex-col bg-gradient-to-b from-[#0f0f11] to-black">
        {/* Top Search Bar */}
        <div className="p-10 border-b border-white/5">
          <form onSubmit={handleSearch} className="relative group w-full max-w-3xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="text" 
              placeholder="Explora música para añadir a tus carpetas..."
              className="w-full bg-[#16161a] rounded-2xl py-4 pl-14 pr-6 text-sm text-white placeholder-slate-600 focus:outline-none focus:bg-[#1a1a20] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20"><Loader2 size={48} className="animate-spin mb-4"/><p className="uppercase tracking-[0.3em] text-xs">Buscando en la nube...</p></div>
          ) : results.length > 0 ? (
            <div className="space-y-8">
              <h2 className="text-xs font-orbitron font-bold text-slate-500 uppercase tracking-[0.3em]">Resultados de Búsqueda</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {results.map(track => (
                  <div key={track.id} className="bg-white/5 p-4 rounded-3xl border border-white/5 hover:border-white/10 group transition-all">
                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-4">
                      <img src={track.albumArt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all">
                        <button onClick={() => onAddToFolder(track, activeFolderName)} className="w-12 h-12 bg-[#1DB954] text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"><Plus size={24}/></button>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-white truncate">{track.name}</h4>
                    <p className="text-[10px] text-slate-500 uppercase truncate mb-4">{track.artist}</p>
                    <div className="text-[9px] font-bold text-slate-600 uppercase">Añadir a: <span className="text-[#1DB954]">{activeFolderName}</span></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h2 className="text-xl font-orbitron font-bold text-white uppercase tracking-wider">{activeFolderName}</h2>
                {activeFolderName !== "Mi Colección" && (
                  <button onClick={() => onDeleteFolder(activeFolderName)} className="text-red-500 hover:text-red-400 transition-colors"><Trash2 size={18}/></button>
                )}
              </div>
              
              {currentFolderTracks.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center opacity-10 text-center">
                  <Folder size={64} className="mb-4" />
                  <p className="text-xs uppercase tracking-widest">Esta carpeta está vacía</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {currentFolderTracks.map((track, idx) => (
                    <div key={`${track.id}-${idx}`} className="bg-white/5 p-4 rounded-3xl border border-white/5 hover:bg-white/10 transition-all flex items-center gap-4 group">
                      <img src={track.albumArt} className="w-16 h-16 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{track.name}</h4>
                        <p className="text-[10px] text-slate-500 uppercase truncate mb-2">{track.artist}</p>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onLoadToA({url: track.url, name: track.name})} className="text-[9px] font-bold text-blue-500 uppercase">A</button>
                          <button onClick={() => onLoadToB({url: track.url, name: track.name})} className="text-[9px] font-bold text-purple-500 uppercase">B</button>
                          <button onClick={() => onAddToPlaylist(track)} className="text-[9px] font-bold text-emerald-500 uppercase">Cola</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MusicLibrary;
