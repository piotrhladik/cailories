/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Główna konfiguracja Vite + integracja PWA (manifest + service worker).
// Aplikacja jest Mobile-First, dlatego serwujemy budowę w katalogu 'dist'.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192-maskable.png', 'icons/icon-512-maskable.png'],
      manifest: false, // manifest dostarczamy ręcznie w /public/manifest.webmanifest
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
  },
});