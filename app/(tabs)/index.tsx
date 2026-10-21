import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { usePlayer } from "../../hooks/usePlayer";
import { api } from "../../services/api";

export default function ReaderScreen() {
  const [vol, setVol] = useState(1);
  const [page, setPage] = useState(95);
  const [paragraphs, setParagraphs] = useState<string[]>([]);

  const onPageEnd = useCallback(() => setPage((p) => p + 1), []);
  const { state, current, play, pause, stop } = usePlayer(vol, page, onPageEnd);

  useEffect(() => {
    api.getText(vol, page).then((d) => setParagraphs(d.paragraphs ?? []));
  }, [vol, page]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {paragraphs.map((para, i) => (
          <Text key={i} style={styles.paragraph}>{para}</Text>
        ))}
      </ScrollView>

      <View style={styles.controls}>
        <TouchableOpacity onPress={() => setPage((p) => Math.max(0, p - 1))} style={styles.btn}>
          <Text style={styles.btnText}>← Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={state === "playing" ? pause : play} style={[styles.btn, styles.play]}>
          <Text style={styles.btnText}>{state === "playing" ? "⏸ Pause" : "▶ Listen"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPage((p) => p + 1)} style={styles.btn}>
          <Text style={styles.btnText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#1a0a00" },
  content:    { padding: 20 },
  paragraph:  { color: "#f5e6c8", fontSize: 20, lineHeight: 36, textAlign: "right", fontFamily: "NotoNastaliqUrdu", marginBottom: 16 },
  controls:   { flexDirection: "row", justifyContent: "space-around", padding: 16, backgroundColor: "#2a1500" },
  btn:        { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, backgroundColor: "#3a2000" },
  play:       { backgroundColor: "#c8a96e" },
  btnText:    { color: "#fff", fontSize: 14 },
});
