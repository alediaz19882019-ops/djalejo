
export class AudioEngine {
  private context: AudioContext | null = null;
  private decks: Map<string, {
    audio: HTMLAudioElement;
    source: MediaElementAudioSourceNode;
    gain: GainNode;
    low: BiquadFilterNode;
    mid: BiquadFilterNode;
    high: BiquadFilterNode;
    analyser: AnalyserNode;
  }> = new Map();

  private samplerGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private crossfaderValue: number = 0.5;

  async init() {
    if (this.context) {
      await this.context.resume();
      return;
    }
    
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 1.0;
    this.masterGain.connect(this.context.destination);
    
    this.samplerGain = this.context.createGain();
    this.samplerGain.gain.value = 0.8;
    this.samplerGain.connect(this.masterGain);

    console.log("AudioEngine: Initialized at", this.context.sampleRate, "Hz");
  }

  async resume() {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
      console.log("AudioEngine: Context resumed");
    }
  }

  setupDeck(id: string, audio: HTMLAudioElement) {
    if (!this.context || !this.masterGain) return;
    
    try {
      // Evitar crear múltiples fuentes para el mismo elemento si se re-monta
      const source = this.context.createMediaElementSource(audio);
      const gain = this.context.createGain();
      const low = this.context.createBiquadFilter();
      const mid = this.context.createBiquadFilter();
      const high = this.context.createBiquadFilter();
      const analyser = this.context.createAnalyser();

      analyser.fftSize = 256;
      
      low.type = 'lowshelf';
      low.frequency.value = 320;
      
      mid.type = 'peaking';
      mid.frequency.value = 1000;
      mid.Q.value = 1.0;

      high.type = 'highshelf';
      high.frequency.value = 3200;

      source.connect(low);
      low.connect(mid);
      mid.connect(high);
      high.connect(gain);
      gain.connect(analyser);
      analyser.connect(this.masterGain);

      this.decks.set(id, { audio, source, gain, low, mid, high, analyser });
      this.updateVolumes();
      console.log(`AudioEngine: Deck ${id} setup complete`);
    } catch (e) {
      console.warn(`AudioEngine: Deck ${id} already has a source node or setup failed`, e);
    }
  }

  setCrossfader(value: number) {
    this.crossfaderValue = value;
    this.updateVolumes();
  }

  private updateVolumes() {
    if (!this.context) return;
    const deckA = this.decks.get('A');
    const deckB = this.decks.get('B');

    // Crossfade con ley de potencia constante
    if (deckA) {
      const gainA = Math.cos(this.crossfaderValue * 0.5 * Math.PI);
      deckA.gain.gain.setTargetAtTime(gainA, this.context.currentTime, 0.02);
    }
    if (deckB) {
      const gainB = Math.sin(this.crossfaderValue * 0.5 * Math.PI);
      deckB.gain.gain.setTargetAtTime(gainB, this.context.currentTime, 0.02);
    }
  }

  setEQ(id: string, band: 'low' | 'mid' | 'high', value: number) {
    const deck = this.decks.get(id);
    if (!deck) return;
    const gain = value * 20;
    if (band === 'low') deck.low.gain.value = gain;
    if (band === 'mid') deck.mid.gain.value = gain;
    if (band === 'high') deck.high.gain.value = gain;
  }

  getAnalyser(id: string) {
    return this.decks.get(id)?.analyser;
  }

  getDeckStatus(id: string) {
    const deck = this.decks.get(id);
    if (!deck) return { isPlaying: false, currentTime: 0, duration: 0 };
    return {
      isPlaying: !deck.audio.paused,
      currentTime: deck.audio.currentTime,
      duration: deck.audio.duration || 0
    };
  }

  playDeck(id: string) {
    this.resume();
    this.decks.get(id)?.audio.play().catch(e => console.error("Playback error", e));
  }

  async playSound(url: string) {
    if (!this.context || !this.samplerGain) return;
    await this.resume();
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      const source = this.context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.samplerGain);
      source.start(0);
    } catch (e) {
      console.error("Sampler error:", e);
    }
  }

  setPitch(id: string, rate: number) {
    const deck = this.decks.get(id);
    if (deck) deck.audio.playbackRate = rate;
  }
}

// Fixed: Export singleton instance
export const audioEngine = new AudioEngine();
