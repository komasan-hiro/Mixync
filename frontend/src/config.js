import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

// エミュレーター用のIPアドレス
const VPS_IP = '210.131.211.133.nip.io';

// Web: Use relative/localhost (Vite Proxy forwards to VPS)
// Native: Use direct VPS URL (CapacitorHttp bypasses CORS)
export const API_BASE_URL = isNative
    ? `http://${VPS_IP}`
    : ''; // Empty string means "same origin" (localhost), triggering Proxy

export const WS_BASE_URL = isNative
    ? `ws://${VPS_IP}`
    : 'ws://localhost:5173'; // Vite dev server handles WS proxy

console.log('[CONFIG] API_BASE_URL:', API_BASE_URL);
console.log('[CONFIG] WS_BASE_URL:', WS_BASE_URL);
console.log('[CONFIG] Platform:', Capacitor.getPlatform());
console.log('[CONFIG] isNativePlatform:', Capacitor.isNativePlatform());
// console.log('[CONFIG] Using Real Device:', useRealDevice);
