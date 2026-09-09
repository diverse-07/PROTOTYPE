import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("error", (err, req, res) => {
            if (!res.headersSent && res.writeHead) {
              res.writeHead(502, { "Content-Type": "application/json" })
              res.end(JSON.stringify({ status: "offline", error: "Backend server offline" }))
            }
          })
        }
      }
    }
  }
})