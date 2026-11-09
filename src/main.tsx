import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ensureFreshCache } from './utils/helpers.ts';

// Invalidate obsolete local caches so reloading the browser instantly gets the latest catalog & photos
ensureFreshCache();

createRoot(document.getElementById('root')!).render(<App />);
