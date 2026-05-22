import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { RestaurantProvider } from './context/RestaurantContext.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <RestaurantProvider>
        <App />
      </RestaurantProvider>
    </HashRouter>
  </React.StrictMode>,
);
