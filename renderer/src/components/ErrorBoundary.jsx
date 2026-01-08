import { Component } from 'react'

const fallbackStyles = {
  wrapper:
    'h-screen w-screen flex items-center justify-center bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100',
  card:
    'max-w-lg w-full mx-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg dark:border-neutral-800 dark:bg-neutral-900',
  title: 'text-lg font-semibold mb-2',
  body: 'text-sm text-neutral-600 dark:text-neutral-400',
  button:
    'mt-4 inline-flex items-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200',
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    if (typeof window === 'undefined') {
      return
    }

    const logError = window.pulsoApp?.logError
    if (typeof logError !== 'function') {
      return
    }

    logError({
      event: 'renderer_error_boundary',
      message: error?.message || String(error),
      stack: error?.stack,
      meta: {
        url: window.location?.href,
      },
    })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className={fallbackStyles.wrapper}>
        <div className={fallbackStyles.card}>
          <h1 className={fallbackStyles.title}>Pulso IRC hit a problem</h1>
          <p className={fallbackStyles.body}>
            Something went wrong in the UI. You can reload the app to recover.
          </p>
          <button
            type="button"
            className={fallbackStyles.button}
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}

export { ErrorBoundary }
