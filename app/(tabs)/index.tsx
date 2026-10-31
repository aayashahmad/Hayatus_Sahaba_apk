import { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  TextInput, Image, ActivityIndicator, Keyboard,
} from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePlayer } from "../../hooks/usePlayer";
import { api } from "../../services/api";
import { useAuth } from "../../store/auth";
import { C, URDU_FONT, URDU_FONT_BOLD } from "../../constants/theme";
import { VOLUMES, ayahSpans, lastPage, scanUrl } from "../../constants/book";
import { useReading } from "../../store/reading";
import { ZoomViewer } from "../../components/ZoomViewer";

type PageData = { paragraphs: string[]; footnotes: string[] };

export default function ReaderScreen() {
  const params = useLocalSearchParams<{ vol?: string; page?: string; t?: string }>();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const { vol: selectedVol, pages: savedPages, selectVolume, setPage: savePage } = useReading();
  const vol = selectedVol ?? 1;
  const page = savedPages[vol] ?? 0;
  const setPage = useCallback(
    (next: number | ((p: number) => number)) => {
      const cur = useReading.getState().pages[vol] ?? 0;
      savePage(vol, typeof next === "function" ? next(cur) : next);
    },
    [vol, savePage]
  );
  const [pageInput, setPageInput] = useState(String(page));
  const [data, setData] = useState<PageData | null>(null);
  const [error, setError] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [scanLoading, setScanLoading] = useState(true);
  const [scanFailed, setScanFailed] = useState(false);
  const [scanAttempt, setScanAttempt] = useState(0);
  const scanLoaded = useRef(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Pages with no typed text (covers, title pages) show the scan, like the web app.
  const noText = !!data && data.paragraphs.length === 0;
  const scanMode = showScan || noText;

  const last = lastPage(vol);
  const onPageEnd = useCallback(() => setPage((p) => Math.min(p + 1, last)), [last]);
  const { state, play, pause } = usePlayer(vol, page, onPageEnd);

  // Opened from a bookmark: jump there, switching volume if needed.
  useEffect(() => {
    if (params.vol && params.page) {
      const v = Number(params.vol);
      savePage(v, Number(params.page));
      selectVolume(v);
    }
  }, [params.vol, params.page, params.t]);

  useEffect(() => setShowScan(false), [vol]);

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
    if (!scanMode) return;
    setScanLoading(true);
    setScanFailed(false);
    scanLoaded.current = false;
    const t = setTimeout(() => {
      if (scanLoaded.current) return;
      setScanLoading(false);
      setScanFailed(true);
    }, 30000);
    return () => clearTimeout(t);
  }, [scanMode, vol, page, scanAttempt]);

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

  const goPage = (n: number) => setPage(Math.min(Math.max(0, n), last));
  const submitPage = () => {
    Keyboard.dismiss();
    const n = parseInt(pageInput, 10);
    if (!isNaN(n)) goPage(n);
    else setPageInput(String(page));
  };
  const volInfo = VOLUMES.find((v) => v.id === vol);

  if (selectedVol == null) return <Redirect href="/welcome" />;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Hayatus Sahaba</Text>
            <View style={styles.metaRow}>
              <View style={styles.volPill}>
                <Text style={styles.volPillText}>Volume {vol}</Text>
              </View>
              <Text style={styles.volUrdu}>{volInfo?.urdu}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={toggleBookmark} style={styles.roundBtn} hitSlop={8}>
            <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={20} color={C.gold} />
          </TouchableOpacity>
        </View>

        <View style={styles.toolbar}>
          <View style={styles.modeGroup}>
            <TouchableOpacity
              style={[styles.chip, !scanMode && styles.chipOn, noText && styles.disabled]}
              disabled={noText}
              onPress={() => setShowScan(false)}
            >
              <Ionicons name="reader-outline" size={15} color={!scanMode ? C.gold : C.ink} />
              <Text style={[styles.chipText, !scanMode && styles.chipTextOn]}>Read</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, scanMode && styles.chipOn]} onPress={() => setShowScan(true)}>
              <Ionicons name="image-outline" size={15} color={scanMode ? C.gold : C.ink} />
              <Text style={[styles.chipText, scanMode && styles.chipTextOn]}>Original page</Text>
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
        {noText && !showScan && (
          <Text style={styles.note}>There is no typed text for this page — showing the original page.</Text>
        )}
        {scanMode && scanFailed ? (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={36} color={C.muted} />
            <Text style={styles.muted}>Couldn't load the original page.</Text>
            <Text style={[styles.muted, { fontSize: 12, textAlign: "center" }]}>Check your internet connection.</Text>
            <TouchableOpacity style={[styles.chip, styles.chipOn, { marginTop: 6 }]} onPress={() => setScanAttempt((n) => n + 1)}>
              <Ionicons name="refresh" size={15} color={C.gold} />
              <Text style={[styles.chipText, styles.chipTextOn]}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : scanMode ? (
          <TouchableOpacity activeOpacity={0.9} style={styles.scanWrap} onPress={() => setZoomOpen(true)}>
            {scanLoading && <ActivityIndicator color={C.gold} style={StyleSheet.absoluteFill} />}
            <Image
              key={`${vol}-${page}-${scanAttempt}`}
              source={{ uri: scanUrl(vol, page) }}
              style={styles.scan}
              resizeMode="contain"
              onLoad={() => { scanLoaded.current = true; setScanLoading(false); }}
              onError={() => { setScanLoading(false); setScanFailed(true); }}
            />
            {!scanLoading && (
              <View style={styles.zoomHint}>
                <Ionicons name="expand" size={14} color={C.ink} />
                <Text style={styles.zoomHintText}>Tap to zoom</Text>
              </View>
            )}
          </TouchableOpacity>
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
                <Text key={i} style={styles.paragraph}>
                  {ayahSpans(p).map((r, k) =>
                    r.ayah ? <Text key={k} style={styles.ayah}>{r.text}</Text> : r.text
                  )}
                </Text>
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

      <ZoomViewer
        visible={zoomOpen}
        vol={vol}
        page={page}
        last={last}
        onClose={() => setZoomOpen(false)}
        onPage={goPage}
      />

      {/* Pager */}
      <View style={styles.pager}>
        <TouchableOpacity style={[styles.navBtn, page <= 0 && styles.disabled]} disabled={page <= 0} onPress={() => goPage(page - 1)}>
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
  metaRow:     { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  volPill:     { backgroundColor: C.goldSoft, borderWidth: 1, borderColor: C.gold, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  volPillText: { color: C.gold, fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  volUrdu:     { fontFamily: URDU_FONT, color: C.muted, fontSize: 13, lineHeight: 30 },
  roundBtn:    { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.line, backgroundColor: C.panel, alignItems: "center", justifyContent: "center" },
  note:        { color: C.muted, fontSize: 12, textAlign: "center", backgroundColor: "rgba(0,0,0,0.18)", borderRadius: 8, padding: 10, marginBottom: 10 },

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
  ayah:        { color: C.gold, backgroundColor: C.goldSoft },
  footnotes:   { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderColor: C.line },
  footnote:    { fontFamily: URDU_FONT, color: C.muted, fontSize: 13, lineHeight: 32, textAlign: "right", writingDirection: "rtl" },

  scanWrap:    { backgroundColor: "#fff", borderRadius: 6, borderRightWidth: 4, borderRightColor: C.gold, overflow: "hidden", justifyContent: "center" },
  scan:        { width: "100%", aspectRatio: 953 / 1348 },
  zoomHint:    { position: "absolute", bottom: 10, left: 10, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(22,48,42,0.85)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  zoomHintText:{ color: C.ink, fontSize: 12 },

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
