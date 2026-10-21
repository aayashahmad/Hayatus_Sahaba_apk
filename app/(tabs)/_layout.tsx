import { Tabs } from "expo-router";
import { Text, View } from "react-native";

const C = { bg: "#16302a", panel: "#1d3a32", line: "#2c4f45", gold: "#c9a961", muted: "#a9b8ae" };

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 6 }}>
      <Text style={{ fontSize: 20, marginBottom: 2 }}>{icon}</Text>
      <Text style={{ fontSize: 10, color: focused ? C.gold : C.muted, fontWeight: focused ? "600" : "400" }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: C.panel,
          borderTopColor: C.line,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📖" label="Read" focused={focused} /> }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🔖" label="Bookmarks" focused={focused} /> }}
      />
      <Tabs.Screen
        name="downloads"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="⬇️" label="Downloads" focused={focused} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" label="Settings" focused={focused} /> }}
      />
    </Tabs>
  );
}
