import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'

const sendRendererError = (eventName, error, extra = {}) => {
  if (typeof window === 'undefined') {
    return
  }

  const logError = window.pulsoApp?.logError
  if (typeof logError !== 'function') {
    return
  }

  const payload = {
    event: eventName,
    message: error?.message || String(error),
    stack: error?.stack,
    meta: {
      ...extra,
      url: window.location?.href,
    },
  }

  try {
    logError(payload)
  } catch {
    // Ignore logging failures
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const error = event?.error || new Error(event?.message || 'Window error')
    sendRendererError('window_error', error, {
      filename: event?.filename,
      lineno: event?.lineno,
      colno: event?.colno,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const error =
      event?.reason instanceof Error
        ? event.reason
        : new Error(String(event?.reason || 'Unhandled rejection'))
    sendRendererError('unhandled_rejection', error)
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
