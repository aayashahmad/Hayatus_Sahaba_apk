import * as FileSystem from "expo-file-system";
import { api } from "./api";
import { pageCount } from "../constants/book";

const AUDIO_DIR = `${FileSystem.documentDirectory}audio/`;
const pagePath = (vol: number, page: number) => `${AUDIO_DIR}vol${vol}/${String(page).padStart(4, "0")}.mp3`;

export async function downloadVolume(vol: number, onProgress?: (fraction: number) => void) {
  await FileSystem.makeDirectoryAsync(`${AUDIO_DIR}vol${vol}/`, { intermediates: true });
  const total = pageCount(vol);
  for (let page = 1; page <= total; page++) {
    const dest = pagePath(vol, page);
    const info = await FileSystem.getInfoAsync(dest);
    if (!info.exists) {
      const res = await FileSystem.downloadAsync(api.getAudioUrl(vol, page), dest);
      // Pages without narration return 404; don't keep the error body as an mp3.
      if (res.status !== 200) await FileSystem.deleteAsync(dest, { idempotent: true });
    }
    onProgress?.(page / total);
  }
  await FileSystem.writeAsStringAsync(`${AUDIO_DIR}vol${vol}/.complete`, "1");
}

export async function localAudioPath(vol: number, page: number): Promise<string | null> {
  const path = pagePath(vol, page);
  const info = await FileSystem.getInfoAsync(path);
  return info.exists ? path : null;
}

export async function getDownloadedVols(): Promise<number[]> {
  const result: number[] = [];
  for (const vol of [1, 2, 3]) {
    const info = await FileSystem.getInfoAsync(`${AUDIO_DIR}vol${vol}/.complete`);
    if (info.exists) result.push(vol);
  }
  return result;
}
