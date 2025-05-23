// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { builtinModules } from 'module';

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ROLLUP
if you want to view the source, please visit the GitHub repository of this plugin
*/
`;

export default {
  input: 'src/main.ts',
  external: [
    // Obsidian and Electron APIs
    'obsidian', 'electron',
    // Codemirror & Lezer
    '@codemirror/autocomplete','@codemirror/collab','@codemirror/commands',
    '@codemirror/language','@codemirror/lint','@codemirror/search',
    '@codemirror/state','@codemirror/view',
    '@lezer/common','@lezer/highlight','@lezer/lr',
    // Node built-ins
    ...builtinModules
  ],
  output: {
    file: 'main.js',
    format: 'cjs',
    sourcemap: true,
    banner,
    exports: 'auto'
  },
  plugins: [
    nodeResolve({ preferBuiltins: true }),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json', sourceMap: true })
  ]
};
