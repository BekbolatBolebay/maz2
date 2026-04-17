import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kz.mazir.admin',
  appName: 'Mazir Admin',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    // === МЫНА ЖЕРГЕ ӨЗ СІЛТЕМЕҢІЗДІ ЖАЗЫҢЫЗ ===
    // Мысалы: https://admin.mazir.kz немесе https://mazir-admin.vercel.app
    url: 'https://cafeadminis.mazirapp.kz',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
