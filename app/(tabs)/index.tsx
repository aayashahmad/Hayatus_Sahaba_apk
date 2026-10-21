import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePlayer } from "../../hooks/usePlayer";
import { api } from "../../services/api";
import { useAuth } from "../../store/auth";

const ARCHIVE_ITEM = ["", "HayatusSahabaPart1", "HayatusSahabaPart2", "HayatusSahabaPart3"];
const pad = (n: number) => String(n).padStart(4, "0");

function originalPageUrl(vol: number, page: number) {
  const base = ARCHIVE_ITEM[vol];
  return `https://archive.org/download/${base}/${base}_jp2.zip/${base}_jp2%2F${base}_${pad(page)}.jp2&ext=jpg&reduce=1`;
}

export default function ReaderScreen() {
  const [vol, setVol] = useState(1);
  const [page, setPage] = useState(95);
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const { token } = useAuth();

  const onPageEnd = useCallback(() => setPage((p) => p + 1), []);
  const { state, play, pause } = usePlayer(vol, page, onPageEnd);

  useEffect(() => {
    api.getText(vol, page).then((d) => setParagraphs(d.paragraphs ?? [])).catch(() => {});
  }, [vol, page]);

  useEffect(() => {
    if (!token) return;
    api.getProgress().then((list: { vol: number; page: number }[]) => {
      const saved = list.find((p) => p.vol === vol);
      if (saved) setPage(saved.page);
    }).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    api.setProgress(vol, page).catch(() => {});
  }, [vol, page, token]);

  const addBookmark = async () => {
    if (token) {
      api.addBookmark(vol, page)
        .then(() => Alert.alert("Bookmarked", `Vol ${vol} · Page ${page}`))
        .catch(() => Alert.alert("Error", "Could not save bookmark."));
    } else {
      // Save locally when not signed in
      const key = "local_bookmarks";
      const raw = await AsyncStorage.getItem(key);
      const list: { vol: number; page: number }[] = raw ? JSON.parse(raw) : [];
      const exists = list.some((b) => b.vol === vol && b.page === page);
      if (!exists) {
        list.push({ vol, page });
        await AsyncStorage.setItem(key, JSON.stringify(list));
      }
      Alert.alert("Bookmarked", `Vol ${vol} · Page ${page} (saved locally)`);
    }
  };

  const openOriginal = () => Linking.openURL(originalPageUrl(vol, page));

  const goPage = (next: number) => setPage(Math.max(1, next));

  return (
    <View style={styles.container}>
      <View style={styles.volRow}>
        {[1, 2, 3].map((v) => (
          <TouchableOpacity key={v} style={[styles.volBtn, vol === v && styles.volActive]} onPress={() => { setVol(v); setPage(1); }}>
            <Text style={[styles.volText, vol === v && styles.volTextActive]}>Vol {v}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.iconBtn} onPress={addBookmark}>
          <Text style={styles.icon}>🔖</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={openOriginal}>
          <Text style={styles.icon}>📄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {paragraphs.length === 0 ? (
          <Text style={styles.loading}>Loading…</Text>
        ) : (
          paragraphs.map((para, i) => (
            <Text key={i} style={styles.paragraph}>{para}</Text>
          ))
        )}
      </ScrollView>

      <View style={styles.controls}>
        <TouchableOpacity onPress={() => goPage(page - 1)} style={styles.btn}>
          <Text style={styles.btnText}>← Prev</Text>
        </TouchableOpacity>
        <Text style={styles.pageNum}>Page {page}</Text>
        <TouchableOpacity onPress={state === "playing" ? pause : play} style={[styles.btn, styles.play]}>
          <Text style={[styles.btnText, styles.playText]}>{state === "playing" ? "⏸ Pause" : "▶ Listen"}</Text>
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
  volRow:         { flexDirection: "row", backgroundColor: "#2a1500", paddingHorizontal: 12, paddingTop: 52, paddingBottom: 8 },
  volBtn:         { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 6, marginHorizontal: 3 },
  volActive:      { backgroundColor: "#c8a96e" },
  volText:        { color: "#a08060", fontSize: 12, fontWeight: "600" },
  volTextActive:  { color: "#1a0a00" },
  iconBtn:        { justifyContent: "center", paddingHorizontal: 8 },
  icon:           { fontSize: 18 },
  content:        { padding: 20, paddingBottom: 40 },
  loading:        { color: "#a08060", textAlign: "center", marginTop: 40, fontSize: 16 },
  paragraph:      { color: "#f5e6c8", fontSize: 20, lineHeight: 38, textAlign: "right", marginBottom: 16 },
  controls:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "#2a1500" },
  btn:            { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: "#3a2000" },
  play:           { backgroundColor: "#c8a96e" },
  btnText:        { color: "#f5e6c8", fontSize: 13 },
  playText:       { color: "#1a0a00", fontWeight: "bold" },
  pageNum:        { color: "#a08060", fontSize: 13 },
});
