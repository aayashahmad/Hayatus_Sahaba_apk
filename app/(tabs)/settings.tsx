import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../store/auth";

export default function SettingsScreen() {
  const { token, setToken, loadToken } = useAuth();

  useEffect(() => {
    loadToken();
  }, []);

  const logout = async () => {
    await setToken(null);
    Alert.alert("Signed out");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {token ? (
        <>
          <Text style={styles.status}>✓ Signed in</Text>
          <TouchableOpacity style={[styles.btn, styles.logout]} onPress={logout}>
            <Text style={styles.btnText}>Sign Out</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.hint}>
            Sign in with Google or Apple to sync bookmarks and reading progress across devices.
          </Text>
          <View style={styles.note}>
            <Text style={styles.noteText}>
              Google & Apple sign-in will be available in the full app build (APK/IPA).
            </Text>
          </View>
        </>
      )}

      <View style={styles.info}>
        <Text style={styles.infoLabel}>Backend</Text>
        <Text style={styles.infoValue}>Render.com</Text>
        <Text style={styles.infoLabel}>Text</Text>
        <Text style={styles.infoValue}>Vercel CDN</Text>
        <Text style={styles.infoLabel}>Version</Text>
        <Text style={styles.infoValue}>1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a0a00", padding: 24 },
  title:     { color: "#c8a96e", fontSize: 24, fontWeight: "bold", marginBottom: 32, textAlign: "center", marginTop: 40 },
  hint:      { color: "#a08060", fontSize: 14, textAlign: "center", marginBottom: 20, lineHeight: 22 },
  status:    { color: "#c8a96e", fontSize: 16, marginBottom: 24, textAlign: "center" },
  btn:       { backgroundColor: "#c8a96e", paddingVertical: 14, borderRadius: 10, marginBottom: 16 },
  logout:    { backgroundColor: "#3a2000" },
  btnText:   { color: "#1a0a00", fontWeight: "bold", textAlign: "center", fontSize: 16 },
  note:      { backgroundColor: "#2a1500", borderRadius: 10, padding: 16, marginBottom: 32 },
  noteText:  { color: "#a08060", fontSize: 13, textAlign: "center", lineHeight: 20 },
  info:      { backgroundColor: "#2a1500", borderRadius: 10, padding: 16, gap: 8 },
  infoLabel: { color: "#a08060", fontSize: 12, marginTop: 6 },
  infoValue: { color: "#f5e6c8", fontSize: 14 },
});
