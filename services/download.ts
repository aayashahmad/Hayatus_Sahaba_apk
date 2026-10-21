import * as FileSystem from "expo-file-system";
import { api } from "./api";

const AUDIO_DIR = `${FileSystem.documentDirectory}audio/`;

export async function downloadVolume(vol: number) {
  const dir = `${AUDIO_DIR}vol${vol}/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  // Fetch page list from backend (or use known page count)
  const PAGE_COUNTS = [0, 495, 683, 573]; // vol 1/2/3
  for (let page = 0; page < PAGE_COUNTS[vol]; page++) {
    const url = api.getAudioUrl(vol, page);
    const dest = `${dir}${String(page).padStart(4, "0")}.mp3`;
    const info = await FileSystem.getInfoAsync(dest);
    if (!info.exists) {
      await FileSystem.downloadAsync(url, dest);
    }
  }
}

export async function localAudioPath(vol: number, page: number): Promise<string | null> {
  const path = `${AUDIO_DIR}vol${vol}/${String(page).padStart(4, "0")}.mp3`;
  const info = await FileSystem.getInfoAsync(path);
  return info.exists ? path : null;
}

export async function getDownloadedVols(): Promise<number[]> {
  const result: number[] = [];
  for (const vol of [1, 2, 3]) {
    const dir = `${AUDIO_DIR}vol${vol}/`;
    const info = await FileSystem.getInfoAsync(dir);
    if (info.exists) result.push(vol);
  }
  return result;
}
