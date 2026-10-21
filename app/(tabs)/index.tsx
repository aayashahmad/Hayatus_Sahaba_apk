import { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  TextInput, Image, ActivityIndicator, Keyboard,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePlayer } from "../../hooks/usePlayer";
import { api } from "../../services/api";
import { useAuth } from "../../store/auth";
import { C, URDU_FONT, URDU_FONT_BOLD } from "../../constants/theme";
import { VOLUMES, pageCount, scanUrl } from "../../constants/book";

type PageData = { paragraphs: string[]; footnotes: string[] };

export default function ReaderScreen() {
  const params = useLocalSearchParams<{ vol?: string; page?: string }>();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [vol, setVol] = useState(1);
  const [page, setPage] = useState(95);
  const [pageInput, setPageInput] = useState("95");
  const [data, setData] = useState<PageData | null>(null);
  const [error, setError] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [scanLoading, setScanLoading] = useState(true);
  const [scanFailed, setScanFailed] = useState(false);
  const [scanAttempt, setScanAttempt] = useState(0);
  const scanLoaded = useRef(false);
  const [bookmarked, setBookmarked] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const last = pageCount(vol);
  const onPageEnd = useCallback(() => setPage((p) => Math.min(p + 1, last)), [last]);
  const { state, play, pause } = usePlayer(vol, page, onPageEnd);

  useEffect(() => {
    if (params.vol && params.page) {
      setVol(Number(params.vol));
      setPage(Number(params.page));
    }
  }, [params.vol, params.page]);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(false);
    setScanLoading(true);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    api.getText(vol, page)
      .then((d) => { if (!cancelled) setData({ paragraphs: d.paragraphs ?? [], footnotes: d.footnotes ?? [] }); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [vol, page]);

  useEffect(() => setPageInput(String(page)), [page]);

  // Give up after 30s on a bad connection so the user isn't stuck on a spinner.
  useEffect(() => {
    if (!showScan) return;
    setScanLoading(true);
    setScanFailed(false);
    scanLoaded.current = false;
    const t = setTimeout(() => {
      if (scanLoaded.current) return;
      setScanLoading(false);
      setScanFailed(true);
    }, 30000);
    return () => clearTimeout(t);
  }, [showScan, vol, page, scanAttempt]);

  useEffect(() => {
    AsyncStorage.getItem("local_bookmarks").then((raw) => {
      const list: { vol: number; page: number }[] = raw ? JSON.parse(raw) : [];
      setBookmarked(list.some((b) => b.vol === vol && b.page === page));
    });
  }, [vol, page]);

  useEffect(() => {
    if (!token) return;
    api.setProgress(vol, page).catch(() => {});
  }, [vol, page, token]);

  const toggleBookmark = async () => {
    const raw = await AsyncStorage.getItem("local_bookmarks");
    let list: { vol: number; page: number }[] = raw ? JSON.parse(raw) : [];
    if (bookmarked) {
      list = list.filter((b) => !(b.vol === vol && b.page === page));
    } else {
      list.push({ vol, page });
      if (token) api.addBookmark(vol, page).catch(() => {});
    }
    await AsyncStorage.setItem("local_bookmarks", JSON.stringify(list));
    setBookmarked(!bookmarked);
  };

  const goPage = (n: number) => setPage(Math.min(Math.max(1, n), last));
  const submitPage = () => {
    Keyboard.dismiss();
    const n = parseInt(pageInput, 10);
    if (!isNaN(n)) goPage(n);
    else setPageInput(String(page));
  };
  const switchVol = (v: number) => { setVol(v); setPage(1); };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Hayatus Sahaba</Text>
            <Text style={styles.subtitle}>Maulana Muhammad Yusuf Kandhlawi (Rah)</Text>
          </View>
          <TouchableOpacity onPress={toggleBookmark} style={styles.roundBtn} hitSlop={8}>
            <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={20} color={C.gold} />
          </TouchableOpacity>
        </View>

        <View style={styles.segment}>
          {VOLUMES.map(({ id }) => (
            <TouchableOpacity key={id} style={[styles.segItem, vol === id && styles.segItemOn]} onPress={() => switchVol(id)}>
              <Text style={[styles.segText, vol === id && styles.segTextOn]}>Volume {id}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.toolbar}>
          <View style={styles.modeGroup}>
            <TouchableOpacity style={[styles.chip, !showScan && styles.chipOn]} onPress={() => setShowScan(false)}>
              <Ionicons name="reader-outline" size={15} color={!showScan ? C.gold : C.ink} />
              <Text style={[styles.chipText, !showScan && styles.chipTextOn]}>Read</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, showScan && styles.chipOn]} onPress={() => setShowScan(true)}>
              <Ionicons name="image-outline" size={15} color={showScan ? C.gold : C.ink} />
              <Text style={[styles.chipText, showScan && styles.chipTextOn]}>Original page</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.listen, state === "playing" && styles.listenOn]} onPress={state === "playing" ? pause : play}>
            <Ionicons name={state === "playing" ? "pause" : "volume-high"} size={16} color={state === "playing" ? C.gold : C.dark} />
            <Text style={[styles.listenText, state === "playing" && { color: C.gold }]}>
              {state === "playing" ? "Pause" : "Listen"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {showScan && scanFailed ? (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={36} color={C.muted} />
            <Text style={styles.muted}>Couldn't load the original page.</Text>
            <Text style={[styles.muted, { fontSize: 12, textAlign: "center" }]}>Check your internet connection.</Text>
            <TouchableOpacity style={[styles.chip, styles.chipOn, { marginTop: 6 }]} onPress={() => setScanAttempt((n) => n + 1)}>
              <Ionicons name="refresh" size={15} color={C.gold} />
              <Text style={[styles.chipText, styles.chipTextOn]}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : showScan ? (
          <View style={styles.scanWrap}>
            {scanLoading && <ActivityIndicator color={C.gold} style={StyleSheet.absoluteFill} />}
            <Image
              key={`${vol}-${page}-${scanAttempt}`}
              source={{ uri: scanUrl(vol, page) }}
              style={styles.scan}
              resizeMode="contain"
              onLoad={() => { scanLoaded.current = true; setScanLoading(false); }}
              onError={() => { setScanLoading(false); setScanFailed(true); }}
            />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={36} color={C.muted} />
            <Text style={styles.muted}>This page is not available.</Text>
          </View>
        ) : !data ? (
          <ActivityIndicator color={C.gold} style={{ marginTop: 60 }} />
        ) : (
          <View style={styles.textBox}>
            {data.paragraphs.map((p, i) =>
              p.startsWith("# ") ? (
                <Text key={i} style={styles.heading}>{p.slice(2)}</Text>
              ) : (
                <Text key={i} style={styles.paragraph}>{p}</Text>
              )
            )}
            {data.footnotes.length > 0 && (
              <View style={styles.footnotes}>
                {data.footnotes.map((f, i) => (
                  <Text key={i} style={styles.footnote}>{f}</Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Pager */}
      <View style={styles.pager}>
        <TouchableOpacity style={[styles.navBtn, page <= 1 && styles.disabled]} disabled={page <= 1} onPress={() => goPage(page - 1)}>
          <Ionicons name="chevron-back" size={20} color={C.ink} />
          <Text style={styles.navText}>Previous</Text>
        </TouchableOpacity>

        <View style={styles.pageBox}>
          <TextInput
            style={styles.pageInput}
            value={pageInput}
            onChangeText={setPageInput}
            onSubmitEditing={submitPage}
            onBlur={submitPage}
            keyboardType="number-pad"
            returnKeyType="go"
            selectTextOnFocus
          />
          <Text style={styles.pageOf}>of {last}</Text>
        </View>

        <TouchableOpacity style={[styles.navBtn, page >= last && styles.disabled]} disabled={page >= last} onPress={() => goPage(page + 1)}>
          <Text style={styles.navText}>Next</Text>
          <Ionicons name="chevron-forward" size={20} color={C.ink} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },

  header:      { paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderColor: C.line, backgroundColor: C.bg },
  titleRow:    { flexDirection: "row", alignItems: "center" },
  title:       { color: C.gold, fontSize: 22, fontWeight: "700", letterSpacing: 0.3 },
  subtitle:    { color: C.muted, fontSize: 12, marginTop: 1 },
  roundBtn:    { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.line, backgroundColor: C.panel, alignItems: "center", justifyContent: "center" },

  segment:     { flexDirection: "row", backgroundColor: C.panelDeep, borderRadius: 12, padding: 4, marginTop: 12, borderWidth: 1, borderColor: C.line },
  segItem:     { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: "center" },
  segItemOn:   { backgroundColor: C.panel, borderWidth: 1, borderColor: C.gold },
  segText:     { color: C.muted, fontSize: 13, fontWeight: "600" },
  segTextOn:   { color: C.gold },

  toolbar:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  modeGroup:   { flexDirection: "row", gap: 8 },
  chip:        { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
  chipOn:      { borderColor: C.gold },
  chipText:    { color: C.ink, fontSize: 13 },
  chipTextOn:  { color: C.gold },
  listen:      { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 16, borderRadius: 10, backgroundColor: C.gold, borderWidth: 1, borderColor: C.gold },
  listenOn:    { backgroundColor: C.panel },
  listenText:  { color: C.dark, fontWeight: "700", fontSize: 13 },

  content:     { padding: 14, paddingBottom: 24, flexGrow: 1 },
  textBox:     { backgroundColor: C.panel, borderRightWidth: 4, borderRightColor: C.gold, borderRadius: 6, paddingHorizontal: 18, paddingVertical: 14 },
  heading:     { fontFamily: URDU_FONT_BOLD, color: C.gold, fontSize: 21, lineHeight: 50, textAlign: "center", marginBottom: 6 },
  paragraph:   { fontFamily: URDU_FONT, color: C.ink, fontSize: 19, lineHeight: 48, textAlign: "right", writingDirection: "rtl", marginBottom: 8 },
  footnotes:   { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderColor: C.line },
  footnote:    { fontFamily: URDU_FONT, color: C.muted, fontSize: 13, lineHeight: 32, textAlign: "right", writingDirection: "rtl" },

  scanWrap:    { backgroundColor: "#fff", borderRadius: 6, borderRightWidth: 4, borderRightColor: C.gold, overflow: "hidden", justifyContent: "center" },
  scan:        { width: "100%", aspectRatio: 0.66 },

  center:      { alignItems: "center", marginTop: 60, gap: 10 },
  muted:       { color: C.muted, fontSize: 14 },

  pager:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.bg, borderTopWidth: 1, borderColor: C.line },
  navBtn:      { flexDirection: "row", alignItems: "center", gap: 2, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line },
  navText:     { color: C.ink, fontSize: 13 },
  disabled:    { opacity: 0.4 },
  pageBox:     { flexDirection: "row", alignItems: "center", gap: 6 },
  pageInput:   { minWidth: 56, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, backgroundColor: C.panelDeep, borderWidth: 1, borderColor: C.line, color: C.gold, fontSize: 15, fontWeight: "700", textAlign: "center" },
  pageOf:      { color: C.muted, fontSize: 13 },
});
