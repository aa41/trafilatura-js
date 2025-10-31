import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  // Browser-friendly UMD build
  {
    input: 'src/index.js',
    output: {
      name: 'Trafilatura',
      file: 'dist/trafilatura.browser.js',
      format: 'umd',
      sourcemap: true,
      exports: 'named'  // 使用命名导出
    },
    plugins: [
      resolve({
        browser: true
      }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', {
            targets: {
              browsers: ['> 1%', 'last 2 versions', 'not dead']
            }
          }]
        ]
      })
    ]
  },
  
  // Minified browser build
  {
    input: 'src/index.js',
    output: {
      name: 'Trafilatura',
      file: 'dist/trafilatura.browser.min.js',
      format: 'umd',
      sourcemap: true,
      exports: 'named'  // 使用命名导出
    },
    plugins: [
      resolve({
        browser: true
      }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', {
            targets: {
              browsers: ['> 1%', 'last 2 versions', 'not dead']
            }
          }]
        ]
      }),
      terser()
    ]
  },
  
  // ES module build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/trafilatura.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      resolve({
        browser: true
      }),
      commonjs()
    ]
  },
  
  // CommonJS build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/trafilatura.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'  // 使用命名导出
    },
    plugins: [
      resolve({
        browser: true
      }),
      commonjs()
    ]
  }
];

