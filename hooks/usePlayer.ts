import { useCallback, useEffect, useRef, useState } from "react";
import TrackPlayer, { State, usePlaybackState } from "react-native-track-player";
import { api } from "../services/api";
import { localAudioPath } from "../services/download";

type PlayerState = "idle" | "playing" | "paused";

export function usePlayer(vol: number, page: number, onPageEnd?: () => void) {
  const playback = usePlaybackState();
  const [state, setState] = useState<PlayerState>("idle");
  const endHandled = useRef(false);

  const state2 = playback.state === State.Playing ? "playing"
    : playback.state === State.Paused ? "paused"
    : "idle";

  const play = useCallback(async () => {
    endHandled.current = false;
    // Prefer local offline file, fall back to streaming URL
    const local = await localAudioPath(vol, page);
    const url = local ?? api.getAudioUrl(vol, page);

    await TrackPlayer.reset();
    await TrackPlayer.add({
      id: `${vol}-${page}`,
      url,
      title: `Hayatus Sahaba — Vol ${vol} · Page ${page}`,
      artist: "Maulana Muhammad Yusuf Kandhlawi",
    });
    await TrackPlayer.play();
  }, [vol, page]);

  const pause = useCallback(() => TrackPlayer.pause(), []);
  const stop  = useCallback(() => TrackPlayer.stop(),  []);

  // Fire onPageEnd when track finishes
  useEffect(() => {
    if (playback.state === State.Ended && !endHandled.current) {
      endHandled.current = true;
      onPageEnd?.();
    }
  }, [playback.state, onPageEnd]);

  return { state: state2, play, pause, stop };
}
