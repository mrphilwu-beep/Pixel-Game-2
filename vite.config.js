import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Pixel-Game-2/', // 必須跟你的 GitHub Repo 名稱一致，注意大小寫與前後斜線
})
