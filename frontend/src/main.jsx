import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'  
import App from './App.jsx'
import { NotificationProvider } from './context/NotificationContext';

<<<<<<< HEAD
=======
// ⭐ FORCER LE THÈME AVANT LE RENDU
const savedTheme = localStorage.getItem('theme');
const rootElement = document.documentElement;

rootElement.classList.remove('light', 'dark');

if (savedTheme === 'dark') {
    rootElement.classList.add('dark');
} else if (savedTheme === 'light') {
    rootElement.classList.add('light');
} else {
    rootElement.classList.add('light');
    localStorage.setItem('theme', 'light');
}

>>>>>>> bouray/main
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </StrictMode>
);