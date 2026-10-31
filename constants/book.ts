const WEB_BASE = process.env.EXPO_PUBLIC_WEB_URL ?? "https://hayatus-sahaba.vercel.app";

// Pages are numbered from 0, matching the scan and text files (and the web app).
export const VOLUMES = [
  { id: 1, pages: 649, urdu: "جلد اول" },
  { id: 2, pages: 792, urdu: "جلد دوم" },
  { id: 3, pages: 719, urdu: "جلد سوم" },
];

export const pageCount = (vol: number) => VOLUMES.find((v) => v.id === vol)?.pages ?? 1;
export const lastPage = (vol: number) => pageCount(vol) - 1;

export const pad = (n: number) => String(n).padStart(4, "0");

export const scanUrl = (vol: number, page: number) => `${WEB_BASE}/scans/vol${vol}/${pad(page)}.png`;
export const scanUrlHd = (vol: number, page: number) => `${WEB_BASE}/scans-hd/vol${vol}/${pad(page)}.png`;

// Quran/Arabic passages: a word is Arabic when at least half its letters carry harakat, and a run of two or
// more such words (within a sentence) counts. Same rule as arabicFlags() in the web app's src/book.js and the
// audio generator, which voices these runs with the Arabic model. Only styling depends on this.
const MARK = /[ً-ٰٟۡ-ۭ]/g;
const LETTER = /[ء-يٱ-ۓ]/g;

function wordKind(w: string) {
  const letters = (w.match(LETTER) ?? []).length;
  const marks = (w.match(MARK) ?? []).length;
  if (!letters) return "n";
  return marks && marks / letters >= 0.5 ? "a" : "u";
}

function arabicFlags(words: string[]) {
  const kinds = words.map(wordKind);
  const flags = words.map(() => false);
  let i = 0;
  while (i < words.length) {
    if (kinds[i] !== "a") { i++; continue; }
    let j = i, count = 0, last = i;
    while (j < words.length && kinds[j] !== "u") {
      if (kinds[j] === "a") { count++; last = j; }
      j++;
    }
    if (count >= 2) for (let x = i; x <= last; x++) flags[x] = true;
    i = last + 1;
  }
  return flags;
}

/** A paragraph as runs of plain text and Quran/Arabic text, joined back it is the paragraph's words. */
export function ayahSpans(paragraph: string): { text: string; ayah: boolean }[] {
  const out: { text: string; ayah: boolean }[] = [];
  const sentences = paragraph.split(/(?<=[۔؟!])/).map((s) => s.trim()).filter(Boolean);
  for (const s of sentences) {
    const words = s.split(" ");
    const flags = arabicFlags(words);
    words.forEach((w, k) => {
      const last = out[out.length - 1];
      if (last && last.ayah === flags[k]) last.text += w + " ";
      else out.push({ text: w + " ", ayah: flags[k] });
    });
  }
  return out;
}
