import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT — env var handling for deployment:
//
// `import.meta.env.VITE_API_URL` is read in src/api.js.
// Vite REPLACES this value at BUILD TIME, not at runtime.
// Whatever VITE_API_URL is set to when `vite build` runs gets BAKED into
// the bundle. There is no way to change it after the fact short of rebuilding.
//
// For deploys, set VITE_API_URL in one of these ways before `npm run build`:
//
//   1. Create .env.production at the repo root (recommended — committed):
//        VITE_API_URL=https://documind-api.azurewebsites.net
//
//   2. Or set it inline in PowerShell:
//        $env:VITE_API_URL = "https://documind-api.azurewebsites.net"
//        npm run build
//
// If neither is set, src/api.js falls back to 'http://localhost:8000', which
// will not work in production — every API call will hit the user's machine.
//
// Verify after build by grepping the bundle:
//   Select-String -Path dist/assets/*.js -Pattern "documind-api.azurewebsites"

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
