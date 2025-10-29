import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';

export default {
  input: 'src/dashboard-component.ts',
  output: {
    file: 'dist/dashboard-component.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true
    }),
    typescript({
      tsconfig: './tsconfig.json'
    }),
    nodeResolve({
      browser: true,
      preferBuiltins: false
    }),
    terser({
      compress: {
        drop_console: false
      }
    })
  ]
};
