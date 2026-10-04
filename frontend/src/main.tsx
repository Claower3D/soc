import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Suppress noisy devtools / browser warnings in console
if (typeof window !== 'undefined') {
  const origWarn = console.warn;
  console.warn = (...args: any[]) => {
    const text = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    if (
      text.includes('Backend session verification') ||
      text.includes('autocomplete attributes') ||
      text.includes('[DOM]')
    ) {
      return;
    }
    origWarn.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

