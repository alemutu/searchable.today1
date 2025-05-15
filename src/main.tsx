import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { initSessionTimeout } from './lib/supabase';

// Set security headers
const meta = document.createElement('meta');
meta.httpEquiv = 'Content-Security-Policy';
meta.content = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://storage.example.com https://*.pexels.com data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co";
document.head.appendChild(meta);

// Add X-XSS-Protection header
const xssProtection = document.createElement('meta');
xssProtection.httpEquiv = 'X-XSS-Protection';
xssProtection.content = '1; mode=block';
document.head.appendChild(xssProtection);

// Add X-Content-Type-Options header
const contentTypeOptions = document.createElement('meta');
contentTypeOptions.httpEquiv = 'X-Content-Type-Options';
contentTypeOptions.content = 'nosniff';
document.head.appendChild(contentTypeOptions);

// Add Referrer-Policy header
const referrerPolicy = document.createElement('meta');
referrerPolicy.name = 'referrer';
referrerPolicy.content = 'strict-origin-when-cross-origin';
document.head.appendChild(referrerPolicy);

// Initialize session timeout
initSessionTimeout();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);