import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "../../constants/theme";

type IconName = keyof typeof Ionicons.glyphMap;

function icon(active: IconName, inactive: IconName) {
  return ({ focused, color }: { focused: boolean; color: string }) => (
    <View style={[styles.iconWrap, focused && styles.iconWrapOn]}>
      <Ionicons name={focused ? active : inactive} size={22} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.gold,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 2 },
        tabBarStyle: {
          backgroundColor: C.panelDeep,
          borderTopColor: C.line,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
        },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen name="index"     options={{ title: "Read",      tabBarIcon: icon("book", "book-outline") }} />
      <Tabs.Screen name="bookmarks" options={{ title: "Bookmarks", tabBarIcon: icon("bookmark", "bookmark-outline") }} />
      <Tabs.Screen name="downloads" options={{ title: "Offline",   tabBarIcon: icon("cloud-download", "cloud-download-outline") }} />
      <Tabs.Screen name="settings"  options={{ title: "Settings",  tabBarIcon: icon("settings", "settings-outline") }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap:   { width: 48, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  iconWrapOn: { backgroundColor: C.goldSoft },
});
