import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#c8a96e",
        tabBarStyle: { backgroundColor: "#1a0a00" },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index"     options={{ title: "Read",      tabBarIcon: () => null }} />
      <Tabs.Screen name="bookmarks" options={{ title: "Bookmarks", tabBarIcon: () => null }} />
      <Tabs.Screen name="downloads" options={{ title: "Downloads", tabBarIcon: () => null }} />
      <Tabs.Screen name="settings"  options={{ title: "Settings",  tabBarIcon: () => null }} />
    </Tabs>
  );
}
