import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'  
import App from './App.jsx'
import { NotificationProvider } from './context/NotificationContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </StrictMode>
);