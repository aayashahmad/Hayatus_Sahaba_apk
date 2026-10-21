import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { downloadVolume, getDownloadedVols } from "../../services/download";

export default function DownloadsScreen() {
  const [downloading, setDownloading] = useState<number | null>(null);
  const [downloaded, setDownloaded] = useState<number[]>([]);

  const handleDownload = async (vol: number) => {
    setDownloading(vol);
    await downloadVolume(vol);
    setDownloaded((d) => [...d, vol]);
    setDownloading(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offline Download</Text>
      {[1, 2, 3].map((vol) => (
        <View key={vol} style={styles.row}>
          <Text style={styles.label}>Volume {vol}</Text>
          {downloading === vol ? (
            <ActivityIndicator color="#c8a96e" />
          ) : (
            <TouchableOpacity style={styles.btn} onPress={() => handleDownload(vol)} disabled={downloaded.includes(vol)}>
              <Text style={styles.btnText}>{downloaded.includes(vol) ? "✓ Saved" : "Download"}</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a0a00", padding: 24 },
  title:     { color: "#c8a96e", fontSize: 22, marginBottom: 24, textAlign: "center" },
  row:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, padding: 16, backgroundColor: "#2a1500", borderRadius: 10 },
  label:     { color: "#f5e6c8", fontSize: 16 },
  btn:       { backgroundColor: "#c8a96e", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  btnText:   { color: "#1a0a00", fontWeight: "bold" },
});
