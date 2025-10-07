import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8282,
    host: true, // 외부 접속 허용
    open: true, // 서버 시작 시 자동으로 브라우저 열기
  },
})
