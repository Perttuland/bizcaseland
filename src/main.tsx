import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BusinessDataProvider } from './contexts/BusinessDataContext'

createRoot(document.getElementById("root")!).render(
  <BusinessDataProvider>
    <App />
  </BusinessDataProvider>
);
