import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { api } from "../../services/api";
import { useAuth } from "../../store/auth";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
});

export default function SettingsScreen() {
  const { token, setToken, loadToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    loadToken();
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  const loginGoogle = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const { data } = await GoogleSignin.signIn();
      if (!data?.idToken) throw new Error("No ID token");
      const res = await api.login("google", data.idToken);
      await setToken(res.access_token);
      Alert.alert("Signed in", `Welcome ${data.user.name}`);
    } catch (e: any) {
      if (e.code !== "SIGN_IN_CANCELLED") Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const loginApple = async () => {
    try {
      setLoading(true);
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const res = await api.login("apple", cred.identityToken!);
      await setToken(res.access_token);
      Alert.alert("Signed in with Apple");
    } catch (e: any) {
      if (e.code !== "ERR_CANCELED") Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await setToken(null);
    try { await GoogleSignin.signOut(); } catch {}
    Alert.alert("Signed out");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {loading && <ActivityIndicator color="#c8a96e" style={{ marginBottom: 20 }} />}

      {token ? (
        <>
          <Text style={styles.status}>✓ Signed in</Text>
          <TouchableOpacity style={[styles.btn, styles.logout]} onPress={logout}>
            <Text style={styles.btnText}>Sign Out</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.hint}>Sign in to sync bookmarks and progress across devices.</Text>
          <TouchableOpacity style={styles.btn} onPress={loginGoogle} disabled={loading}>
            <Text style={styles.btnText}>Continue with Google</Text>
          </TouchableOpacity>
          {appleAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={8}
              style={styles.appleBtn}
              onPress={loginApple}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a0a00", padding: 24, alignItems: "center", justifyContent: "center" },
  title:     { color: "#c8a96e", fontSize: 24, fontWeight: "bold", marginBottom: 32 },
  hint:      { color: "#a08060", fontSize: 14, textAlign: "center", marginBottom: 24, lineHeight: 22 },
  status:    { color: "#c8a96e", fontSize: 16, marginBottom: 24 },
  btn:       { backgroundColor: "#c8a96e", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10, marginBottom: 16, width: "100%" },
  logout:    { backgroundColor: "#3a2000" },
  btnText:   { color: "#1a0a00", fontWeight: "bold", textAlign: "center", fontSize: 16 },
  appleBtn:  { width: "100%", height: 50, marginBottom: 16 },
});
