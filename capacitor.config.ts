import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.engalaamohammed.pumpacademy',
  appName: 'Pump Academy',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#020617',
    allowMixedContent: false,
  },
};

export default config;
