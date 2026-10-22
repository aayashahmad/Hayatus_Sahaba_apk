import { Stack } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts, NotoNastaliqUrdu_400Regular, NotoNastaliqUrdu_700Bold } from "@expo-google-fonts/noto-nastaliq-urdu";
import { useAuth } from "../store/auth";
import { C } from "../constants/theme";

export default function RootLayout() {
  const { loadToken } = useAuth();
  const [fontsLoaded] = useFonts({ NotoNastaliqUrdu_400Regular, NotoNastaliqUrdu_700Bold });

  useEffect(() => {
    loadToken();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={C.bg} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
