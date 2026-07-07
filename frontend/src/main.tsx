import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { store } from './store';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </HelmetProvider>
  </React.StrictMode>
);

// Fade out the boot loader (defined in index.html) once React has painted.
requestAnimationFrame(() => {
  const loader = document.getElementById('app-loader');
  if (!loader) return;
  loader.classList.add('is-hiding');
  loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  setTimeout(() => loader.remove(), 900);
});
