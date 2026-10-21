import { Stack } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "../store/auth";

export default function RootLayout() {
  const { loadToken } = useAuth();

  useEffect(() => {
    loadToken();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
