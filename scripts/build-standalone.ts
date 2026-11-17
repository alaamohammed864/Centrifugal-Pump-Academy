import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { generateAllGlbBase64Map } from '../src/engine/glbBuilder';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function main() {
  console.log('1. Running Vite production CSS build...');
  execSync('npx vite build', { cwd: rootDir, stdio: 'inherit' });

  const distAssetsDir = path.join(rootDir, 'dist', 'assets');
  const cssFile = fs
    .readdirSync(distAssetsDir)
    .find((f) => f.endsWith('.css'));
  if (!cssFile) {
    throw new Error('Could not find compiled Tailwind CSS file in dist/assets');
  }
  const compiledCss = fs.readFileSync(path.join(distAssetsDir, cssFile), 'utf8');

  console.log('2. Generating 8 embedded binary GLB 3D models in Base64...');
  const glbMap = generateAllGlbBase64Map();
  const glbJsonSafe = JSON.stringify(glbMap).replace(/</g, '\\u003c');

  console.log('3. Bundling React + Three.js + Curriculum + Simulators as inline IIFE...');
  const bundleResult = await esbuild.build({
    entryPoints: [path.join(rootDir, 'src', 'standaloneEntry.tsx')],
    bundle: true,
    minify: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    write: false,
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });

  const bundledJs = bundleResult.outputFiles[0].text.replace(/<\/script>/gi, '<\\/script>');

  const html = `<!doctype html>
<html lang="ar" dir="rtl" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>أكاديمية مضخات الطرد المركزي | Centrifugal Pump Academy</title>
    <meta name="author" content="ENG ALAA MOHAMMED" />
    <meta name="description" content="منصة تعليمية هندسية تفاعلية متكاملة لمضخات الطرد المركزي – دراسة شركة نفط البصرة" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;600&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet" />
    <style>
${compiledCss}
body { font-family: 'Cairo', 'Tahoma', 'Segoe UI', system-ui, sans-serif; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="application/json" id="embedded-glb-models-b64">${glbJsonSafe}</script>
    <script>
${bundledJs}
    </script>
  </body>
</html>
`;

  const outRoot = path.join(rootDir, 'Centrifugal_Pump_Academy.html');
  const outPublicDir = path.join(rootDir, 'public');
  if (!fs.existsSync(outPublicDir)) fs.mkdirSync(outPublicDir, { recursive: true });
  const outPublic = path.join(outPublicDir, 'Centrifugal_Pump_Academy.html');

  fs.writeFileSync(outRoot, html, 'utf8');
  fs.writeFileSync(outPublic, html, 'utf8');

  const sizeKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
  console.log(`Built standalone single-file HTML: ${outRoot} (${sizeKb} KB) & ${outPublic}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
