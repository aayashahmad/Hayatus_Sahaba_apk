import { Stack } from "expo-router";
import { useEffect } from "react";
import TrackPlayer from "react-native-track-player";
import { playbackService } from "../services/playback";
import { useAuth } from "../store/auth";

TrackPlayer.registerPlaybackService(() => playbackService);

export default function RootLayout() {
  const { loadToken } = useAuth();

  useEffect(() => {
    TrackPlayer.setupPlayer();
    loadToken();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
