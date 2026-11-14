#!/usr/bin/env node
/**
 * Self-contained single-file bundler for the Royal No. 10 (1938) 3D Typewriter Studio.
 * Outputs `dist/index.html` with Three.js, Inter, and JetBrains Mono base64-inlined
 * so it runs offline straight from `file://` or any static HTTP server.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODULES = path.join(ROOT, 'node_modules');
const DIST = path.join(ROOT, 'dist');
fs.mkdirSync(DIST, {recursive: true});

const fontFaceMono = (weight) => {
  const file = path.join(
    MODULES,
    `@fontsource/jetbrains-mono/files/jetbrains-mono-latin-${weight}-normal.woff2`,
  );
  const b64 = fs.readFileSync(file).toString('base64');
  return `@font-face{font-family:'JetBrains Mono';font-weight:${weight};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
};

const interFile = path.join(
  MODULES,
  '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
);
const interB64 = fs.readFileSync(interFile).toString('base64');
const fontsCss =
  [400, 600, 700].map(fontFaceMono).join('\n') +
  `\n@font-face{font-family:'Inter';font-weight:100 900;font-style:normal;font-display:block;src:url(data:font/woff2;base64,${interB64}) format('woff2');}`;

const baseCss = `
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:#0d0b09;overflow:hidden}
#app{position:fixed;inset:0;color:#f3ede2;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;-webkit-font-smoothing:antialiased}
#gl{position:absolute;inset:0;width:100%;height:100%;display:block}
`;

const t0 = Date.now();
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, 'main.js')],
  bundle: true,
  nodePaths: [MODULES],
  format: 'esm',
  minify: !process.env.DEBUG,
  write: false,
  target: 'es2022',
  legalComments: 'none',
  logLevel: 'warning',
});

const js = result.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Royal No. 10 (1938) — 3D Mechanical Typewriter Studio</title>
<style>
${fontsCss}
${baseCss}
</style>
</head>
<body>
<div id="app"></div>
<script type="module">
${js}
</script>
</body>
</html>
`;

const outFile = path.join(DIST, 'index.html');
fs.writeFileSync(outFile, html);
console.log(`Built ${outFile} (${(html.length / 1024).toFixed(0)} KB) in ${Date.now() - t0} ms`);
