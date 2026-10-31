import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useRouter } from "expo-router";
import { C, URDU_FONT } from "../../constants/theme";
import { VOLUMES } from "../../constants/book";
import { useReading } from "../../store/reading";

type RowProps = { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; onPress?: () => void };

function Row({ icon, label, value, onPress }: RowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={C.gold} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={C.muted} /> : null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { vol, pages, selectVolume } = useReading();

  const change = (id: number) => {
    selectVolume(id);
    router.navigate("/");
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 18 }}>
        <View>
          <Text style={styles.section}>Volume</Text>
          <View style={styles.group}>
            {VOLUMES.map(({ id, urdu, pages: count }, i) => {
              const on = vol === id;
              return (
                <View key={id}>
                  {i > 0 && <View style={styles.sep} />}
                  <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => change(id)}>
                    <View style={[styles.volNum, on && styles.volNumOn]}>
                      <Text style={[styles.volNumText, on && { color: C.dark }]}>{id}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowLabel, on && { color: C.gold, fontWeight: "600" }]}>Volume {id}</Text>
                      <Text style={styles.rowSub}>
                        {pages[id] != null ? `Page ${pages[id]} of ${count - 1}` : `${count} pages`}
                      </Text>
                    </View>
                    <Text style={styles.urdu}>{urdu}</Text>
                    <Ionicons name={on ? "radio-button-on" : "radio-button-off"} size={20} color={on ? C.gold : C.muted} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        <View>
          <Text style={styles.section}>About the book</Text>
          <View style={styles.group}>
            <Row icon="book-outline" label="Hayatus Sahaba" value="3 volumes" />
            <View style={styles.sep} />
            <Row icon="person-outline" label="Author" value="M. Yusuf Kandhlawi (Rah)" />
            <View style={styles.sep} />
            <Row icon="globe-outline" label="Read on the web" onPress={() => Linking.openURL("https://hayatus-sahaba.vercel.app")} />
          </View>
        </View>

        <View>
          <Text style={styles.section}>Account</Text>
          <View style={styles.group}>
            <Row icon="cloud-outline" label="Sync across devices" value="Coming soon" />
          </View>
        </View>

        <View>
          <Text style={styles.section}>App</Text>
          <View style={styles.group}>
            <Row icon="information-circle-outline" label="Version" value="1.0.3" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: C.bg },
  section:  { color: C.gold, fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, marginLeft: 4 },
  group:    { backgroundColor: C.panel, borderRadius: 12, borderWidth: 1, borderColor: C.line, overflow: "hidden" },
  row:      { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  rowIcon:  { width: 32, height: 32, borderRadius: 8, backgroundColor: C.goldSoft, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, color: C.ink, fontSize: 15 },
  rowValue: { color: C.muted, fontSize: 13, flexShrink: 1, textAlign: "right" },
  sep:      { height: 1, backgroundColor: C.line, marginLeft: 58 },
  rowSub:   { color: C.muted, fontSize: 12, marginTop: 2 },
  urdu:     { fontFamily: URDU_FONT, color: C.muted, fontSize: 13, lineHeight: 30, marginRight: 4 },
  volNum:   { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: C.line, backgroundColor: C.panelDeep, alignItems: "center", justifyContent: "center" },
  volNumOn: { backgroundColor: C.gold, borderColor: C.gold },
  volNumText: { color: C.gold, fontSize: 14, fontWeight: "700" },
});
