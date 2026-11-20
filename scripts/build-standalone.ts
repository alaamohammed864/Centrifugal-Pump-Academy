import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

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

  console.log('2. Bundling React + Three.js (CDN GLB Loader) + Curriculum + Simulators...');
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
    <meta name="description" content="منصة هندسية تفاعلية لدراسة مضخات الطرد المركزي (مرجع شركة نفط البصرة): 27 درساً، 17 نموذج GLB ثلاثي الأبعاد، محاكي تشغيل، منحنيات H-Q، و162 سؤالاً." />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <link rel="canonical" href="https://ais-pre-k7mnlqvcsqc3hakxwv5y5q-711537037381.europe-west2.run.app/" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="ar_IQ" />
    <meta property="og:site_name" content="أكاديمية مضخات الطرد المركزي | Centrifugal Pump Academy" />
    <meta property="og:title" content="أكاديمية مضخات الطرد المركزي | Centrifugal Pump Academy" />
    <meta property="og:description" content="منصة هندسية تفاعلية لدراسة مضخات الطرد المركزي: 27 درساً، 17 نموذج 3D GLB، محاكي تشغيل، و162 سؤالاً." />
    <meta property="og:url" content="https://ais-pre-k7mnlqvcsqc3hakxwv5y5q-711537037381.europe-west2.run.app/" />
    <meta property="og:image" content="https://ais-pre-k7mnlqvcsqc3hakxwv5y5q-711537037381.europe-west2.run.app/assets/og-pump-academy-1200x630.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="أكاديمية مضخات الطرد المركزي | Centrifugal Pump Academy" />
    <meta name="twitter:description" content="منصة هندسية تفاعلية لدراسة مضخات الطرد المركزي: 27 درساً، 17 نموذج 3D GLB، ومحاكاة تشغيلية." />
    <meta name="twitter:image" content="https://ais-pre-k7mnlqvcsqc3hakxwv5y5q-711537037381.europe-west2.run.app/assets/og-pump-academy-1200x630.jpg" />
    <link rel="icon" type="image/png" href="/assets/aistudio/___________________________________________________________a200d03d.png" />
    <link rel="apple-touch-icon" href="/assets/aistudio/___________________________________________________________a200d03d.png" />
    <meta name="theme-color" content="#0284c7" />
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
  console.log(`Built single-file HTML (CDN GLB mode, zero Base64): ${outRoot} (${sizeKb} KB) & ${outPublic}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
