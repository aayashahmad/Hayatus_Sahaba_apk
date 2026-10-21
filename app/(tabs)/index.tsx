import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { usePlayer } from "../../hooks/usePlayer";
import { api } from "../../services/api";
import { useAuth } from "../../store/auth";

export default function ReaderScreen() {
  const [vol, setVol] = useState(1);
  const [page, setPage] = useState(95);
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const { token } = useAuth();

  const onPageEnd = useCallback(() => setPage((p) => p + 1), []);
  const { state, play, pause } = usePlayer(vol, page, onPageEnd);

  // Load text
  useEffect(() => {
    api.getText(vol, page).then((d) => setParagraphs(d.paragraphs ?? [])).catch(() => {});
  }, [vol, page]);

  // Load saved progress on mount
  useEffect(() => {
    if (!token) return;
    api.getProgress().then((list: { vol: number; page: number }[]) => {
      const saved = list.find((p) => p.vol === vol);
      if (saved) setPage(saved.page);
    }).catch(() => {});
  }, [token]);

  // Save progress when page changes
  useEffect(() => {
    if (!token) return;
    api.setProgress(vol, page).catch(() => {});
  }, [vol, page, token]);

  const addBookmark = () => {
    if (!token) { Alert.alert("Sign in", "Sign in from Settings to save bookmarks."); return; }
    api.addBookmark(vol, page)
      .then(() => Alert.alert("Bookmarked", `Vol ${vol} · Page ${page}`))
      .catch(() => Alert.alert("Error", "Could not save bookmark."));
  };

  const goPage = (next: number) => setPage(Math.max(1, next));

  return (
    <View style={styles.container}>
      {/* Volume tabs */}
      <View style={styles.volRow}>
        {[1, 2, 3].map((v) => (
          <TouchableOpacity key={v} style={[styles.volBtn, vol === v && styles.volActive]} onPress={() => { setVol(v); setPage(1); }}>
            <Text style={[styles.volText, vol === v && styles.volTextActive]}>Vol {v}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.bookmarkBtn} onPress={addBookmark}>
          <Text style={styles.bookmarkIcon}>🔖</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {paragraphs.map((para, i) => (
          <Text key={i} style={styles.paragraph}>{para}</Text>
        ))}
      </ScrollView>

      <View style={styles.controls}>
        <TouchableOpacity onPress={() => goPage(page - 1)} style={styles.btn}>
          <Text style={styles.btnText}>← Prev</Text>
        </TouchableOpacity>
        <Text style={styles.pageNum}>Page {page}</Text>
        <TouchableOpacity onPress={state === "playing" ? pause : play} style={[styles.btn, styles.play]}>
          <Text style={[styles.btnText, styles.playText]}>{state === "playing" ? "⏸" : "▶ Listen"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => goPage(page + 1)} style={styles.btn}>
          <Text style={styles.btnText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#1a0a00" },
  volRow:         { flexDirection: "row", backgroundColor: "#2a1500", paddingHorizontal: 12, paddingTop: 48, paddingBottom: 8 },
  volBtn:         { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 6, marginHorizontal: 4 },
  volActive:      { backgroundColor: "#c8a96e" },
  volText:        { color: "#a08060", fontSize: 13, fontWeight: "600" },
  volTextActive:  { color: "#1a0a00" },
  bookmarkBtn:    { justifyContent: "center", paddingHorizontal: 12 },
  bookmarkIcon:   { fontSize: 20 },
  content:        { padding: 20, paddingBottom: 40 },
  paragraph:      { color: "#f5e6c8", fontSize: 20, lineHeight: 38, textAlign: "right", marginBottom: 16 },
  controls:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "#2a1500" },
  btn:            { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: "#3a2000" },
  play:           { backgroundColor: "#c8a96e", paddingHorizontal: 20 },
  btnText:        { color: "#f5e6c8", fontSize: 14 },
  playText:       { color: "#1a0a00", fontWeight: "bold" },
  pageNum:        { color: "#a08060", fontSize: 13 },
});
