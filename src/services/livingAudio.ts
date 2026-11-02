// Living Audio & Vocal Synthesis Service for SHEFA AYIN
// Uses Web Audio API for 100% procedural sound effects (zero 404 external assets)
// and Web Speech API for voice recognition and natural speech synthesis.

class LivingAudioService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private speechVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('shefa_audio_muted');
      this.isMuted = storedMute === 'true';
      this.initVoice();
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private initVoice() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const findVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Look for Brazilian Portuguese voice
      const ptVoice = voices.find(v => v.lang === 'pt-BR' || v.lang.startsWith('pt')) || voices[0];
      this.speechVoice = ptVoice || null;
    };

    findVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = findVoice;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('shefa_audio_muted', this.isMuted.toString());
    if (this.isMuted && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    return this.isMuted;
  }

  public getMutedState(): boolean {
    return this.isMuted;
  }

  // Play procedural harmonic tones
  public playTone(type: 'boot' | 'command_sent' | 'state_change' | 'alert' | 'emergency' | 'complete' | 'click') {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.connect(ctx.destination);

      if (type === 'click') {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'command_sent') {
        // High-tech ascending energetic chime
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.05);
          noteGain.gain.setValueAtTime(0.06, now + i * 0.05);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + 0.25);
          osc.connect(noteGain);
          noteGain.connect(ctx.destination);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.25);
        });
      } else if (type === 'boot') {
        // Warm harmonic sovereign chord
        [220, 329.63, 440, 554.37, 659.25].forEach((freq) => {
          const osc = ctx.createOscillator();
          const chordGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq * 0.8, now);
          osc.frequency.exponentialRampToValueAtTime(freq, now + 0.4);
          chordGain.gain.setValueAtTime(0.001, now);
          chordGain.gain.linearRampToValueAtTime(0.05, now + 0.15);
          chordGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
          osc.connect(chordGain);
          chordGain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.8);
        });
      } else if (type === 'alert') {
        // Dual pulse warning tone
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.12);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'emergency') {
        // Heavy low frequency damp buzz
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.35);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'complete') {
        // Bright crystalline sparkle
        [880, 1174.66, 1318.51].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const sparkleGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          sparkleGain.gain.setValueAtTime(0.05, now + idx * 0.08);
          sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);
          osc.connect(sparkleGain);
          sparkleGain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.4);
        });
      } else if (type === 'state_change') {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.12);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch {
      // AudioContext policy catch
    }
  }

  // Voice synthesis: speak with calm, sophisticated tone
  public speak(text: string) {
    if (this.isMuted || typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();
      // Clean markdown or technical tags for smooth articulation
      const cleanText = text
        .replace(/[*_#`~>]/g, '')
        .replace(/https?:\/\/\S+/g, 'link')
        .replace(/\n+/g, ' ')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      utterance.lang = 'pt-BR';

      if (this.speechVoice) {
        utterance.voice = this.speechVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const livingAudio = new LivingAudioService();
