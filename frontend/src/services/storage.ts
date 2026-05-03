/**
 * Cross-platform key-value storage.
 * - Native (iOS / Android): expo-secure-store (loaded lazily to avoid web crash)
 * - Web: localStorage (not encrypted, acceptable for dev/preview)
 */
import { Platform } from 'react-native';

// Lazy-load SecureStore only on native to avoid module crash on web
let _secureStore: typeof import('expo-secure-store') | null = null;
async function getSecureStore() {
  if (_secureStore) return _secureStore;
  _secureStore = await import('expo-secure-store');
  return _secureStore;
}

export const storage = {
  async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    const ss = await getSecureStore();
    return ss.getItemAsync(key);
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    const ss = await getSecureStore();
    return ss.setItemAsync(key, value);
  },

  async deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    const ss = await getSecureStore();
    return ss.deleteItemAsync(key);
  },
};
