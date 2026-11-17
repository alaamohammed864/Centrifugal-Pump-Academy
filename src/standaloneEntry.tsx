import { createRoot } from 'react-dom/client';
import App from './App';

declare global {
  interface Window {
    __EMBEDDED_GLB_MODELS__?: Record<string, string>;
  }
}

const el = document.getElementById('embedded-glb-models-b64');
if (el && el.textContent) {
  try {
    window.__EMBEDDED_GLB_MODELS__ = JSON.parse(el.textContent);
  } catch {
    // fallback to runtime glbBuilder
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<App isStandaloneHtml={true} />);
}
