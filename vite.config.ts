import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({ plugins:[react(), tailwindcss(), VitePWA({registerType:'autoUpdate', manifest:{name:'夏序 SummerFlow',short_name:'SummerFlow',theme_color:'#f6fbff',background_color:'#f6fbff',display:'standalone',icons:[]}})] })
