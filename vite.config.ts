import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// PUBLIC_BASE lets a host serve the app under a sub-path (e.g. /sapori/).
// Defaults to '/' for Vercel/root deployments.
const base = (typeof process !== "undefined" && process.env && process.env.PUBLIC_BASE) || "/"

export default defineConfig({
  base,
  plugins: [react()],
})
