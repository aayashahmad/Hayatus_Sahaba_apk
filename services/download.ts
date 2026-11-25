import * as FileSystem from "expo-file-system";
import { api } from "./api";
import { pageCount } from "../constants/book";

const AUDIO_DIR = `${FileSystem.documentDirectory}audio/`;
const volDir = (vol: number) => `${AUDIO_DIR}vol${vol}/`;
const pagePath = (vol: number, page: number) => `${volDir(vol)}${String(page).padStart(4, "0")}.mp3`;
// Fingerprint of every page saved on this phone ({page: hash}), compared with the site's audio manifest.
const localManifestPath = (vol: number) => `${volDir(vol)}.manifest.json`;

const CANCELLED = Symbol("cancelled");
const FILE_TIMEOUT_MS = 60000;

// The site's fingerprints of every page's audio ({vol: {page: hash}}). Fetched once per app session; null when
// offline (then saved pages are used as they are).
type Manifest = Record<string, Record<string, string>>;
let remote: Promise<Manifest | null> | null = null;

export function remoteManifest(refresh = false): Promise<Manifest | null> {
  if (!remote || refresh) {
    const p = api.getAudioManifest().then((m) => m.pages as Manifest).catch(() => null);
    remote = p;
    // A failed fetch (offline) is retried next time instead of being remembered.
    p.then((m) => { if (!m && remote === p) remote = null; });
  }
  return remote;
}

async function readLocal(vol: number): Promise<Record<string, string>> {
  try {
    return JSON.parse(await FileSystem.readAsStringAsync(localManifestPath(vol)));
  } catch {
    return {}; // downloaded before manifests existed: every page counts as out of date
  }
}

const writeLocal = (vol: number, local: Record<string, string>) =>
  FileSystem.writeAsStringAsync(localManifestPath(vol), JSON.stringify(local));

export class DownloadJob {
  cancelled = false;
  private onCancel: (() => void) | null = null;
  private cancelSignal = new Promise<typeof CANCELLED>((resolve) => {
    this.onCancel = () => resolve(CANCELLED);
  });

  // Downloads the pages that are missing or changed on the site, and deletes pages that no longer have audio.
  // Also used to update a volume that is already saved: unchanged pages are skipped.
  async run(vol: number, onProgress?: (fraction: number) => void): Promise<boolean> {
    await FileSystem.makeDirectoryAsync(volDir(vol), { intermediates: true });
    const site = (await remoteManifest(true))?.[String(vol)] ?? null;
    const local = await readLocal(vol);
    const total = pageCount(vol);
    for (let page = 0; page < total; page++) {
      if (this.cancelled) break;
      const key = String(page);
      const dest = pagePath(vol, page);
      const want = site?.[key];
      const info = await FileSystem.getInfoAsync(dest);
      if (site && !want) {
        // The site has no audio for this page (any more): don't keep an old recording of it.
        if (info.exists) await FileSystem.deleteAsync(dest, { idempotent: true });
        delete local[key];
      } else if (!info.exists || (site && local[key] !== want)) {
        const part = `${dest}.part`;
        const timeout = new Promise<null>((r) => setTimeout(() => r(null), FILE_TIMEOUT_MS));
        const res = await Promise.race([
          FileSystem.downloadAsync(api.getAudioUrl(vol, page), part).catch(() => null),
          timeout,
          this.cancelSignal,
        ]);
        if (res === CANCELLED) {
          await FileSystem.deleteAsync(part, { idempotent: true });
          break;
        }
        // Pages without narration return 404; don't keep the error body as an mp3.
        if (res && res.status === 200) {
          await FileSystem.moveAsync({ from: part, to: dest });
          if (want) local[key] = want;
        } else {
          await FileSystem.deleteAsync(part, { idempotent: true });
        }
      }
      if (page % 25 === 0) await writeLocal(vol, local); // so a resumed download keeps what it already has
      onProgress?.((page + 1) / total);
    }
    await writeLocal(vol, local);
    if (this.cancelled) return false;
    await FileSystem.writeAsStringAsync(`${volDir(vol)}.complete`, "1");
    return true;
  }

  cancel() {
    this.cancelled = true;
    this.onCancel?.();
  }
}

// How many pages of a saved volume differ from the site (changed, new, or no longer narrated). 0 when offline.
export async function pagesToUpdate(vol: number): Promise<number> {
  const site = (await remoteManifest())?.[String(vol)];
  if (!site) return 0;
  const info = await FileSystem.getInfoAsync(volDir(vol));
  if (!info.exists) return 0;
  const local = await readLocal(vol);
  const saved = new Set(
    (await FileSystem.readDirectoryAsync(volDir(vol))).filter((f) => f.endsWith(".mp3")).map((f) => String(parseInt(f, 10))),
  );
  let n = 0;
  for (const p of saved) if (site[p] !== local[p]) n++;      // changed, or no audio on the site any more
  for (const p of Object.keys(site)) if (!saved.has(p)) n++; // narrated since the volume was saved
  return n;
}

export async function partialProgress(vol: number): Promise<number> {
  const dir = volDir(vol);
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) return 0;
  const files = await FileSystem.readDirectoryAsync(dir);
  return files.filter((f) => f.endsWith(".mp3")).length / pageCount(vol);
}

export async function deleteVolume(vol: number) {
  await FileSystem.deleteAsync(volDir(vol), { idempotent: true });
}

// The saved file for a page, or null to stream it. A saved page that is out of date is not used while the site
// can be reached, so listeners always hear the current recording; offline, the saved page is played.
export async function localAudioPath(vol: number, page: number): Promise<string | null> {
  const path = pagePath(vol, page);
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return null;
  const site = (await remoteManifest())?.[String(vol)];
  if (site && site[String(page)] !== (await readLocal(vol))[String(page)]) return null;
  return path;
}

export async function getDownloadedVols(): Promise<number[]> {
  const result: number[] = [];
  for (const vol of [1, 2, 3]) {
    const info = await FileSystem.getInfoAsync(`${volDir(vol)}.complete`);
    if (info.exists) result.push(vol);
  }
  return result;
}
