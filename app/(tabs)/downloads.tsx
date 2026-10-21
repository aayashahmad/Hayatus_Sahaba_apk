import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DownloadJob, deleteVolume, getDownloadedVols, partialProgress } from "../../services/download";
import { ScreenHeader } from "../../components/ScreenHeader";
import { C } from "../../constants/theme";
import { VOLUMES } from "../../constants/book";

export default function DownloadsScreen() {
  const [downloading, setDownloading] = useState<number | null>(null);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [downloaded, setDownloaded] = useState<number[]>([]);
  const job = useRef<DownloadJob | null>(null);

  const refresh = async () => {
    setDownloaded(await getDownloadedVols());
    const p: Record<number, number> = {};
    for (const { id } of VOLUMES) p[id] = await partialProgress(id);
    setProgress(p);
  };

  useEffect(() => {
    refresh();
    return () => { job.current?.cancel(); };
  }, []);

  const start = async (vol: number) => {
    const j = new DownloadJob();
    job.current = j;
    setDownloading(vol);
    try {
      const done = await j.run(vol, (f) => setProgress((p) => ({ ...p, [vol]: f })));
      if (done) setDownloaded((d) => [...new Set([...d, vol])]);
      else refresh();
    } catch {
      Alert.alert("Download stopped", "Check your internet connection and try again.");
    } finally {
      job.current = null;
      setDownloading(null);
    }
  };

  const cancel = () => job.current?.cancel();

  const remove = (vol: number) =>
    Alert.alert(`Remove Volume ${vol}?`, "The offline audio for this volume will be deleted.", [
      { text: "Keep", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => { await deleteVolume(vol); refresh(); } },
    ]);

  return (
    <View style={styles.root}>
      <ScreenHeader title="Offline Audio" subtitle="Listen without internet" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {VOLUMES.map(({ id, pages }) => {
          const done = downloaded.includes(id);
          const busy = downloading === id;
          const pct = Math.round((progress[id] ?? 0) * 100);
          const partial = !done && !busy && pct > 0;
          return (
            <View key={id} style={styles.card}>
              <View style={styles.badge}>
                <Ionicons name="headset-outline" size={20} color={C.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Volume {id}</Text>
                <Text style={styles.cardSub}>
                  {busy ? `Downloading… ${pct}%` : done ? "Available offline" : partial ? `Paused at ${pct}%` : `${pages} pages`}
                </Text>
                {(busy || partial) && (
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${pct}%` }]} />
                  </View>
                )}
              </View>

              {busy ? (
                <TouchableOpacity style={styles.cancelBtn} onPress={cancel}>
                  <Ionicons name="close" size={16} color={C.ink} />
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              ) : done ? (
                <TouchableOpacity style={styles.doneBtn} onPress={() => remove(id)}>
                  <Ionicons name="checkmark-circle" size={18} color={C.gold} />
                  <Text style={styles.doneText}>Saved</Text>
                  <Ionicons name="trash-outline" size={15} color={C.muted} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.btn, downloading !== null && { opacity: 0.4 }]}
                  disabled={downloading !== null}
                  onPress={() => start(id)}
                >
                  <Ionicons name={partial ? "play" : "download-outline"} size={16} color={C.dark} />
                  <Text style={styles.btnText}>{partial ? "Resume" : "Download"}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
        <Text style={styles.note}>Each volume is large. Use Wi-Fi when downloading.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },
  card:       { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.panel, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.line },
  badge:      { width: 42, height: 42, borderRadius: 10, backgroundColor: C.goldSoft, borderWidth: 1, borderColor: C.gold, alignItems: "center", justifyContent: "center" },
  cardTitle:  { color: C.ink, fontSize: 15, fontWeight: "600" },
  cardSub:    { color: C.muted, fontSize: 12, marginTop: 2 },
  track:      { height: 4, backgroundColor: C.panelDeep, borderRadius: 2, marginTop: 8, overflow: "hidden" },
  fill:       { height: 4, backgroundColor: C.gold },
  btn:        { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.gold, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  btnText:    { color: C.dark, fontWeight: "700", fontSize: 13 },
  cancelBtn:  { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.panelDeep, borderWidth: 1, borderColor: C.line, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  cancelText: { color: C.ink, fontWeight: "600", fontSize: 13 },
  doneBtn:    { flexDirection: "row", alignItems: "center", gap: 4 },
  doneText:   { color: C.gold, fontWeight: "600", fontSize: 13 },
  note:       { color: C.muted, fontSize: 12, textAlign: "center", marginTop: 8 },
});
