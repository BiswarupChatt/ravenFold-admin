import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from "@tailwindcss/vite";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src')
		}
	},
	css: {
		modules: {
			localsConvention: 'camelCase'
		}
	},
	optimizeDeps: {
		include: ['react', 'react-dom', 'react-router-dom']
	},
	server: {
		port: 5174,
		proxy: {
			'/api': {
				target: 'http://localhost:3000',
				changeOrigin: true
			}
		}
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (!id.includes('node_modules')) return;
					if (id.includes('@mui') || id.includes('@emotion')) return 'mui';
					if (id.includes('react-dom') || id.includes('react') || id.includes('scheduler')) return 'react-vendor';
					if (id.includes('jotai')) return 'state';
					return 'vendor';
				}
			}
		}
	}
});
