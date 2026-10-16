import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, MemoryRouter } from 'react-router-dom'
import './index.css'
import { App } from './App'
import { ThemeProvider } from './hooks/useTheme'
import { ToastProvider } from './components/ui/Toast'

// Inside Streamlit the page runs in an about:srcdoc iframe where URL-based routers throw; use in-memory routing there.
const Router = window.location.protocol === 'about:' ? MemoryRouter : HashRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider><ToastProvider><Router><App /></Router></ToastProvider></ThemeProvider>
  </StrictMode>,
)
