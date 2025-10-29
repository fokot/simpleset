import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';

const createConfig = (input, output) => ({
  input,
  output: {
    file: output,
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
});

export default [
  createConfig('src/dashboard-component.ts', 'dist/dashboard-component.js'),
  createConfig('src/dashboard-editor-component.ts', 'dist/dashboard-editor-component.js')
];
