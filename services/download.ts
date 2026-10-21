import * as FileSystem from "expo-file-system";
import { api } from "./api";
import { pageCount } from "../constants/book";

const AUDIO_DIR = `${FileSystem.documentDirectory}audio/`;
const pagePath = (vol: number, page: number) => `${AUDIO_DIR}vol${vol}/${String(page).padStart(4, "0")}.mp3`;

const CANCELLED = Symbol("cancelled");
const FILE_TIMEOUT_MS = 60000;

export class DownloadJob {
  cancelled = false;
  private onCancel: (() => void) | null = null;
  private cancelSignal = new Promise<typeof CANCELLED>((resolve) => {
    this.onCancel = () => resolve(CANCELLED);
  });

  async run(vol: number, onProgress?: (fraction: number) => void): Promise<boolean> {
    await FileSystem.makeDirectoryAsync(`${AUDIO_DIR}vol${vol}/`, { intermediates: true });
    const total = pageCount(vol);
    for (let page = 1; page <= total; page++) {
      if (this.cancelled) return false;
      const dest = pagePath(vol, page);
      const info = await FileSystem.getInfoAsync(dest);
      if (!info.exists) {
        const timeout = new Promise<null>((r) => setTimeout(() => r(null), FILE_TIMEOUT_MS));
        const res = await Promise.race([
          FileSystem.downloadAsync(api.getAudioUrl(vol, page), dest).catch(() => null),
          timeout,
          this.cancelSignal,
        ]);
        if (res === CANCELLED) {
          await FileSystem.deleteAsync(dest, { idempotent: true });
          return false;
        }
        // Pages without narration return 404; don't keep the error body as an mp3.
        if (!res || res.status !== 200) await FileSystem.deleteAsync(dest, { idempotent: true });
      }
      onProgress?.(page / total);
    }
    await FileSystem.writeAsStringAsync(`${AUDIO_DIR}vol${vol}/.complete`, "1");
    return true;
  }

  cancel() {
    this.cancelled = true;
    this.onCancel?.();
  }
}

export async function partialProgress(vol: number): Promise<number> {
  const dir = `${AUDIO_DIR}vol${vol}/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) return 0;
  const files = await FileSystem.readDirectoryAsync(dir);
  return files.filter((f) => f.endsWith(".mp3")).length / pageCount(vol);
}

export async function deleteVolume(vol: number) {
  await FileSystem.deleteAsync(`${AUDIO_DIR}vol${vol}/`, { idempotent: true });
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
