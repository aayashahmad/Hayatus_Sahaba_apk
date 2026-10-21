import { useCallback, useState } from "react";
import { FlatList, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenHeader } from "../../components/ScreenHeader";
import { C } from "../../constants/theme";

type Bookmark = { vol: number; page: number };

export default function BookmarksScreen() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("local_bookmarks").then((raw) => {
        const list: Bookmark[] = raw ? JSON.parse(raw) : [];
        setBookmarks(list.sort((a, b) => a.vol - b.vol || a.page - b.page));
      });
    }, [])
  );

  const remove = async (b: Bookmark) => {
    const next = bookmarks.filter((x) => !(x.vol === b.vol && x.page === b.page));
    setBookmarks(next);
    await AsyncStorage.setItem("local_bookmarks", JSON.stringify(next));
  };

  const open = (b: Bookmark) =>
    router.navigate({ pathname: "/", params: { vol: String(b.vol), page: String(b.page) } });

  return (
    <View style={styles.root}>
      <ScreenHeader title="Bookmarks" subtitle={`${bookmarks.length} saved page${bookmarks.length === 1 ? "" : "s"}`} />
      {bookmarks.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bookmark-outline" size={34} color={C.gold} />
          </View>
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptyText}>Tap the bookmark icon at the top of the reader to save a page.</Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          keyExtractor={(b) => `${b.vol}-${b.page}`}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => open(item)} activeOpacity={0.75}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.vol}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Volume {item.vol}</Text>
                <Text style={styles.cardSub}>Page {item.page}</Text>
              </View>
              <TouchableOpacity onPress={() => remove(item)} hitSlop={10} style={styles.del}>
                <Ionicons name="trash-outline" size={18} color={C.muted} />
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color={C.gold} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },
  empty:      { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIcon:  { width: 72, height: 72, borderRadius: 36, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { color: C.ink, fontSize: 17, fontWeight: "600", marginBottom: 6 },
  emptyText:  { color: C.muted, fontSize: 14, textAlign: "center", lineHeight: 21 },
  card:       { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.panel, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.line },
  badge:      { width: 40, height: 40, borderRadius: 10, backgroundColor: C.goldSoft, borderWidth: 1, borderColor: C.gold, alignItems: "center", justifyContent: "center" },
  badgeText:  { color: C.gold, fontSize: 16, fontWeight: "700" },
  cardTitle:  { color: C.ink, fontSize: 15, fontWeight: "600" },
  cardSub:    { color: C.muted, fontSize: 13, marginTop: 2 },
  del:        { padding: 4, marginRight: 4 },
});
