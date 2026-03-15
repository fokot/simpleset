import { defineConfig } from 'vite';
import { resolve } from 'path';

const entryNames = [
  'hello-component',
  'dashboard-component',
  'datasource-manager',
  'dashboard-editor-component',
  'main-page',
];

const entries = Object.fromEntries(
  entryNames.map(name => [name, resolve(__dirname, `src/${name}.ts`)]),
);

export default defineConfig({
  root: resolve(__dirname, '../examples'),

  plugins: [{
    name: 'serve-frontend-src',
    resolveId(id) {
      if (id.startsWith('/frontend/dist/')) {
        const name = id.replace('/frontend/dist/', '').replace('.js', '');
        return resolve(__dirname, `src/${name}.ts`);
      }
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
      entry: entries,
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
