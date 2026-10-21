import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://hayatus-sahaba-backend-1.onrender.com";
const WEB_BASE = process.env.EXPO_PUBLIC_WEB_URL ?? "https://hayatus-sahaba.vercel.app";

async function authHeader() {
  const token = await AsyncStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function get(path: string) {
  const headers = await authHeader();
  const r = await fetch(`${BASE}${path}`, { headers });
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}

async function post(path: string, body: unknown) {
  const headers = { ...(await authHeader()), "Content-Type": "application/json" };
  const r = await fetch(`${BASE}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}

export const api = {
  getText:        (vol: number, page: number) => fetch(`${WEB_BASE}/text/vol${vol}/${String(page).padStart(4, "0")}.json`).then(r => { if (!r.ok) throw new Error(`Text ${r.status}`); return r.json(); }),
  getAudioUrl:    (vol: number, page: number) => `${WEB_BASE}/audio/vol${vol}/${String(page).padStart(4, "0")}.mp3`,
  getBookmarks:   () => get("/api/bookmarks/"),
  addBookmark:    (vol: number, page: number) => post("/api/bookmarks/", { vol, page }),
  getProgress:    () => get("/api/progress/"),
  setProgress:    (vol: number, page: number) => post(`/api/progress/${vol}`, { vol, page }),
  login:          (provider: string, id_token: string) => post("/api/auth/login", { provider, id_token }),
};
