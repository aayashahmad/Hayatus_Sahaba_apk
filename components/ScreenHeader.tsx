import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "../constants/theme";

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 10 }]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      <View style={styles.ornament}>
        <View style={styles.rule} />
        <View style={styles.diamond} />
        <View style={styles.rule} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:     { backgroundColor: C.bg, paddingHorizontal: 16, paddingBottom: 6 },
  row:      { flexDirection: "row", alignItems: "center" },
  title:    { color: C.gold, fontSize: 22, fontWeight: "700", letterSpacing: 0.3 },
  subtitle: { color: C.muted, fontSize: 12, marginTop: 2 },
  ornament: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  rule:     { flex: 1, height: 1, backgroundColor: C.line },
  diamond:  { width: 7, height: 7, backgroundColor: C.gold, transform: [{ rotate: "45deg" }], marginHorizontal: 8 },
});
