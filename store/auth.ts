import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  token: string | null;
  setToken: (token: string | null) => Promise<void>;
  loadToken: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  setToken: async (token) => {
    if (token) await AsyncStorage.setItem("token", token);
    else await AsyncStorage.removeItem("token");
    set({ token });
  },
  loadToken: async () => {
    const token = await AsyncStorage.getItem("token");
    set({ token });
  },
}));
