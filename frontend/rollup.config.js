import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/hello-component.js',
  output: {
    file: 'dist/hello-component.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    nodeResolve(),
    terser({
      compress: {
        drop_console: false
      }
    })
  ]
};
