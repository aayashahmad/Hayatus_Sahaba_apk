import { useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../services/api";
import { useAuth } from "../../store/auth";
import { useRouter } from "expo-router";

type Bookmark = { id?: number; vol: number; page: number };

export default function BookmarksScreen() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      api.getBookmarks().then(setBookmarks).catch(() => {});
    } else {
      AsyncStorage.getItem("local_bookmarks").then((raw) => {
        if (raw) setBookmarks(JSON.parse(raw));
      });
    }
  }, [token]);

  const goTo = (b: Bookmark) => router.push(`/?vol=${b.vol}&page=${b.page}`);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bookmarks</Text>
      {bookmarks.length === 0 ? (
        <Text style={styles.empty}>No bookmarks yet. Tap 🔖 while reading to save a page.</Text>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(b, i) => String(b.id ?? i)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => goTo(item)}>
              <Text style={styles.text}>Vol {item.vol} · Page {item.page}</Text>
            </TouchableOpacity>
          )}
        />
      )}
      {!token && (
        <Text style={styles.hint}>Sign in from Settings to sync bookmarks across devices.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a0a00", padding: 16 },
  title:     { color: "#c8a96e", fontSize: 22, marginBottom: 16, textAlign: "center", marginTop: 40 },
  empty:     { color: "#a08060", textAlign: "center", marginTop: 40, lineHeight: 24 },
  row:       { padding: 14, borderBottomWidth: 1, borderColor: "#3a2000" },
  text:      { color: "#f5e6c8", fontSize: 16 },
  hint:      { color: "#a08060", fontSize: 12, textAlign: "center", marginTop: 20, lineHeight: 18 },
});
