import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from "url";

console.log(fileURLToPath(new URL('../shell/pkg/rancher-components/src/components', import.meta.url)));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('../', import.meta.url)) },
      { find: '@shell', replacement: fileURLToPath(new URL('../shell', import.meta.url)) },
      { find: '@pkg', replacement: fileURLToPath(new URL('../shell/pkg', import.meta.url)) },
      { find: '@components', replacement: fileURLToPath(new URL('../pkg/rancher-components/src/components', import.meta.url)) },
    ]
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@shell/assets/styles/app.scss" as *;',
      },
    },
  },
})
