/**
 * cache.ts — Simple localStorage cache with TTL
 * Use this everywhere instead of calling API on every visit
 */

export function cacheSet(key: string, data: any, ttlMinutes = 60) {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        exp: Date.now() + ttlMinutes * 60 * 1000,
      }));
    } catch {}
  }
  
  export function cacheGet<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { data, exp } = JSON.parse(raw);
      if (Date.now() > exp) { localStorage.removeItem(key); return null; }
      return data as T;
    } catch { return null; }
  }
  
  export function cacheClear(key: string) {
    try { localStorage.removeItem(key); } catch {}
  }
  
  export function cacheClearPatient(patientId: string) {
    // Clear all cached data for a patient
    const keys = [
      `mindmap_${patientId}`,
      `timeline_${patientId}`,
      `snapshot_${patientId}`,
      `brief_${patientId}`,
      `chat_${patientId}`,
    ];
    keys.forEach(k => { try { localStorage.removeItem(k); } catch {} });
  }