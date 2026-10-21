import { useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { api } from "../../services/api";
import { useRouter } from "expo-router";

export default function BookmarksScreen() {
  const [bookmarks, setBookmarks] = useState<{ id: number; vol: number; page: number }[]>([]);
  const router = useRouter();

  useEffect(() => {
    api.getBookmarks().then(setBookmarks).catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bookmarks</Text>
      <FlatList
        data={bookmarks}
        keyExtractor={(b) => String(b.id)}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => router.push(`/?vol=${item.vol}&page=${item.page}`)}>
            <Text style={styles.text}>Vol {item.vol} · Page {item.page}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a0a00", padding: 16 },
  title:     { color: "#c8a96e", fontSize: 22, marginBottom: 16, textAlign: "center" },
  row:       { padding: 14, borderBottomWidth: 1, borderColor: "#3a2000" },
  text:      { color: "#f5e6c8", fontSize: 16 },
});
