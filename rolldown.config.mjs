import { defineConfig } from 'rolldown';

export default defineConfig({
  input: 'scripts/init.js',
  external: id => id.includes('cyberpunk-red-core'),
  output: {
    format: 'esm',
    file: 'scripts/token-action-hud-template.min.js',
    minify: true,
  },
});
