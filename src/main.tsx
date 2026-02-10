import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'
import './lib/i18n' // Initialize i18n

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#1c1917',
          color: '#e7e5e4',
          border: '1px solid #292524',
        },
      }}
    />
  </React.StrictMode>,
)
