import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';

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
  },
  // Element Editor component (new)
  {
    input: 'src/element-editor-component.ts',
    output: {
      file: 'dist/element-editor-component.js',
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
  }
];
