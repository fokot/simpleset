import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, '../examples'),

  plugins: [{
    name: 'serve-frontend-dist',
    configureServer(server) {
      const distDir = resolve(__dirname, 'dist');
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith('/frontend/dist/')) {
          req.url = '/@fs/' + distDir + req.url.replace('/frontend/dist', '');
        }
        next();
      });
    },
  }],

  server: {
    fs: {
      allow: [resolve(__dirname, '..')],
    },
  },

  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    lib: {
      entry: {
        'hello-component': resolve(__dirname, 'src/hello-component.js'),
        'dashboard-component': resolve(__dirname, 'src/dashboard-component.ts'),
        'datasource-manager': resolve(__dirname, 'src/datasource-manager.ts'),
        'dashboard-editor-component': resolve(__dirname, 'src/editor/index.ts'),
      },
      formats: ['es'],
    },
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
    },
  },

  resolve: {
    alias: {
      zod: resolve(__dirname, 'node_modules/zod'),
    },
  },
});
