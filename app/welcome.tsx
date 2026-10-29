import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReading } from "../store/reading";
import { C, URDU_FONT, URDU_FONT_BOLD } from "../constants/theme";
import { VOLUMES } from "../constants/book";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectVolume, pages } = useReading();

  const choose = (vol: number) => {
    selectVolume(vol);
    router.replace("/");
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 36, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.hero}>
          <View style={styles.emblem}>
            <View style={styles.emblemInner}>
              <Ionicons name="book" size={34} color={C.gold} />
            </View>
          </View>

          <Text style={styles.urduTitle}>حیاۃ الصحابہ</Text>
          <Text style={styles.title}>Hayatus Sahaba</Text>
          <Text style={styles.author}>Maulana Muhammad Yusuf Kandhlawi (Rah)</Text>

          <View style={styles.ornament}>
            <View style={styles.rule} />
            <View style={styles.diamond} />
            <View style={styles.rule} />
          </View>
        </View>

        <Text style={styles.prompt}>Choose a volume to begin</Text>

        <View style={styles.list}>
          {VOLUMES.map(({ id, pages: count, urdu }) => {
            const started = pages[id] != null;
            return (
              <TouchableOpacity key={id} style={styles.card} activeOpacity={0.8} onPress={() => choose(id)}>
                <View style={styles.numBadge}>
                  <Text style={styles.numText}>{id}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Volume {id}</Text>
                  <Text style={styles.cardSub}>
                    {started ? `Continue from page ${pages[id]}` : `${count} pages`}
                  </Text>
                </View>
                <Text style={styles.cardUrdu}>{urdu}</Text>
                <Ionicons name="chevron-forward" size={20} color={C.gold} />
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.footer}>You can switch volumes any time from Settings.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  scroll:      { paddingHorizontal: 20, flexGrow: 1 },

  hero:        { alignItems: "center", marginBottom: 28 },
  emblem:      { width: 96, height: 96, borderRadius: 24, borderWidth: 1, borderColor: C.gold, alignItems: "center", justifyContent: "center", transform: [{ rotate: "45deg" }], marginBottom: 28 },
  emblemInner: { width: 76, height: 76, borderRadius: 18, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-45deg" }] },
  urduTitle:   { fontFamily: URDU_FONT_BOLD, color: C.gold, fontSize: 34, lineHeight: 78, textAlign: "center" },
  title:       { color: C.ink, fontSize: 26, fontWeight: "700", letterSpacing: 0.5, marginTop: -4 },
  author:      { color: C.muted, fontSize: 13, marginTop: 6, textAlign: "center" },
  ornament:    { flexDirection: "row", alignItems: "center", marginTop: 22, width: "70%" },
  rule:        { flex: 1, height: 1, backgroundColor: C.line },
  diamond:     { width: 8, height: 8, backgroundColor: C.gold, transform: [{ rotate: "45deg" }], marginHorizontal: 10 },

  prompt:      { color: C.gold, fontSize: 12, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12, marginLeft: 4 },
  list:        { gap: 12 },
  card:        { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.panel, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: C.line },
  numBadge:    { width: 48, height: 48, borderRadius: 14, backgroundColor: C.goldSoft, borderWidth: 1, borderColor: C.gold, alignItems: "center", justifyContent: "center" },
  numText:     { color: C.gold, fontSize: 20, fontWeight: "700" },
  cardTitle:   { color: C.ink, fontSize: 17, fontWeight: "600" },
  cardSub:     { color: C.muted, fontSize: 13, marginTop: 3 },
  cardUrdu:    { fontFamily: URDU_FONT, color: C.gold, fontSize: 15, lineHeight: 36, marginRight: 2 },

  footer:      { color: C.muted, fontSize: 12, textAlign: "center", marginTop: 24 },
});
