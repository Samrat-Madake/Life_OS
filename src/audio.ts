export type AmbientSound = "none" | "nature" | "bird" | "ocean" | "rain";

export interface SoundOption {
  id: AmbientSound;
  label: string;
  icon: string;
  file?: string;
}

export const SOUND_OPTIONS: SoundOption[] = [
  { id: "none", label: "Off", icon: "🔇" },
  { id: "rain", label: "Rain", icon: "🌧", file: "/sounds/rain.mp3" },
  { id: "ocean", label: "Ocean", icon: "🌊", file: "/sounds/ocean.mp3" },
  { id: "bird", label: "Birds", icon: "🐦", file: "/sounds/bird.mp3" },
  { id: "nature", label: "Nature", icon: "🍃", file: "/sounds/Nature.mp3" },
];

class AmbientAudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private currentTrack: AmbientSound = "none";
  private volume: number = 0.5;

  public play(track: AmbientSound, volume?: number) {
    if (volume !== undefined) {
      this.volume = volume;
    }

    if (track === "none") {
      this.stop();
      return;
    }

    const sound = SOUND_OPTIONS.find((s) => s.id === track);
    if (!sound || !sound.file) {
      this.stop();
      return;
    }

    // If changing track, create/switch source
    if (!this.audio || this.currentTrack !== track) {
      this.stop();
      this.audio = new Audio(sound.file);
      this.audio.loop = true;
      this.currentTrack = track;
    }

    this.audio.volume = this.volume;
    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Handle autoplay policy/abort gracefully
        console.warn("Ambient audio play prevented or aborted:", err);
      });
    }
  }

  public pause() {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
  }

  public resume() {
    if (this.audio && this.currentTrack !== "none" && this.audio.paused) {
      this.audio.volume = this.volume;
      this.audio.play().catch(() => {});
    }
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  public stop() {
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
      } catch {}
      this.audio = null;
    }
    this.currentTrack = "none";
  }

  public getCurrentTrack(): AmbientSound {
    return this.currentTrack;
  }
}

export const ambientPlayer = new AmbientAudioPlayer();
