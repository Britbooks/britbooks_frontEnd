import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { store } from './store';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { RecentlyViewedProvider } from './context/viewManager';


const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <RecentlyViewedProvider>           
          <App />
        </RecentlyViewedProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
