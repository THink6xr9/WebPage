class AudioEngine {
  private ctx: AudioContext | null = null;

  // Master Control
  private masterGain: GainNode | null = null;
  private volume: number = 0.8;
  private isMuted: boolean = false;

  // 1. Ambient Drone Nodes
  private droneGain: GainNode | null = null;
  private droneOscs: OscillatorNode[] = [];
  private droneFilter: BiquadFilterNode | null = null;
  private droneLFO: OscillatorNode | null = null;

  // 2. Bird Chirps Nodes
  private birdGain: GainNode | null = null;
  private birdInterval: any = null;

  // 3. Synth Piano Nodes
  private pianoGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private pianoInterval: any = null;
  private currentChordIndex: number = 0;
  private pianoChords = [
    [130.81, 164.81, 196.0, 246.94, 293.66], // Cmaj9 (C3, E3, G3, B3, D4)
    [110.0, 130.81, 164.81, 196.0, 246.94],  // Am9 (A2, C3, E3, G3, B3)
    [87.31, 130.81, 174.61, 220.0, 261.63],  // Fmaj9 (F2, C3, F3, A3, C4)
    [98.0, 146.83, 196.0, 246.94, 293.66],   // G6/9 (G2, D3, G3, B3, D4)
  ];

  // 4. String Pads Nodes
  private padGain: GainNode | null = null;
  private padOscs: OscillatorNode[] = [];
  private padFilter: BiquadFilterNode | null = null;

  // 5. MP3 Vocal Track Nodes
  private audioNode: HTMLAudioElement | null = null;
  private songSource: MediaElementAudioSourceNode | null = null;
  private songGain: GainNode | null = null;
  private songStarted: boolean = false;

  // Timers and State flags
  private isMoving: boolean = true;
  private stillnessLevel: number = 0; // 0: movement, 1: 2s (birds), 2: 5s (piano), 3: 10s (pads), 4: 20s (song), 5: ending (30s)
  private isInitialized: boolean = false;

  constructor() {}

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Create Synths
      this.setupDrone();
      this.setupPianoSynth();
      this.setupPadSynth();
      this.setupBirdSynth();
      this.setupSongPlayer();

      this.isInitialized = true;
      this.ctx.resume();

      // Start initial background drone at full, others at 0
      this.droneGain!.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.birdGain!.gain.setValueAtTime(0, this.ctx.currentTime);
      this.pianoGain!.gain.setValueAtTime(0, this.ctx.currentTime);
      this.padGain!.gain.setValueAtTime(0, this.ctx.currentTime);
      this.songGain!.gain.setValueAtTime(0, this.ctx.currentTime);
      
    } catch (e) {
      console.error("Web Audio API failed to initialize", e);
    }
  }

  // --- 1. PROCEDURAL DRONE SYNTH ---
  private setupDrone() {
    if (!this.ctx || !this.masterGain) return;

    this.droneGain = this.ctx.createGain();
    this.droneGain.connect(this.masterGain);

    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = "lowpass";
    this.droneFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);
    this.droneFilter.frequency.setValueAtTime(110, this.ctx.currentTime);
    this.droneFilter.connect(this.droneGain);

    // Three base oscillators for deep rich drone
    const droneFreqs = [55.0, 110.0, 164.81]; // C1, C2, E2
    droneFreqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = idx === 0 ? "sine" : "triangle"; // sine base, triangle upper harmonics
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
      
      const oscGain = this.ctx!.createGain();
      oscGain.gain.setValueAtTime(idx === 0 ? 0.4 : 0.15, this.ctx!.currentTime);
      
      // Detune slightly for chorus/thickening
      osc.detune.setValueAtTime(idx === 1 ? -4 : idx === 2 ? 4 : 0, this.ctx!.currentTime);
      
      osc.connect(oscGain);
      oscGain.connect(this.droneFilter!);
      osc.start();
      this.droneOscs.push(osc);
    });

    // Slow LFO to sweep filter cutoff for breathing effect
    this.droneLFO = this.ctx.createOscillator();
    this.droneLFO.frequency.setValueAtTime(0.08, this.ctx.currentTime); // 12.5s period
    
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(30, this.ctx.currentTime); // sweep filter frequency by +/- 30Hz

    this.droneLFO.connect(lfoGain);
    lfoGain.connect(this.droneFilter.frequency);
    this.droneLFO.start();
  }

  // --- 2. BIRD SYNTH ---
  private setupBirdSynth() {
    if (!this.ctx || !this.masterGain) return;
    this.birdGain = this.ctx.createGain();
    this.birdGain.connect(this.masterGain);
  }

  private triggerBirdChirp() {
    if (!this.ctx || !this.birdGain || this.isMuted || this.isMoving) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    // Quick sweep from 2.5kHz to 4.5kHz to simulate a small chirp
    const startFreq = 2200 + Math.random() * 500;
    const endFreq = 3800 + Math.random() * 800;
    const duration = 0.08 + Math.random() * 0.08;

    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    gain.connect(this.birdGain);

    osc.start(t);
    osc.stop(t + duration + 0.05);

    // Double chirp chance
    if (Math.random() > 0.4) {
      const delay = duration + 0.08;
      setTimeout(() => {
        if (this.isMoving) return;
        const osc2 = this.ctx!.createOscillator();
        const gain2 = this.ctx!.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(startFreq * 1.1, this.ctx!.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(endFreq * 1.1, this.ctx!.currentTime + duration);

        gain2.gain.setValueAtTime(0, this.ctx!.currentTime);
        gain2.gain.linearRampToValueAtTime(0.05, this.ctx!.currentTime + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + duration);

        osc2.connect(gain2);
        gain2.connect(this.birdGain!);
        osc2.start();
        osc2.stop(this.ctx!.currentTime + duration + 0.05);
      }, delay * 1000);
    }
  }

  // --- 3. FM PIANO SYNTH ---
  private setupPianoSynth() {
    if (!this.ctx || !this.masterGain) return;

    this.pianoGain = this.ctx.createGain();
    this.pianoGain.connect(this.masterGain);

    // Reverb/Delay channel for spacious sound
    this.delayNode = this.ctx.createDelay();
    this.delayNode.delayTime.setValueAtTime(0.5, this.ctx.currentTime); // 500ms delay

    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.setValueAtTime(0.4, this.ctx.currentTime); // feedback volume

    this.pianoGain.connect(this.delayNode);
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode); // feedback loop
    
    // Connect delay output back to master
    this.delayNode.connect(this.masterGain);
  }

  private playPianoNote(freq: number, velocity: number = 0.5) {
    if (!this.ctx || !this.pianoGain) return;

    const t = this.ctx.currentTime;
    
    // FM synthesis voice
    // Carrier: creates base tone
    const carrier = this.ctx.createOscillator();
    carrier.type = "sine";
    carrier.frequency.setValueAtTime(freq, t);

    // Modulator: creates bright pluck metallic attack, decays quickly to warm sine
    const modulator = this.ctx.createOscillator();
    modulator.type = "sine";
    modulator.frequency.setValueAtTime(freq * 2.0, t); // 2:1 harmonic ratio

    const modGain = this.ctx.createGain();
    // Decay FM index quickly for transient strike
    modGain.gain.setValueAtTime(freq * 2.0, t);
    modGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    // Carrier Envelope (ADSR)
    const carrierGain = this.ctx.createGain();
    carrierGain.gain.setValueAtTime(0, t);
    carrierGain.gain.linearRampToValueAtTime(velocity * 0.08, t + 0.02); // 20ms attack
    carrierGain.gain.exponentialRampToValueAtTime(velocity * 0.015, t + 1.2); // decay
    carrierGain.gain.exponentialRampToValueAtTime(0.0001, t + 4.5); // long release

    // Connections
    modulator.connect(modGain);
    modGain.connect(carrier.frequency); // FM modulation
    carrier.connect(carrierGain);
    carrierGain.connect(this.pianoGain);

    // Start & Stop
    carrier.start(t);
    modulator.start(t);

    carrier.stop(t + 4.6);
    modulator.stop(t + 4.6);
  }

  private triggerMeditationChord() {
    if (this.isMoving) return;
    const chord = this.pianoChords[this.currentChordIndex];
    
    // Arpeggiate the chord notes softly with random offset
    chord.forEach((freq, idx) => {
      const delay = idx * (0.08 + Math.random() * 0.15); // gentle rolling speed
      setTimeout(() => {
        if (this.isMoving) return;
        // root note is lower and slightly louder, higher extensions are softer
        const vel = idx === 0 ? 0.8 : 0.5 - idx * 0.05;
        this.playPianoNote(freq, vel);
      }, delay * 1000);
    });

    // Advance chord
    this.currentChordIndex = (this.currentChordIndex + 1) % this.pianoChords.length;

    // Glide string pads to match the chord progression
    this.glideStringPads(chord);
  }

  // --- 4. STRING PADS SYNTH ---
  private setupPadSynth() {
    if (!this.ctx || !this.masterGain) return;

    this.padGain = this.ctx.createGain();
    this.padGain.connect(this.masterGain);

    this.padFilter = this.ctx.createBiquadFilter();
    this.padFilter.type = "lowpass";
    this.padFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);
    this.padFilter.frequency.setValueAtTime(140, this.ctx.currentTime); // deep filtered warm sound
    this.padFilter.connect(this.padGain);

    // Initialize 4 warm pad voice oscillators
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = "triangle"; // soft triangles
      // initially at root C chord
      const freq = [130.81, 164.81, 196.0, 246.94][i];
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.detune.setValueAtTime((i - 1.5) * 8, this.ctx.currentTime); // detune voices for width

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.04, this.ctx.currentTime); // soft volume per voice

      osc.connect(oscGain);
      oscGain.connect(this.padFilter);
      osc.start();

      this.padOscs.push(osc);
    }
  }

  private glideStringPads(freqs: number[]) {
    if (!this.ctx || this.padOscs.length === 0) return;
    const t = this.ctx.currentTime;
    
    // Glide strings frequencies slowly to the new chord tones
    this.padOscs.forEach((osc, idx) => {
      const targetFreq = freqs[idx % freqs.length];
      osc.frequency.cancelScheduledValues(t);
      osc.frequency.setValueAtTime(osc.frequency.value, t);
      // Glide over 3 seconds for beautiful smooth vocal/strings portamento
      osc.frequency.exponentialRampToValueAtTime(targetFreq, t + 3.0);
    });
  }

  // --- 5. MP3 SONG PLAYER ---
  private setupSongPlayer() {
    if (!this.ctx || !this.masterGain) return;

    this.audioNode = new Audio();
    // Resolve audio route correctly
    this.audioNode.src = "/time-017/music/TIME 017 - Rooted in the Quiet.mp3";
    this.audioNode.loop = true;
    this.audioNode.preload = "auto";
    
    this.songGain = this.ctx.createGain();
    this.songGain.connect(this.masterGain);

    this.songSource = this.ctx.createMediaElementSource(this.audioNode);
    this.songSource.connect(this.songGain);
  }

  // --- STATE MODULATION & INTERACTION CONTROLLER ---
  public setMovementState(moving: boolean) {
    this.isMoving = moving;
    if (moving) {
      // Clear scheduling loops
      if (this.pianoInterval) {
        clearInterval(this.pianoInterval);
        this.pianoInterval = null;
      }
      if (this.birdInterval) {
        clearInterval(this.birdInterval);
        this.birdInterval = null;
      }

      // Smoothly fade out stillness synths and song elements on movement (quick 1.2s release)
      const t = this.ctx ? this.ctx.currentTime : 0;
      if (this.ctx && this.birdGain && this.pianoGain && this.padGain && this.songGain) {
        this.birdGain.gain.cancelScheduledValues(t);
        this.birdGain.gain.setValueAtTime(this.birdGain.gain.value, t);
        this.birdGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

        this.pianoGain.gain.cancelScheduledValues(t);
        this.pianoGain.gain.setValueAtTime(this.pianoGain.gain.value, t);
        this.pianoGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

        this.padGain.gain.cancelScheduledValues(t);
        this.padGain.gain.setValueAtTime(this.padGain.gain.value, t);
        this.padGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

        this.songGain.gain.cancelScheduledValues(t);
        this.songGain.gain.setValueAtTime(this.songGain.gain.value, t);
        this.songGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      }

      // Slowly pause song audio track if it was playing, after it has fully faded out
      if (this.audioNode && this.songStarted) {
        setTimeout(() => {
          if (this.isMoving && this.audioNode) {
            this.audioNode.pause();
          }
        }, 1500);
      }

      // Restore Drone to full volume, sweep filter up slightly to suggest movement wake
      if (this.ctx && this.droneGain && this.droneFilter) {
        this.droneGain.gain.cancelScheduledValues(t);
        this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, t);
        this.droneGain.gain.linearRampToValueAtTime(0.9, t + 1.0);

        this.droneFilter.frequency.cancelScheduledValues(t);
        this.droneFilter.frequency.setValueAtTime(this.droneFilter.frequency.value, t);
        this.droneFilter.frequency.exponentialRampToValueAtTime(160, t + 1.0);
      }

      this.stillnessLevel = 0;
    }
  }

  public updateStillnessTime(seconds: number) {
    if (!this.isInitialized || !this.ctx || this.isMoving) return;
    const t = this.ctx.currentTime;

    // Progression of Stillness Levels
    // Level 1 (>= 2s): Birds chirp, roots grow
    if (seconds >= 2 && this.stillnessLevel < 1) {
      this.stillnessLevel = 1;
      
      // Fade in birds volume
      this.birdGain!.gain.cancelScheduledValues(t);
      this.birdGain!.gain.setValueAtTime(this.birdGain!.gain.value, t);
      this.birdGain!.gain.linearRampToValueAtTime(0.8, t + 1.0);

      // Trigger first chirp instantly
      this.triggerBirdChirp();
      this.birdInterval = setInterval(() => this.triggerBirdChirp(), 4000 + Math.random() * 5000);
    }

    // Level 2 (>= 5s): Meditative Soft Piano Synth
    if (seconds >= 5 && this.stillnessLevel < 2) {
      this.stillnessLevel = 2;

      this.pianoGain!.gain.cancelScheduledValues(t);
      this.pianoGain!.gain.setValueAtTime(this.pianoGain!.gain.value, t);
      this.pianoGain!.gain.linearRampToValueAtTime(0.9, t + 1.5);

      // Trigger first piano chord arpeggiation instantly
      this.triggerMeditationChord();
      this.pianoInterval = setInterval(() => this.triggerMeditationChord(), 6000);

      // Dim drone volume slightly to make space for piano
      this.droneGain!.gain.cancelScheduledValues(t);
      this.droneGain!.gain.setValueAtTime(this.droneGain!.gain.value, t);
      this.droneGain!.gain.linearRampToValueAtTime(0.6, t + 2.0);
    }

    // Level 3 (>= 10s): Warm Strings/Pad Synth
    if (seconds >= 10 && this.stillnessLevel < 3) {
      this.stillnessLevel = 3;

      this.padGain!.gain.cancelScheduledValues(t);
      this.padGain!.gain.setValueAtTime(this.padGain!.gain.value, t);
      this.padGain!.gain.linearRampToValueAtTime(0.75, t + 2.5);

      // Deepen filter on drone to make background darker and strings warmer
      this.droneFilter!.frequency.cancelScheduledValues(t);
      this.droneFilter!.frequency.setValueAtTime(this.droneFilter!.frequency.value, t);
      this.droneFilter!.frequency.exponentialRampToValueAtTime(90, t + 3.0);
    }

    // Level 4 (>= 20s): Dynamic Full Song MP3
    if (seconds >= 20 && this.stillnessLevel < 4) {
      this.stillnessLevel = 4;

      if (this.audioNode) {
        if (!this.songStarted) {
          this.audioNode.play().catch(err => console.log("Audio play error:", err));
          this.songStarted = true;
        } else {
          this.audioNode.play().catch(err => console.log("Audio play error:", err));
        }

        // Fade in song MP3 over 4 seconds (very organic)
        this.songGain!.gain.cancelScheduledValues(t);
        this.songGain!.gain.setValueAtTime(this.songGain!.gain.value, t);
        this.songGain!.gain.linearRampToValueAtTime(1.0, t + 4.0);

        // Mix down synths slightly to merge them into the song master track
        this.pianoGain!.gain.cancelScheduledValues(t);
        this.pianoGain!.gain.setValueAtTime(this.pianoGain!.gain.value, t);
        this.pianoGain!.gain.linearRampToValueAtTime(0.35, t + 3.0);

        this.padGain!.gain.cancelScheduledValues(t);
        this.padGain!.gain.setValueAtTime(this.padGain!.gain.value, t);
        this.padGain!.gain.linearRampToValueAtTime(0.25, t + 3.0);

        this.droneGain!.gain.cancelScheduledValues(t);
        this.droneGain!.gain.setValueAtTime(this.droneGain!.gain.value, t);
        this.droneGain!.gain.linearRampToValueAtTime(0.2, t + 3.0);
      }
    }
  }

  // --- ANCIENT TREE ENDING SEQUENCE ---
  public playEnding() {
    if (!this.isInitialized || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.stillnessLevel = 5;

    // Ensure song is playing at full volume
    if (this.audioNode) {
      this.audioNode.play().catch(err => console.log(err));
      this.songGain!.gain.cancelScheduledValues(t);
      this.songGain!.gain.setValueAtTime(this.songGain!.gain.value, t);
      this.songGain!.gain.linearRampToValueAtTime(1.0, t + 2.0);
    }

    // Completely fade out synths to leave the pristine recorded MP3
    this.pianoGain!.gain.cancelScheduledValues(t);
    this.pianoGain!.gain.exponentialRampToValueAtTime(0.0001, t + 4.0);

    this.padGain!.gain.cancelScheduledValues(t);
    this.padGain!.gain.exponentialRampToValueAtTime(0.0001, t + 4.0);

    this.droneGain!.gain.cancelScheduledValues(t);
    this.droneGain!.gain.exponentialRampToValueAtTime(0.0001, t + 4.0);
  }

  // --- SYSTEM UTILITIES ---
  public setVolume(val: number) {
    this.volume = val;
    if (this.ctx && this.masterGain) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : val, t);
    }
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    if (this.ctx && this.masterGain) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(mute ? 0 : this.volume, t);
    }
  }

  public stop() {
    if (this.pianoInterval) clearInterval(this.pianoInterval);
    if (this.birdInterval) clearInterval(this.birdInterval);
    
    if (this.audioNode) {
      this.audioNode.pause();
      this.audioNode.currentTime = 0;
    }

    this.droneOscs.forEach(o => { try { o.stop(); } catch(e) {} });
    this.padOscs.forEach(o => { try { o.stop(); } catch(e) {} });
    if (this.droneLFO) { try { this.droneLFO.stop(); } catch(e) {} }

    this.isInitialized = false;
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close();
    }
  }
}

// Single instance to import across components
export const audioEngine = new AudioEngine();
