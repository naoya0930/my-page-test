import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // 1. Reactを正常に動かすためのプラグインを設定
  plugins: [react()],

  // 2. Docker環境（ローカル）で快適に動かすための設定
  server: {
    host: true,         // Dockerコンテナの外（ホストPC）からアクセスできるようにする
    port: 5173,         // 起動ポートを5173に固定
    watch: {
      usePolling: true  // WindowsやMacのDocker環境でも、コードの変更（ホットリロード）を確実に検知する
    }
  }
})