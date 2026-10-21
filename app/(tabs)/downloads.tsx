import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { downloadVolume, getDownloadedVols } from "../../services/download";
import { ScreenHeader } from "../../components/ScreenHeader";
import { C } from "../../constants/theme";
import { VOLUMES } from "../../constants/book";

export default function DownloadsScreen() {
  const [downloading, setDownloading] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [downloaded, setDownloaded] = useState<number[]>([]);

  useEffect(() => {
    getDownloadedVols().then(setDownloaded);
  }, []);

  const handleDownload = async (vol: number) => {
    setDownloading(vol);
    setProgress(0);
    try {
      await downloadVolume(vol, setProgress);
      setDownloaded((d) => [...new Set([...d, vol])]);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Offline Audio" subtitle="Listen without internet" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {VOLUMES.map(({ id, pages }) => {
          const done = downloaded.includes(id);
          const busy = downloading === id;
          return (
            <View key={id} style={styles.card}>
              <View style={styles.badge}>
                <Ionicons name="headset-outline" size={20} color={C.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Volume {id}</Text>
                <Text style={styles.cardSub}>
                  {busy ? `Downloading… ${Math.round(progress * 100)}%` : done ? "Available offline" : `${pages} pages`}
                </Text>
                {busy && (
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${progress * 100}%` }]} />
                  </View>
                )}
              </View>
              {done ? (
                <View style={styles.doneBtn}>
                  <Ionicons name="checkmark-circle" size={18} color={C.gold} />
                  <Text style={styles.doneText}>Saved</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.btn, (busy || downloading !== null) && { opacity: 0.5 }]}
                  disabled={downloading !== null}
                  onPress={() => handleDownload(id)}
                >
                  <Ionicons name="download-outline" size={16} color={C.dark} />
                  <Text style={styles.btnText}>Download</Text>
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
  root:      { flex: 1, backgroundColor: C.bg },
  card:      { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.panel, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.line },
  badge:     { width: 42, height: 42, borderRadius: 10, backgroundColor: C.goldSoft, borderWidth: 1, borderColor: C.gold, alignItems: "center", justifyContent: "center" },
  cardTitle: { color: C.ink, fontSize: 15, fontWeight: "600" },
  cardSub:   { color: C.muted, fontSize: 12, marginTop: 2 },
  track:     { height: 4, backgroundColor: C.panelDeep, borderRadius: 2, marginTop: 8, overflow: "hidden" },
  fill:      { height: 4, backgroundColor: C.gold },
  btn:       { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.gold, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  btnText:   { color: C.dark, fontWeight: "700", fontSize: 13 },
  doneBtn:   { flexDirection: "row", alignItems: "center", gap: 4 },
  doneText:  { color: C.gold, fontWeight: "600", fontSize: 13 },
  note:      { color: C.muted, fontSize: 12, textAlign: "center", marginTop: 8 },
});
