import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "reading_state";

type Saved = { vol: number | null; pages: Record<number, number> };

interface ReadingState extends Saved {
  ready: boolean;
  load: () => Promise<void>;
  selectVolume: (vol: number) => void;
  setPage: (vol: number, page: number) => void;
}

const persist = (s: Saved) => AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});

export const useReading = create<ReadingState>((set, get) => ({
  vol: null,
  pages: {},
  ready: false,
  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const saved: Saved = JSON.parse(raw);
        set({ vol: saved.vol ?? null, pages: saved.pages ?? {} });
      }
    } finally {
      set({ ready: true });
    }
  },
  selectVolume: (vol) => {
    set({ vol });
    persist({ vol, pages: get().pages });
  },
  setPage: (vol, page) => {
    const pages = { ...get().pages, [vol]: page };
    set({ pages });
    persist({ vol: get().vol, pages });
  },
}));
