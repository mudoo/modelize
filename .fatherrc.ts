import { defineConfig } from 'father';

export default defineConfig({
  esm: { input: 'src/', output: 'dist/esm/' },
  cjs: { input: 'src/', output: 'dist/cjs/' },
  umd: { output: 'dist/' },
  prebundle: {
    deps: {}
  },
});
