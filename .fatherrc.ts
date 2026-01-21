import { defineConfig } from 'father';

export default defineConfig({
  esm: { input: 'src/', output: 'es/' },
  // cjs: { input: 'src/', output: 'lib/' },
  umd: { output: 'umd/' },
  prebundle: {
    deps: {}
  },
  sourcemap: true,
  targets: { chrome: 80 },
});
