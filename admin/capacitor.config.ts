import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kz.mazir.admin',
  appName: 'Mazir Admin',
  webDir: 'public',
  bundledWebRuntime: false,
  server: {
    // === МЫНА ЖЕРГЕ ӨЗ СІЛТЕМЕҢІЗДІ ЖАЗЫҢЫЗ ===
    // Мысалы: https://cafeadminis.mazirapp.kz 
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
