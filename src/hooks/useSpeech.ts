import { useEffect } from 'react';

// To swap to a different TTS provider later: replace this hook's internals only.
// audioUrl comes from /api/tts/preload — a cached ElevenLabs MP3 served at /tts/*.mp3

// Module-level singleton: new slide mount stops the previous clip, not slide unmount.
let activeAudio: HTMLAudioElement | null = null;

export function useSpeech(audioUrl: string | null, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !audioUrl) return;
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.src = '';
    }
    const audio = new Audio(audioUrl);
    activeAudio = audio;
    audio.play().catch(() => {}); // ignore autoplay block (browser policy)
    // no cleanup pause — audio plays to completion unless a new slide starts
  }, []); // runs once on mount; slides remount on nav via key={currentNodeId}
}
