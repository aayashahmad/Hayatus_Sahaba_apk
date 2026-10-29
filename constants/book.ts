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
