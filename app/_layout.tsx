import { Stack } from "expo-router";
import { useEffect } from "react";
import TrackPlayer from "react-native-track-player";
import { playbackService } from "../services/playback";

TrackPlayer.registerPlaybackService(() => playbackService);

export default function RootLayout() {
  useEffect(() => {
    TrackPlayer.setupPlayer();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
