import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { store } from './store';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { RecentlyViewedProvider } from './context/viewManager';
import { WishlistProvider } from './context/wishlistContext';


const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <BrowserRouter>
          <RecentlyViewedProvider>
            <WishlistProvider>
              <App />
            </WishlistProvider>
          </RecentlyViewedProvider>
        </BrowserRouter>
      </Provider>
    </HelmetProvider>
  </React.StrictMode>
);
