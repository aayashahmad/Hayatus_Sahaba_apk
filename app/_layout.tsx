import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../store/auth";

export default function RootLayout() {
  const { loadToken } = useAuth();

  useEffect(() => {
    loadToken();
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor="#16302a" translucent={false} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
