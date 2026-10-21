const ITEM = "hayat-us-sahaba-3volumes";

export const VOLUMES = [
  { id: 1, pages: 649 },
  { id: 2, pages: 792 },
  { id: 3, pages: 719 },
];

export const pageCount = (vol: number) => VOLUMES.find((v) => v.id === vol)?.pages ?? 1;

export const pad = (n: number) => String(n).padStart(4, "0");

export function scanUrl(vol: number, page: number) {
  const base = `Hayat-us-Sahaba_Vol${vol}`;
  return `https://archive.org/download/${ITEM}/${base}_jp2.zip/${base}_jp2%2F${base}_${pad(page)}.jp2&ext=jpg&reduce=1`;
}
