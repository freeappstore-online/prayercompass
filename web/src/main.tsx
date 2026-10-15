import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Keep the browser's theme-color (status bar, PWA title bar) in step with the
// theme. The Shell's toggle sets data-theme on <html>; it starts from the
// system preference and remembers the user's choice.
const syncThemeColor = () => {
  const dark = document.documentElement.dataset.theme === 'dark'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#000000' : '#ffffff')
}
syncThemeColor()
new MutationObserver(syncThemeColor).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
