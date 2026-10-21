import { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Linking, TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePlayer } from "../../hooks/usePlayer";
import { api } from "../../services/api";
import { useAuth } from "../../store/auth";

// ── colours matching web app ──────────────────────────────────────────
const C = {
  bg:    "#16302a",
  panel: "#1d3a32",
  line:  "#2c4f45",
  gold:  "#c9a961",
  ink:   "#f3ecdc",
  muted: "#a9b8ae",
  dark:  "#1b2b25",
};

const ARCHIVE = ["", "HayatusSahabaPart1", "HayatusSahabaPart2", "HayatusSahabaPart3"];
const pad = (n: number) => String(n).padStart(4, "0");

export default function ReaderScreen() {
  const [vol, setVol]           = useState(1);
  const [page, setPage]         = useState(95);
  const [pageInput, setPageInput] = useState("95");
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [showScan, setShowScan] = useState(false);
  const { token }               = useAuth();

  const onPageEnd = useCallback(() => setPage((p) => p + 1), []);
  const { state, play, pause }  = usePlayer(vol, page, onPageEnd);

  // load text
  useEffect(() => {
    setParagraphs([]);
    api.getText(vol, page)
      .then((d) => setParagraphs(d.paragraphs ?? []))
      .catch(() => {});
  }, [vol, page]);

  // sync page input
  useEffect(() => setPageInput(String(page)), [page]);

  // progress
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
      const raw = await AsyncStorage.getItem("local_bookmarks");
      const list: { vol: number; page: number }[] = raw ? JSON.parse(raw) : [];
      if (!list.some((b) => b.vol === vol && b.page === page)) {
        list.push({ vol, page });
        await AsyncStorage.setItem("local_bookmarks", JSON.stringify(list));
      }
      Alert.alert("Bookmarked", `Vol ${vol} · Page ${page}`);
    }
  };

  const goPage = (n: number) => setPage(Math.max(1, n));
  const submitPageInput = () => {
    const n = parseInt(pageInput, 10);
    if (!isNaN(n) && n > 0) goPage(n);
    else setPageInput(String(page));
  };

  const scanUrl = `https://archive.org/download/${ARCHIVE[vol]}/${ARCHIVE[vol]}_jp2.zip/${ARCHIVE[vol]}_jp2%2F${ARCHIVE[vol]}_${pad(page)}.jp2&ext=jpg&reduce=1`;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* ── Top bar ── */}
      <View style={styles.topbar}>
        <View>
          <Text style={styles.title}>Hayatus Sahaba</Text>
          <Text style={styles.subtitle}>Maulana Muhammad Yusuf Kandhlawi (Rah)</Text>
        </View>
        <View style={styles.volGroup}>
          {[1, 2, 3].map((v) => (
            <TouchableOpacity key={v} style={[styles.volBtn, vol === v && styles.volBtnOn]}
              onPress={() => { setVol(v); setPage(1); setShowScan(false); }}>
              <Text style={[styles.volBtnText, vol === v && styles.volBtnTextOn]}>Volume {v}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Toolbar ── */}
      <View style={styles.toolbar}>
        <View style={styles.group}>
          <TouchableOpacity style={[styles.btn, !showScan && styles.btnOn]} onPress={() => setShowScan(false)}>
            <Text style={[styles.btnText, !showScan && styles.btnTextOn]}>📖 Read</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, showScan && styles.btnOn]} onPress={() => setShowScan(true)}>
            <Text style={[styles.btnText, showScan && styles.btnTextOn]}>📄 Original page</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.group}>
          <TouchableOpacity style={[styles.btn, styles.listenBtn, state === "playing" && styles.listenBtnOn]}
            onPress={state === "playing" ? pause : play}>
            <Text style={[styles.listenText, state === "playing" && styles.listenTextOn]}>
              {state === "playing" ? "⏸ Pause" : "🔊 Listen"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Content ── */}
      <ScrollView contentContainerStyle={styles.content}>
        {showScan ? (
          <TouchableOpacity onPress={() => Linking.openURL(scanUrl)} style={styles.scanBox}>
            <Text style={styles.scanText}>Tap to open original scanned page in browser</Text>
            <Text style={styles.scanSub}>Vol {vol} · Page {page}</Text>
          </TouchableOpacity>
        ) : paragraphs.length === 0 ? (
          <Text style={styles.loading}>Loading…</Text>
        ) : (
          <View style={styles.textBox}>
            {paragraphs.map((para, i) => (
              <Text key={i} style={styles.paragraph}>{para}</Text>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Pager ── */}
      <View style={styles.pager}>
        <TouchableOpacity style={styles.btn} onPress={() => goPage(page - 1)}>
          <Text style={styles.btnText}>← Prev</Text>
        </TouchableOpacity>
        <View style={styles.pageRow}>
          <Text style={styles.pageLabel}>Page</Text>
          <TextInput
            style={styles.pageInput}
            value={pageInput}
            onChangeText={setPageInput}
            onSubmitEditing={submitPageInput}
            onBlur={submitPageInput}
            keyboardType="number-pad"
            returnKeyType="go"
          />
          <TouchableOpacity onPress={addBookmark}>
            <Text style={styles.bookmarkIcon}>🔖</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.btn} onPress={() => goPage(page + 1)}>
          <Text style={styles.btnText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },

  topbar:        { flexDirection: "row", flexWrap: "wrap", alignItems: "center",
                   justifyContent: "space-between", paddingHorizontal: 16,
                   paddingTop: 52, paddingBottom: 12,
                   borderBottomWidth: 1, borderColor: C.line, gap: 8 },
  title:         { color: C.gold, fontSize: 20, fontWeight: "700" },
  subtitle:      { color: C.muted, fontSize: 12, marginTop: 2 },
  volGroup:      { flexDirection: "row", gap: 6 },
  volBtn:        { backgroundColor: C.panel, borderWidth: 1, borderColor: C.line,
                   borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  volBtnOn:      { borderColor: C.gold },
  volBtnText:    { color: C.ink, fontSize: 12 },
  volBtnTextOn:  { color: C.gold },

  toolbar:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                   flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingVertical: 10,
                   backgroundColor: C.bg, borderBottomWidth: 1, borderColor: C.line },
  group:         { flexDirection: "row", gap: 8 },
  btn:           { backgroundColor: C.panel, borderWidth: 1, borderColor: C.line,
                   borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
  btnOn:         { borderColor: C.gold },
  btnText:       { color: C.ink, fontSize: 13 },
  btnTextOn:     { color: C.gold },
  listenBtn:     { backgroundColor: C.gold, borderColor: C.gold },
  listenBtnOn:   { backgroundColor: C.panel, borderColor: C.gold },
  listenText:    { color: C.dark, fontWeight: "600", fontSize: 13 },
  listenTextOn:  { color: C.gold },

  content:       { flexGrow: 1, padding: 16, paddingBottom: 32 },
  loading:       { color: C.muted, textAlign: "center", marginTop: 40, fontSize: 15 },
  textBox:       { backgroundColor: C.panel, borderLeftWidth: 5, borderLeftColor: C.gold,
                   paddingHorizontal: 20, paddingVertical: 18, borderRadius: 2 },
  paragraph:     { color: C.ink, fontSize: 20, lineHeight: 58, textAlign: "right", marginBottom: 4 },
  scanBox:       { backgroundColor: C.panel, borderLeftWidth: 5, borderLeftColor: C.gold,
                   padding: 32, borderRadius: 2, alignItems: "center" },
  scanText:      { color: C.ink, fontSize: 15, textAlign: "center", marginBottom: 8 },
  scanSub:       { color: C.muted, fontSize: 13 },

  pager:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                   paddingHorizontal: 16, paddingVertical: 10,
                   backgroundColor: C.bg, borderTopWidth: 1, borderColor: C.line },
  pageRow:       { flexDirection: "row", alignItems: "center", gap: 8 },
  pageLabel:     { color: C.muted, fontSize: 13 },
  pageInput:     { backgroundColor: C.panel, borderWidth: 1, borderColor: C.line,
                   borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10,
                   color: C.ink, fontSize: 14, textAlign: "center", width: 70 },
  bookmarkIcon:  { fontSize: 20 },
});
