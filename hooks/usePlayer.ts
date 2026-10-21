import { useCallback, useEffect, useRef, useState } from "react";
import { Audio } from "expo-av";
import { api } from "../services/api";
import { localAudioPath } from "../services/download";

type PlayerState = "idle" | "playing" | "paused";

export function usePlayer(vol: number, page: number, onPageEnd?: () => void) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [state, setState] = useState<PlayerState>("idle");

  // Enable background audio
  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  // Unload when page changes
  useEffect(() => {
    soundRef.current?.unloadAsync();
    soundRef.current = null;
    setState("idle");
  }, [vol, page]);

  const play = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setState("playing");
        return;
      }

      const local = await localAudioPath(vol, page);
      const uri = local ?? api.getAudioUrl(vol, page);

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            setState("idle");
            onPageEnd?.();
          }
        }
      );
      soundRef.current = sound;
      setState("playing");
    } catch (e) {
      console.error("Audio error", e);
    }
  }, [vol, page, onPageEnd]);

  const pause = useCallback(async () => {
    await soundRef.current?.pauseAsync();
    setState("paused");
  }, []);

  const stop = useCallback(async () => {
    await soundRef.current?.stopAsync();
    setState("idle");
  }, []);

  return { state, play, pause, stop };
}
