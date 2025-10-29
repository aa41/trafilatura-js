import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  // UMD build for browsers
  {
    input: 'src/index.js',
    output: {
      name: 'Trafilatura',
      file: 'dist/trafilatura.umd.js',
      format: 'umd',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
      }),
      production && terser(),
    ],
  },
  // ESM build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/trafilatura.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      production && terser(),
    ],
  },
  // CommonJS build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/trafilatura.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      resolve(),
      commonjs(),
      production && terser(),
    ],
  },
];

