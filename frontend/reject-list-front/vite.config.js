import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react()],
	server: {
		port: 5000,
		host: '127.0.0.1',
		strictPort: true,
		proxy: {
			// Anything starting with /api goes to Django
			'/api': {
				target: 'http://127.0.0.1:7000',
				changeOrigin: true,
			},
		},
	},
})
