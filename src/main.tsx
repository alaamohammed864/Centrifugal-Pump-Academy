import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { useEffect, useState } from 'react';

function AppWithSplash() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - started;
      setProgress(Math.min(100, Math.round((elapsed / 3000) * 100)));
      if (elapsed >= 3000) {
        window.clearInterval(timer);
        setLoading(false);
      }
    }, 30);
    return () => window.clearInterval(timer);
  }, []);

  return <>
    <App />
    {loading && <div className="app-splash" role="status" aria-label="جاري تحميل التطبيق">
      <div className="app-splash__content">
        <img className="app-splash__logo" src="/assets/app-icon-source.png" alt="أكاديمية مضخات الطرد المركزي الذكية" />
        <div className="app-splash__track"><div className="app-splash__fill" style={{ width: `${progress}%` }} /></div>
        <span className="app-splash__percent">{progress}%</span>
      </div>
    </div>}
  </>;
}

createRoot(document.getElementById('root')!).render(<AppWithSplash />);
