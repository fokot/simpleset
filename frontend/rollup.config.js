import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default [
  // Hello component (existing)
  {
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
  },
  // Dashboard component (new)
  {
    input: 'src/dashboard-component.ts',
    output: {
      file: 'dist/dashboard-component.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json'
      }),
      nodeResolve(),
      terser({
        compress: {
          drop_console: false
        }
      })
    ]
  }
];
