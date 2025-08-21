import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// Avoid React.StrictMode to prevent double effects in dev (which could
// fire calls twice). Keep it simple & predictable for a chat app setup.
createRoot(document.getElementById('root')).render(<App />)
